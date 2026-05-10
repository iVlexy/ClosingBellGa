using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using System.Globalization;
using System.Text.RegularExpressions;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("webhooks")]
[AllowAnonymous]
public class TcEmailWebhookController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<TcEmailWebhookController> _logger;

    public TcEmailWebhookController(AppDbContext db, IConfiguration config,
        ILogger<TcEmailWebhookController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// SendGrid Inbound Parse webhook — receives TC coordinator emails forwarded
    /// by Brandon, then auto-creates the client and transaction.
    ///
    /// Secured by a shared secret query parameter.
    /// POST /webhooks/tc-email?secret=XXX
    /// </summary>
    [HttpPost("tc-email")]
    [Consumes("multipart/form-data", "application/x-www-form-urlencoded")]
    public async Task<IActionResult> IngestTcEmail([FromQuery] string? secret)
    {
        // ── Verify shared secret ──────────────────────────────────────────────
        var expected = _config["TC_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(expected) || secret != expected)
        {
            _logger.LogWarning("TC email webhook: unauthorized attempt");
            return Unauthorized(new { error = "Invalid or missing secret" });
        }

        // ── Read SendGrid Inbound Parse fields ────────────────────────────────
        var form = Request.Form;
        var subject = form["subject"].ToString().Trim();
        var textBody = form["text"].ToString();
        var fromField = form["from"].ToString();

        _logger.LogInformation("TC email webhook received. Subject: {Subject}", subject);

        // ── Extract property address from subject ─────────────────────────────
        // Expected format: "New contract - 5831 Ridgedale Ct, Gainesville, GA 30506"
        string? address = null;
        var subjectMatch = Regex.Match(subject,
            @"new\s+contract\s*[-\u2013]\s*(.+)", RegexOptions.IgnoreCase);
        if (subjectMatch.Success)
            address = subjectMatch.Groups[1].Value.Trim();

        // ── Extract buyer name + email from body ──────────────────────────────
        // Lines like: "Jason Rel - Teamrelrod@gmail.com"
        //             "Whitney Rel - whitneyrel@gmail.com"
        string? buyerName = null;
        string? buyerEmail = null;
        foreach (var line in textBody.Split('\n'))
        {
            var trimmed = line.Trim();
            // Match "Some Name - email@domain.com"
            var buyerMatch = Regex.Match(trimmed,
                @"^([A-Za-z][\w\s\-']+?)\s*[-\u2013]\s*([^\s@]+@[^\s@]+\.[^\s@]+)$");
            if (buyerMatch.Success)
            {
                buyerName = buyerMatch.Groups[1].Value.Trim();
                buyerEmail = buyerMatch.Groups[2].Value.Trim().ToLowerInvariant();
                break; // Use first buyer
            }
        }

        // Fall back to "from" field if no buyer line found
        if (buyerEmail == null)
        {
            var fromEmailMatch = Regex.Match(fromField, @"[\w.+-]+@[\w.-]+\.\w+");
            if (fromEmailMatch.Success)
                buyerEmail = fromEmailMatch.Value.ToLowerInvariant();
            buyerName ??= "Unknown Buyer";
        }

        if (string.IsNullOrEmpty(buyerEmail))
        {
            _logger.LogError("TC email webhook: could not extract buyer email. Body snippet: {Snippet}",
                textBody[..Math.Min(200, textBody.Length)]);
            return BadRequest(new { error = "Could not extract buyer email from email body" });
        }

        // ── Extract dates ─────────────────────────────────────────────────────
        var contractDate           = ExtractDate(textBody, @"binding\s+agreement\s+date\s*[:\-]?\s*([\d/]+)");
        var earnestMoneyDate       = ExtractDate(textBody, @"earnest\s+money\s*[:\-]?\s*([\d/]+)");
        var dueDiligenceEndDate    = ExtractDate(textBody, @"due\s+diligence\s+(?:period|end)?\s*[:\-]?\s*([\d/]+)");
        var financeContingencyDate = ExtractDate(textBody, @"finance\s+contingency\s+ends?\s*[:\-]?\s*([\d/]+)");
        var cdDueDate              = ExtractDate(textBody, @"cd\s+due\s*[:\-]?\s*([\d/]+)");
        var closingDate            = ExtractDate(textBody, @"closing\s+date\s*[:\-]?\s*([\d/]+)");

        // ── Find or create Customer ───────────────────────────────────────────
        // Bypass soft-delete filter for lookup
        var customer = await _db.Customers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Email == buyerEmail);

        bool newClient = customer == null;
        if (customer == null)
        {
            customer = new Customer
            {
                Name = buyerName ?? buyerEmail,
                Email = buyerEmail,
                IsActive = true,
                IsDeleted = false,
            };
            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();
            _logger.LogInformation("TC email webhook: created new customer {Name} <{Email}>",
                customer.Name, customer.Email);
        }
        else if (customer.IsDeleted)
        {
            // Restore soft-deleted customer
            customer.IsDeleted = false;
            customer.DeletedAt = null;
            customer.DeletedByEmail = null;
            customer.IsActive = true;
        }

        // ── Find or create Transaction ───────────────────────────────────────
        // If the client has an existing Prospecting transaction, update it.
        // If their deal has already moved forward, create a new transaction.
        var existingProspecting = await _db.Transactions
            .Where(t => t.ClientId == customer.Id && t.Status == TransactionStatus.Prospecting)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        bool transactionUpdated = existingProspecting != null;
        Transaction transaction;

        if (existingProspecting != null)
        {
            // Update the Prospecting transaction in-place
            transaction = existingProspecting;
            transaction.Address ??= address;
            if (address != null) transaction.Address = address;
            transaction.Status = TransactionStatus.UnderContract;
            transaction.ContractDate = contractDate ?? transaction.ContractDate;
            transaction.EarnestMoneyDate = earnestMoneyDate ?? transaction.EarnestMoneyDate;
            transaction.DueDiligenceEndDate = dueDiligenceEndDate ?? transaction.DueDiligenceEndDate;
            transaction.FinanceContingencyDate = financeContingencyDate ?? transaction.FinanceContingencyDate;
            transaction.CdDueDate = cdDueDate ?? transaction.CdDueDate;
            transaction.ClosingDate = closingDate ?? transaction.ClosingDate;
            transaction.Notes = (transaction.Notes != null ? transaction.Notes + "\n" : "")
                + $"Updated from TC email. Subject: {subject}";
            _logger.LogInformation(
                "TC email webhook: updated existing Prospecting transaction {Id} for client {Client}",
                transaction.Id, customer.Name);
        }
        else
        {
            transaction = new Transaction
            {
                ClientId = customer.Id,
                Address = address,
                Type = TransactionType.BuyerRepresentation,
                Status = TransactionStatus.UnderContract,
                ContractDate = contractDate,
                EarnestMoneyDate = earnestMoneyDate,
                DueDiligenceEndDate = dueDiligenceEndDate,
                FinanceContingencyDate = financeContingencyDate,
                CdDueDate = cdDueDate,
                ClosingDate = closingDate,
                CreatedByEmail = "tc-email-webhook",
                Notes = $"Auto-imported from TC email. Subject: {subject}",
            };
            _db.Transactions.Add(transaction);
            _logger.LogInformation(
                "TC email webhook: created new transaction for {Address} client {Client}",
                address ?? "(no address)", customer.Name);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            transactionId = transaction.Id,
            clientId = customer.Id,
            clientCreated = newClient,
            transactionUpdated,
            address,
            buyerName = customer.Name,
            buyerEmail = customer.Email,
            dates = new
            {
                contractDate,
                earnestMoneyDate,
                dueDiligenceEndDate,
                financeContingencyDate,
                cdDueDate,
                closingDate,
            }
        });
    }

    // ── Date extraction helper ────────────────────────────────────────────────
    private static DateTime? ExtractDate(string text, string pattern)
    {
        var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        var raw = match.Groups[1].Value.Trim().Split(' ')[0].TrimEnd(',');

        // MM/dd/yyyy
        if (DateTime.TryParseExact(raw, "MM/dd/yyyy",
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var d1))
            return DateTime.SpecifyKind(d1, DateTimeKind.Utc);
        // MM/dd/yy
        if (DateTime.TryParseExact(raw, "MM/dd/yy",
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var d2))
            return DateTime.SpecifyKind(d2, DateTimeKind.Utc);
        // MM/dd  => assume current year
        if (DateTime.TryParseExact(raw + "/" + DateTime.UtcNow.Year,
                "MM/dd/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d3))
            return DateTime.SpecifyKind(d3, DateTimeKind.Utc);

        return null;
    }
}
