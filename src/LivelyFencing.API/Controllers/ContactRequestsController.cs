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
            Source = "Website"
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

        return Ok(new { message = "Thank you! We will be in touch shortly." });
    }
    [HttpGet]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = LivelyFencing.API.Infrastructure.Auth.AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> GetAll()
    {
        var leads = await _db.ContactRequests
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.Name, r.Email, r.Phone, r.Message, r.Source, r.CreatedAt, r.Contacted, r.ConvertedAt, r.ConvertedCustomerId
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
            Source = string.IsNullOrWhiteSpace(dto.Source) ? "Manual" : dto.Source.Trim()
        };
        _db.ContactRequests.Add(req);
        await _db.SaveChangesAsync();
        return Ok(new { req.Id, req.Name, req.Email, req.Phone, req.Message, req.Source, req.CreatedAt, req.Contacted, req.ConvertedAt, req.ConvertedCustomerId });
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
public record ContactSubmitDto(string Name, string Email, string? Phone, string? Message, string? Source);
public record ManualLeadDto(string Name, string Email, string? Phone, string? Message, string Source);
