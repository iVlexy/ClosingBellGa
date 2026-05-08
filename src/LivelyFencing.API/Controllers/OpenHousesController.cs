using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("open-houses")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class OpenHousesController : ControllerBase
{
    private readonly AppDbContext _db;
    public OpenHousesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? address)
    {
        var q = _db.OpenHouseAttendees.AsQueryable();
        if (!string.IsNullOrEmpty(address))
            q = q.Where(x => x.Address.Contains(address));
        return Ok(await q.OrderByDescending(x => x.EventDate).ToListAsync());
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] OpenHouseRequest req)
    {
        var a = new OpenHouseAttendee
        {
            ListingKey = req.ListingKey, Address = req.Address,
            EventDate = req.EventDate, Name = req.Name,
            Phone = req.Phone, Email = req.Email,
            IsPreApproved = req.IsPreApproved, AgentNotes = req.AgentNotes
        };
        _db.OpenHouseAttendees.Add(a);
        await _db.SaveChangesAsync();
        return Ok(a);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] OpenHouseRequest req)
    {
        var a = await _db.OpenHouseAttendees.FindAsync(id);
        if (a == null) return NotFound();
        a.ListingKey = req.ListingKey; a.Address = req.Address;
        a.EventDate = req.EventDate; a.Name = req.Name;
        a.Phone = req.Phone; a.Email = req.Email;
        a.IsPreApproved = req.IsPreApproved; a.AgentNotes = req.AgentNotes;
        await _db.SaveChangesAsync();
        return Ok(a);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var a = await _db.OpenHouseAttendees.FindAsync(id);
        if (a == null) return NotFound();
        a.IsDeleted = true; a.DeletedAt = DateTime.UtcNow; a.DeletedByEmail = User.GetEmail();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record OpenHouseRequest(string? ListingKey, string Address, DateTime EventDate, string Name, string? Phone, string? Email, bool IsPreApproved, string? AgentNotes);
