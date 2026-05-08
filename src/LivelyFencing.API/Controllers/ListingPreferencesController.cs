using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("listing-preferences")]
[Authorize(Policy = AuthorizationPolicies.AnyRole)]
public class ListingPreferencesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ListingPreferencesController(AppDbContext db) => _db = db;

    // Admin/Sales: get all preferences for a customer
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.Internal)]
    public async Task<IActionResult> List([FromQuery] Guid customerId)
    {
        var prefs = await _db.ListingPreferences
            .Where(p => p.CustomerId == customerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(prefs);
    }

    // Customer: get my own preferences
    [HttpGet("my")]
    public async Task<IActionResult> My()
    {
        var email = User.GetEmail();
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email);
        if (customer == null) return Ok(new List<object>());

        var prefs = await _db.ListingPreferences
            .Where(p => p.CustomerId == customer.Id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(prefs);
    }

    // Upsert a like/dislike reaction
    [HttpPost]
    public async Task<IActionResult> React([FromBody] ListingReactionRequest req)
    {
        var email = User.GetEmail();
        var role = User.GetRole();
        Guid customerId;

        if (role is "Admin" or "Sales")
        {
            if (!req.CustomerId.HasValue)
                return BadRequest(new { error = "customerId is required for admin/sales" });
            customerId = req.CustomerId.Value;
        }
        else
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email);
            if (customer == null)
            {
                // Auto-register: first time a CF-authenticated user interacts,
                // create their Customer record from JWT claims.
                customer = new Customer
                {
                    Email = email,
                    Name = User.Identity?.Name ?? email
                };
                _db.Customers.Add(customer);
                await _db.SaveChangesAsync();
            }
            customerId = customer.Id;
        }

        var existing = await _db.ListingPreferences.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.CustomerId == customerId && p.ListingKey == req.ListingKey);

        if (existing != null)
        {
            existing.Reaction = req.Reaction;
            existing.Notes = req.Notes;
            existing.IsDeleted = false;
            existing.DeletedAt = null;
            existing.DeletedByEmail = null;
        }
        else
        {
            _db.ListingPreferences.Add(new ListingPreference
            {
                CustomerId = customerId,
                ListingKey = req.ListingKey,
                ListingAddress = req.ListingAddress,
                ListingCity = req.ListingCity,
                ListingPrice = req.ListingPrice,
                ListingPhotoUrl = req.ListingPhotoUrl,
                Reaction = req.Reaction,
                Notes = req.Notes
            });
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    // Remove a reaction
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pref = await _db.ListingPreferences.FindAsync(id);
        if (pref == null) return NotFound();

        var email = User.GetEmail();
        var role = User.GetRole();

        if (role is not "Admin" and not "Sales")
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email);
            if (customer == null || customer.Id != pref.CustomerId)
                return Forbid();
        }

        pref.IsDeleted = true;
        pref.DeletedAt = DateTime.UtcNow;
        pref.DeletedByEmail = email;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ListingReactionRequest(
    string ListingKey,
    string ListingAddress,
    string? ListingCity,
    decimal? ListingPrice,
    string? ListingPhotoUrl,
    ListingReaction Reaction,
    string? Notes,
    Guid? CustomerId);
