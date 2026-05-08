using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("showings")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class ShowingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ShowingsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? clientId)
    {
        var q = _db.Showings.Include(s => s.Client).AsQueryable();
        if (clientId.HasValue) q = q.Where(s => s.ClientId == clientId.Value);
        var data = await q.OrderByDescending(s => s.ShowingDate).ToListAsync();
        return Ok(data.Select(s => new {
            s.Id, s.ClientId, ClientName = s.Client.Name,
            s.ListingKey, s.Address, s.ShowingDate, s.FeedbackRating, s.FeedbackNotes, s.CreatedAt
        }));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] ShowingRequest req)
    {
        var s = new Showing
        {
            ClientId = req.ClientId, ListingKey = req.ListingKey,
            Address = req.Address, ShowingDate = req.ShowingDate,
            FeedbackRating = req.FeedbackRating, FeedbackNotes = req.FeedbackNotes,
            CreatedByEmail = User.GetEmail()
        };
        _db.Showings.Add(s);
        await _db.SaveChangesAsync();
        await _db.Entry(s).Reference(x => x.Client).LoadAsync();
        return Ok(new { s.Id, s.ClientId, ClientName = s.Client.Name, s.ListingKey, s.Address, s.ShowingDate, s.FeedbackRating, s.FeedbackNotes, s.CreatedAt });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] ShowingRequest req)
    {
        var s = await _db.Showings.FindAsync(id);
        if (s == null) return NotFound();
        s.ClientId = req.ClientId; s.ListingKey = req.ListingKey;
        s.Address = req.Address; s.ShowingDate = req.ShowingDate;
        s.FeedbackRating = req.FeedbackRating; s.FeedbackNotes = req.FeedbackNotes;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await _db.Showings.FindAsync(id);
        if (s == null) return NotFound();
        s.IsDeleted = true; s.DeletedAt = DateTime.UtcNow; s.DeletedByEmail = User.GetEmail();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ShowingRequest(Guid ClientId, string? ListingKey, string Address, DateTime ShowingDate, int? FeedbackRating, string? FeedbackNotes);
