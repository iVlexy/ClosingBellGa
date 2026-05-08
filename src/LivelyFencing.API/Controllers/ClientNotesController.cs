using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("client-notes")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class ClientNotesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ClientNotesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid clientId)
        => Ok(await _db.ClientNotes.Where(n => n.ClientId == clientId)
            .OrderByDescending(n => n.CreatedAt).ToListAsync());

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] ClientNoteRequest req)
    {
        var note = new ClientNote
        {
            ClientId = req.ClientId, Note = req.Note,
            NoteType = req.NoteType ?? "General",
            CreatedByEmail = User.GetEmail()
        };
        _db.ClientNotes.Add(note);
        await _db.SaveChangesAsync();
        return Ok(note);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var note = await _db.ClientNotes.FindAsync(id);
        if (note == null) return NotFound();
        note.IsDeleted = true; note.DeletedAt = DateTime.UtcNow; note.DeletedByEmail = User.GetEmail();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ClientNoteRequest(Guid ClientId, string Note, string? NoteType);
