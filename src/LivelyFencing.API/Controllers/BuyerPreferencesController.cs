using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("buyer-preferences")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class BuyerPreferencesController : ControllerBase
{
    private readonly AppDbContext _db;
    public BuyerPreferencesController(AppDbContext db) => _db = db;

    [HttpGet("{clientId}")]
    public async Task<IActionResult> Get(Guid clientId)
    {
        var prefs = await _db.BuyerPreferences.FirstOrDefaultAsync(p => p.ClientId == clientId);
        return Ok(prefs);
    }

    [HttpPut("{clientId}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Upsert(Guid clientId, [FromBody] BuyerPrefsRequest req)
    {
        var prefs = await _db.BuyerPreferences.FirstOrDefaultAsync(p => p.ClientId == clientId);
        if (prefs == null)
        {
            prefs = new BuyerPreferences { ClientId = clientId };
            _db.BuyerPreferences.Add(prefs);
        }
        prefs.MinPrice = req.MinPrice; prefs.MaxPrice = req.MaxPrice;
        prefs.MinBeds = req.MinBeds; prefs.MaxBeds = req.MaxBeds;
        prefs.MinBaths = req.MinBaths; prefs.MaxBaths = req.MaxBaths;
        prefs.PreferredAreas = req.PreferredAreas;
        prefs.PropertyTypes = req.PropertyTypes;
        prefs.MustHaves = req.MustHaves;
        prefs.DealBreakers = req.DealBreakers;
        prefs.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(prefs);
    }
}

public record BuyerPrefsRequest(
    decimal? MinPrice, decimal? MaxPrice,
    int? MinBeds, int? MaxBeds,
    decimal? MinBaths, decimal? MaxBaths,
    string? PreferredAreas, string? PropertyTypes,
    string? MustHaves, string? DealBreakers);
