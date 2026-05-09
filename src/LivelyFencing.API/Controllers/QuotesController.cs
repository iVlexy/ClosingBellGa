using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;
using LivelyFencing.API.Infrastructure.AI;
using LivelyFencing.API.Infrastructure.PDF;
using LivelyFencing.API.Infrastructure.Email;
using QuestPDF.Fluent;
using Pgvector;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("quotes")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class QuotesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly OllamaQuoteService _ai;
    private readonly SendGridEmailService _email;
    private readonly IConfiguration _config;

    public QuotesController(AppDbContext db, OllamaQuoteService ai, SendGridEmailService email, IConfiguration config)
    {
        _db = db; _ai = ai; _email = email; _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] QuoteStatus? status, [FromQuery] Guid? customerId)
    {
        var q = _db.Quotes.Include(x => x.Customer).Include(x => x.Job).AsQueryable();
        if (status.HasValue) q = q.Where(x => x.Status == status.Value);
        if (customerId.HasValue) q = q.Where(x => x.CustomerId == customerId.Value);
        return Ok(await q.OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.Id, x.Status, x.TotalAmount, x.ValidUntil, x.AIGenerated, x.CreatedAt, x.SentAt,
                Customer = new { x.Customer.Id, x.Customer.Name, x.Customer.Email },
                Job = new { x.Job.Id, x.Job.Title, FencingType = x.Job.FencingType.ToString() }
            }).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var q = await _db.Quotes.Include(x => x.Customer).Include(x => x.Job).Include(x => x.LineItems.OrderBy(li => li.SortOrder)).FirstOrDefaultAsync(x => x.Id == id);
        return q == null ? NotFound() : Ok(q);
    }

    [HttpPost("generate")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> GenerateAI([FromBody] GenerateQuoteRequest req)
    {
        var job = await _db.Jobs.Include(j => j.Customer).FirstOrDefaultAsync(j => j.Id == req.JobId);
        if (job == null) return BadRequest("Job not found");

        var suggestions = await _ai.GenerateQuoteAsync(
            job.Description ?? job.Title, job.FencingType.ToString(),
            job.LinearFeet, job.Height, job.Gates);

        var quote = new Quote
        {
            JobId = job.Id, CustomerId = job.CustomerId,
            AIGenerated = true,
            AIContextSnapshot = JsonSerializer.Serialize(new { jobId = job.Id, jobTitle = job.Title, generatedAt = DateTime.UtcNow }),
            Status = QuoteStatus.PendingApproval,
            ValidUntil = DateTime.UtcNow.AddDays(30)
        };

        int sortOrder = 0;
        foreach (var s in suggestions)
        {
            if (!Enum.TryParse<LineItemCategory>(s.Category, true, out var cat)) cat = LineItemCategory.Other;
            quote.LineItems.Add(new QuoteLineItem { Category = cat, Description = s.Description, Quantity = s.Quantity, UnitPrice = s.UnitPrice, SortOrder = sortOrder++ });
        }
        quote.TotalAmount = quote.LineItems.Sum(li => li.Quantity * li.UnitPrice);

        // Store job embedding for future AI use
        // (done asynchronously after response)
        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = quote.Id }, new { quote.Id, quote.Status, quote.TotalAmount, lineItemCount = quote.LineItems.Count });
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> CreateManual([FromBody] CreateQuoteRequest req)
    {
        var job = await _db.Jobs.Include(j => j.Customer).FirstOrDefaultAsync(j => j.Id == req.JobId);
        if (job == null) return BadRequest("Job not found");

        var quote = new Quote { JobId = job.Id, CustomerId = job.CustomerId, AIGenerated = false, Status = QuoteStatus.Draft, ValidUntil = req.ValidUntil ?? DateTime.UtcNow.AddDays(30), AdminNotes = req.AdminNotes };
        int sortOrder = 0;
        foreach (var li in req.LineItems ?? new List<LineItemRequest>())
        {
            quote.LineItems.Add(new QuoteLineItem { Category = li.Category, Description = li.Description, Quantity = li.Quantity, UnitPrice = li.UnitPrice, SortOrder = sortOrder++ });
        }
        quote.TotalAmount = quote.LineItems.Sum(li => li.Quantity * li.UnitPrice);
        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = quote.Id }, quote);
    }

    [HttpPut("{id}/lineitems")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> UpdateLineItems(Guid id, [FromBody] List<LineItemRequest> items)
    {
        var status = await _db.Quotes.Where(q => q.Id == id).Select(q => (QuoteStatus?)q.Status).FirstOrDefaultAsync();
        if (status == null) return NotFound();
        if (status is not (QuoteStatus.Draft or QuoteStatus.PendingApproval)) return BadRequest("Cannot edit a sent/accepted quote");

        // Delete old items directly — bypasses EF change tracker
        await _db.QuoteLineItems.Where(li => li.QuoteId == id).ExecuteDeleteAsync();

        // Insert new items
        var total = 0m;
        int sort = 0;
        var newItems = items.Select(li => {
            total += li.Quantity * li.UnitPrice;
            return new QuoteLineItem { QuoteId = id, Category = li.Category, Description = li.Description, Quantity = li.Quantity, UnitPrice = li.UnitPrice, SortOrder = sort++ };
        }).ToList();
        _db.QuoteLineItems.AddRange(newItems);
        await _db.SaveChangesAsync();

        // Update TotalAmount directly — bypasses EF change tracker
        await _db.Quotes.Where(q => q.Id == id).ExecuteUpdateAsync(s => s.SetProperty(q => q.TotalAmount, total));

        return Ok(new { id, total, lineItemCount = newItems.Count });
    }

    [HttpPatch("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> UpdateQuote(Guid id, [FromBody] UpdateQuoteRequest req)
    {
        var existing = await _db.Quotes.Where(q => q.Id == id)
            .Select(q => new { q.Status, q.ValidUntil }).FirstOrDefaultAsync();
        if (existing == null) return NotFound();
        if (existing.Status is not (QuoteStatus.Draft or QuoteStatus.PendingApproval))
            return BadRequest("Cannot edit a quote in this status");
        var newValidUntil = req.ValidUntil.HasValue ? DateTime.SpecifyKind(req.ValidUntil.Value, DateTimeKind.Utc) : existing.ValidUntil;
        // ExecuteUpdateAsync bypasses EF change tracker — no DbUpdateConcurrencyException
        await _db.Quotes.Where(q => q.Id == id).ExecuteUpdateAsync(s => s
            .SetProperty(q => q.ValidUntil, newValidUntil)
            .SetProperty(q => q.AdminNotes, req.AdminNotes));
        return Ok(new { id, validUntil = newValidUntil, adminNotes = req.AdminNotes });
    }

    [HttpPatch("{id}/approve")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest req)
    {
        var quote = await _db.Quotes.Include(q => q.LineItems).FirstOrDefaultAsync(q => q.Id == id);
        if (quote == null) return NotFound();
        if (quote.Status != QuoteStatus.PendingApproval) return BadRequest($"Cannot approve a quote in status {quote.Status}");
        quote.Status = QuoteStatus.Approved;
        if (req.AdminNotes != null) quote.AdminNotes = req.AdminNotes;
        await _db.SaveChangesAsync();
        return Ok(new { quote.Id, Status = quote.Status.ToString() });
    }

    [HttpPatch("{id}/reject")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest req)
    {
        var quote = await _db.Quotes.Include(q => q.LineItems).FirstOrDefaultAsync(q => q.Id == id);
        if (quote == null) return NotFound();
        if (quote.Status != QuoteStatus.PendingApproval) return BadRequest($"Cannot reject a quote in status {quote.Status}");
        quote.Status = QuoteStatus.Rejected;
        quote.AdminNotes = req.Reason;
        quote.RejectedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { quote.Id, Status = quote.Status.ToString() });
    }

    [HttpPatch("{id}/reopen")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Reopen(Guid id)
    {
        var quote = await _db.Quotes.FindAsync(id);
        if (quote == null) return NotFound();
        if (quote.Status != QuoteStatus.Rejected)
            return BadRequest("Only rejected quotes can be reopened");
        quote.Status = QuoteStatus.Draft;
        quote.RejectedAt = null;
        await _db.SaveChangesAsync();
        return Ok(new { quote.Id, Status = quote.Status.ToString() });
    }

    [HttpPatch("{id}/send")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Send(Guid id, CancellationToken ct)
    {
        var quote = await _db.Quotes
            .Include(q => q.Customer)
            .Include(q => q.Job)
            .Include(q => q.LineItems.OrderBy(li => li.SortOrder))
            .FirstOrDefaultAsync(q => q.Id == id, ct);
        if (quote == null) return NotFound();
        if (quote.Status != QuoteStatus.Approved && quote.Status != QuoteStatus.Draft) return BadRequest($"Cannot send a quote in status {quote.Status}");

        quote.Status = QuoteStatus.Sent;
        quote.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { quote.Id, Status = quote.Status.ToString() });
    }

    [HttpGet("{id}/pdf")]
    [Authorize(Policy = AuthorizationPolicies.Internal)]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var quote = await _db.Quotes
            .Include(q => q.Customer).Include(q => q.Job).Include(q => q.LineItems.OrderBy(li => li.SortOrder))
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quote == null) return NotFound();
        var portalBase = _config["App:PortalBaseUrl"] ?? "https://closingbellga.com";
        var pdf = new QuotePdfDocument(quote, portalBase);
        var bytes = pdf.GeneratePdf();
        return File(bytes, "application/pdf", $"LLES-Quote-{quote.Id.ToString()[..8].ToUpper()}.pdf");
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var quote = await _db.Quotes.FindAsync(id);
        if (quote == null) return NotFound();
        if (quote.Status == QuoteStatus.Accepted)
            return Conflict(new { message = "Cannot delete an accepted quote." });
        quote.IsDeleted = true;
        quote.DeletedAt = DateTime.UtcNow;
        quote.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// Portal — customer-facing, auth via Cloudflare JWT (Customer role)
[ApiController]
[Route("portal/quotes")]
[Authorize(Policy = AuthorizationPolicies.AnyRole)]
public class PortalController : ControllerBase
{
    private readonly AppDbContext _db;
    public PortalController(AppDbContext db) => _db = db;


    [HttpGet]
    public async Task<IActionResult> ListMyQuotes()
    {
        var email = User.GetEmail();
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        var quotes = await _db.Quotes
            .Include(q => q.Customer)
            .Include(q => q.Job)
            .Include(q => q.LineItems)
            .Where(q => q.Customer.Email.ToLower() == email.ToLower()
                      && (q.Status == QuoteStatus.Sent || q.Status == QuoteStatus.Accepted || q.Status == QuoteStatus.Rejected || q.Status == QuoteStatus.Expired))
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();
        return Ok(quotes);
    }

        [HttpGet("{token:guid}")]
    public async Task<IActionResult> GetByToken(Guid token)
    {
        var quote = await _db.Quotes
            .Include(q => q.Customer).Include(q => q.Job).Include(q => q.LineItems.OrderBy(li => li.SortOrder))
            .FirstOrDefaultAsync(q => q.PortalToken == token);
        if (quote == null) return NotFound();

        // Ensure customer ownership
        var email = User.GetEmail();
        if (!string.Equals(quote.Customer.Email, email, StringComparison.OrdinalIgnoreCase) && !User.IsAdmin())
            return StatusCode(403);

        return Ok(quote);
    }

    [HttpPost("{token:guid}/accept")]
    public async Task<IActionResult> Accept(Guid token)
    {
        var quote = await _db.Quotes.Include(q => q.Customer).FirstOrDefaultAsync(q => q.PortalToken == token);
        if (quote == null) return NotFound();
        var email = User.GetEmail();
        if (!string.Equals(quote.Customer.Email, email, StringComparison.OrdinalIgnoreCase) && !User.IsAdmin()) return StatusCode(403);
        if (quote.Status != QuoteStatus.Sent) return BadRequest($"Cannot accept a quote in status {quote.Status}");

        quote.Status = QuoteStatus.Accepted;
        quote.AcceptedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Quote accepted. We'll be in touch shortly!" });
    }

    [HttpPost("{token:guid}/reject")]
    public async Task<IActionResult> Reject(Guid token, [FromBody] CustomerRejectRequest req)
    {
        var quote = await _db.Quotes.Include(q => q.Customer).FirstOrDefaultAsync(q => q.PortalToken == token);
        if (quote == null) return NotFound();
        var email = User.GetEmail();
        if (!string.Equals(quote.Customer.Email, email, StringComparison.OrdinalIgnoreCase) && !User.IsAdmin()) return StatusCode(403);
        if (quote.Status != QuoteStatus.Sent) return BadRequest($"Cannot reject a quote in status {quote.Status}");

        quote.Status = QuoteStatus.Rejected;
        quote.RejectedAt = DateTime.UtcNow;
        quote.CustomerRejectionReason = req.Reason;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Quote declined." });
    }

    [HttpGet("{token:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid token, [FromServices] IConfiguration config)
    {
        var quote = await _db.Quotes.Include(q => q.Customer).Include(q => q.Job).Include(q => q.LineItems.OrderBy(li => li.SortOrder)).FirstOrDefaultAsync(q => q.PortalToken == token);
        if (quote == null) return NotFound();
        var email = User.GetEmail();
        if (!string.Equals(quote.Customer.Email, email, StringComparison.OrdinalIgnoreCase) && !User.IsAdmin()) return StatusCode(403);
        var portalBase = config["App:PortalBaseUrl"] ?? "https://closingbellga.com";
        var bytes = new QuotePdfDocument(quote, portalBase).GeneratePdf();
        return File(bytes, "application/pdf", $"LLES-Quote-{quote.Id.ToString()[..8].ToUpper()}.pdf");
    }
}

public record GenerateQuoteRequest(Guid JobId);
public record UpdateQuoteRequest(DateTime? ValidUntil, string? AdminNotes);
public record CreateQuoteRequest(Guid JobId, DateTime? ValidUntil, string? AdminNotes, List<LineItemRequest>? LineItems);
public record LineItemRequest(LineItemCategory Category, string Description, decimal Quantity, decimal UnitPrice);
public record ApproveRequest(string? AdminNotes);
public record RejectRequest(string Reason);
public record CustomerRejectRequest(string? Reason);
