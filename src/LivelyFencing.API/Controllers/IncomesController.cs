using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("incomes")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class IncomesController : ControllerBase
{
    private readonly AppDbContext _db;
    public IncomesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> List([FromQuery] int? year, [FromQuery] string? category, CancellationToken ct)
    {
        var q = _db.Incomes.Include(i => i.Job).AsQueryable();
        if (year.HasValue) q = q.Where(i => i.Date.Year == year.Value);
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<IncomeCategory>(category, out var cat))
            q = q.Where(i => i.Category == cat);
        var results = await q.OrderByDescending(i => i.Date).ToListAsync(ct);
        return Ok(results.Select(i => new {
            i.Id, i.Date, i.Amount, Category = i.Category.ToString(),
            i.Description, i.JobId, JobTitle = i.Job?.Title,
            i.QuoteId, i.Notes, i.CreatedByEmail, i.CreatedAt
        }));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> Create([FromBody] IncomeRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!Enum.TryParse<IncomeCategory>(req.Category, out var cat)) return BadRequest("Invalid category");
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "";
        var income = new Income
        {
            Date = req.Date.ToUniversalTime(),
            Amount = req.Amount,
            Category = cat,
            Description = req.Description,
            JobId = req.JobId,
            QuoteId = req.QuoteId,
            Notes = req.Notes,
            CreatedByEmail = email
        };
        _db.Incomes.Add(income);
        await _db.SaveChangesAsync(ct);
        return Ok(new { income.Id, income.Date, income.Amount, Category = income.Category.ToString(), income.Description, income.JobId, income.QuoteId, income.Notes, income.CreatedAt });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> Update(Guid id, [FromBody] IncomeRequest req, CancellationToken ct)
    {
        var income = await _db.Incomes.FindAsync(new object[] { id }, ct);
        if (income == null) return NotFound();
        if (!Enum.TryParse<IncomeCategory>(req.Category, out var cat)) return BadRequest("Invalid category");
        income.Date = req.Date.ToUniversalTime();
        income.Amount = req.Amount;
        income.Category = cat;
        income.Description = req.Description;
        income.JobId = req.JobId;
        income.QuoteId = req.QuoteId;
        income.Notes = req.Notes;
        await _db.SaveChangesAsync(ct);
        return Ok(new { income.Id, income.Date, income.Amount, Category = income.Category.ToString(), income.Description, income.JobId, income.QuoteId, income.Notes });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var income = await _db.Incomes.FindAsync(new object[] { id }, ct);
        if (income == null) return NotFound();
        income.IsDeleted = true;
        income.DeletedAt = DateTime.UtcNow;
        income.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record IncomeRequest(DateTime Date, decimal Amount, string Category, string Description, Guid? JobId, Guid? QuoteId, string? Notes);
