using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;
using LivelyFencing.API.Infrastructure.Email;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("email-templates")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class EmailTemplatesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly SendGridEmailService _email;
    private readonly ILogger<EmailTemplatesController> _logger;

    public EmailTemplatesController(AppDbContext db, SendGridEmailService email, ILogger<EmailTemplatesController> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List()
        => Ok(await _db.EmailTemplates.OrderBy(t => t.Stage).ThenBy(t => t.Name).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var t = await _db.EmailTemplates.FindAsync(id);
        return t == null ? NotFound() : Ok(t);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] EmailTemplateRequest req)
    {
        var t = new EmailTemplate { Name = req.Name, Stage = req.Stage, Subject = req.Subject, Body = req.Body, IsActive = req.IsActive };
        _db.EmailTemplates.Add(t);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = t.Id }, t);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] EmailTemplateRequest req)
    {
        var t = await _db.EmailTemplates.FindAsync(id);
        if (t == null) return NotFound();
        t.Name = req.Name; t.Stage = req.Stage; t.Subject = req.Subject;
        t.Body = req.Body; t.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpPost("{id}/send")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Send(Guid id, [FromBody] SendTemplateRequest req)
    {
        var template = await _db.EmailTemplates.FindAsync(id);
        if (template == null) return NotFound("Template not found.");

        var client = await _db.Customers.FindAsync(req.ClientId);
        if (client == null) return NotFound("Client not found.");
        if (string.IsNullOrWhiteSpace(client.Email))
            return BadRequest(new { message = "This client does not have an email address on file." });

        var today = DateTime.Today.ToString("MMMM d, yyyy");
        var address = req.Address ?? string.Empty;

        string Sub(string text) => text
            .Replace("[ClientName]", client.Name)
            .Replace("[Address]",    address)
            .Replace("[Date]",       today)
            .Replace("[AgentName]",  "Brandon Bell");

        try
        {
            await _email.SendTemplateEmailAsync(client.Email, client.Name, Sub(template.Subject), Sub(template.Body));
            return Ok(new { message = $"Email sent to {client.Email}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send template email to {Email}", client.Email);
            return StatusCode(502, new { message = "Email delivery failed. The SendGrid API key may not be configured — please contact your administrator." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var t = await _db.EmailTemplates.FindAsync(id);
        if (t == null) return NotFound();
        t.IsDeleted = true; t.DeletedAt = DateTime.UtcNow; t.DeletedByEmail = User.GetEmail();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record EmailTemplateRequest(string Name, string Stage, string Subject, string Body, bool IsActive);
public record SendTemplateRequest(Guid ClientId, string? Address);
