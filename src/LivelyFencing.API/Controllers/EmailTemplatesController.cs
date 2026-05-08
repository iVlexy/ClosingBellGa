using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("email-templates")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class EmailTemplatesController : ControllerBase
{
    private readonly AppDbContext _db;
    public EmailTemplatesController(AppDbContext db) => _db = db;

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
