using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("budgets")]
[Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BudgetsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? year) =>
        Ok(await _db.Budgets.Where(b => !year.HasValue || b.Year == year.Value)
            .Include(b => b.LineItems).OrderByDescending(b => b.Year).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var b = await _db.Budgets.Include(x => x.LineItems).FirstOrDefaultAsync(x => x.Id == id);
        return b == null ? NotFound() : Ok(b);
    }

    [HttpGet("{id}/actuals")]
    public async Task<IActionResult> GetActuals(Guid id)
    {
        var budget = await _db.Budgets.Include(b => b.LineItems).FirstOrDefaultAsync(b => b.Id == id);
        if (budget == null) return NotFound();

        var actuals = budget.LineItems.Select(li => new
        {
            li.Id, Category = li.Category.ToString(), li.Description, li.PlannedAmount,
            ActualAmount = 0m, Variance = li.PlannedAmount
        }).ToList();

        return Ok(new { budget.Id, budget.Name, budget.Year, LineItems = actuals, TotalPlanned = actuals.Sum(a => a.PlannedAmount), TotalActual = actuals.Sum(a => a.ActualAmount) });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BudgetRequest req)
    {
        var budget = new Budget { Name = req.Name, JobId = req.JobId, Year = req.Year, Description = req.Description };
        foreach (var li in req.LineItems)
            budget.LineItems.Add(new BudgetLineItem { Category = li.Category, Description = li.Description, PlannedAmount = li.PlannedAmount });
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = budget.Id }, budget);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BudgetRequest req)
    {
        var budget = await _db.Budgets.Include(b => b.LineItems).FirstOrDefaultAsync(b => b.Id == id);
        if (budget == null) return NotFound();
        budget.Name = req.Name; budget.Year = req.Year; budget.Description = req.Description;
        _db.BudgetLineItems.RemoveRange(budget.LineItems);
        foreach (var li in req.LineItems)
            budget.LineItems.Add(new BudgetLineItem { Category = li.Category, Description = li.Description, PlannedAmount = li.PlannedAmount });
        await _db.SaveChangesAsync();
        return Ok(budget);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var budget = await _db.Budgets.FindAsync(id);
        if (budget == null) return NotFound();
        budget.IsDeleted = true;
        budget.DeletedAt = DateTime.UtcNow;
        budget.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record BudgetRequest(string Name, Guid? JobId, int Year, string? Description, List<BudgetLineItemRequest> LineItems);
public record BudgetLineItemRequest(LineItemCategory Category, string Description, decimal PlannedAmount);
