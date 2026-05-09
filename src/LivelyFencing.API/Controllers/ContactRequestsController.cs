using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Email;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("contact")]
public class ContactRequestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SendGridEmailService _email;
    private readonly ILogger<ContactRequestsController> _logger;

    public ContactRequestsController(AppDbContext db, SendGridEmailService email, ILogger<ContactRequestsController> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactSubmitDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { error = "Name and email are required." });

        var req = new ContactRequest
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone?.Trim() ?? "",
            Message = dto.Message?.Trim() ?? "",
            Source = string.IsNullOrWhiteSpace(dto.Source) ? "Website" : dto.Source.Trim(),
            HasLender = dto.HasLender ?? false,
            LenderName = dto.LenderName?.Trim()
        };
        _db.ContactRequests.Add(req);
        await _db.SaveChangesAsync();

        try
        {
            await _email.SendContactNotificationAsync(req.Name, req.Email, req.Phone, req.Message);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send contact notification for {Email}", req.Email);
        }

        try
        {
            var lenderLine = req.HasLender
                ? $"\n\nLender on file: {(string.IsNullOrWhiteSpace(req.LenderName) ? "Yes (name not provided)" : req.LenderName)}"
                : "";
            var confirmBody = $"""
Dear {req.Name},

Thank you for reaching out to Closing Bell Real Estate! We've received your consultation request and a member of our team will contact you within one business day to schedule your free, no-pressure consultation.{lenderLine}

In the meantime, feel free to browse available listings at www.ClosingBellGa.com or call us directly at 678.477.4786.

We look forward to helping you with your real estate journey!

Warm regards,
Brandon Bell
""";
            await _email.SendTemplateEmailAsync(req.Email, req.Name,
                "We received your consultation request — Closing Bell Real Estate",
                confirmBody);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send confirmation email to {Email}", req.Email);
        }

        return Ok(new { message = "Thank you! We will be in touch shortly." });
    }
    [HttpGet]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = LivelyFencing.API.Infrastructure.Auth.AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> GetAll()
    {
        var leads = await _db.ContactRequests
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.Name, r.Email, r.Phone, r.Message, r.Source, r.CreatedAt, r.Contacted, r.ConvertedAt, r.ConvertedCustomerId, r.HasLender, r.LenderName
            })
            .ToListAsync();
        return Ok(leads);
    }

    [HttpPatch("{id}/contacted")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = LivelyFencing.API.Infrastructure.Auth.AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> MarkContacted(Guid id)
    {
        var req = await _db.ContactRequests.FindAsync(id);
        if (req == null) return NotFound();
        req.Contacted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("manual")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = LivelyFencing.API.Infrastructure.Auth.AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> CreateManual([FromBody] ManualLeadDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { error = "Name and email are required." });
        var req = new ContactRequest
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone?.Trim() ?? "",
            Message = dto.Message?.Trim() ?? "",
            Source = string.IsNullOrWhiteSpace(dto.Source) ? "Manual" : dto.Source.Trim(),
            HasLender = dto.HasLender ?? false,
            LenderName = dto.LenderName?.Trim()
        };
        _db.ContactRequests.Add(req);
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, req.Name, req.Email, req.Phone, req.Message, req.Source, req.CreatedAt, req.Contacted, req.ConvertedAt, req.ConvertedCustomerId, req.HasLender, req.LenderName });
    }

    [HttpPatch("{id}/converted")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = LivelyFencing.API.Infrastructure.Auth.AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> MarkConverted(Guid id, [FromBody] ConvertedDto dto)
    {
        var req = await _db.ContactRequests.FindAsync(id);
        if (req == null) return NotFound();
        req.Contacted = true;
        req.ConvertedAt = DateTime.UtcNow;
        req.ConvertedCustomerId = dto.CustomerId;
        await _db.SaveChangesAsync();
        return NoContent();
    }

}

public record ConvertedDto(Guid? CustomerId);
public record ContactSubmitDto(string Name, string Email, string? Phone, string? Message, string? Source, bool? HasLender, string? LenderName);
public record ManualLeadDto(string Name, string Email, string? Phone, string? Message, string Source, bool? HasLender = null, string? LenderName = null);
