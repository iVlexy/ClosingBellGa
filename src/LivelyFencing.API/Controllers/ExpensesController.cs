using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("expenses")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExpensesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> List([FromQuery] int? year, [FromQuery] string? category, CancellationToken ct)
    {
        var q = _db.Expenses.Include(e => e.Job).AsQueryable();
        if (year.HasValue) q = q.Where(e => e.Date.Year == year.Value);
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<ExpenseCategory>(category, out var cat))
            q = q.Where(e => e.Category == cat);
        var results = await q.OrderByDescending(e => e.Date).ToListAsync(ct);
        return Ok(results.Select(e => new {
            e.Id, e.Date, e.Amount, Category = e.Category.ToString(),
            e.Description, e.Vendor, e.JobId, JobTitle = e.Job?.Title,
            e.Notes, e.CreatedByEmail, e.CreatedAt
        }));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> Create([FromBody] ExpenseRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!Enum.TryParse<ExpenseCategory>(req.Category, out var cat)) return BadRequest("Invalid category");
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "";
        var expense = new Expense
        {
            Date = req.Date.ToUniversalTime(),
            Amount = req.Amount,
            Category = cat,
            Description = req.Description,
            Vendor = req.Vendor,
            JobId = req.JobId,
            Notes = req.Notes,
            CreatedByEmail = email
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync(ct);
        return Ok(new { expense.Id, expense.Date, expense.Amount, Category = expense.Category.ToString(), expense.Description, expense.Vendor, expense.JobId, expense.Notes, expense.CreatedAt });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
    public async Task<IActionResult> Update(Guid id, [FromBody] ExpenseRequest req, CancellationToken ct)
    {
        var expense = await _db.Expenses.FindAsync(new object[] { id }, ct);
        if (expense == null) return NotFound();
        if (!Enum.TryParse<ExpenseCategory>(req.Category, out var cat)) return BadRequest("Invalid category");
        expense.Date = req.Date.ToUniversalTime();
        expense.Amount = req.Amount;
        expense.Category = cat;
        expense.Description = req.Description;
        expense.Vendor = req.Vendor;
        expense.JobId = req.JobId;
        expense.Notes = req.Notes;
        await _db.SaveChangesAsync(ct);
        return Ok(new { expense.Id, expense.Date, expense.Amount, Category = expense.Category.ToString(), expense.Description, expense.Vendor, expense.JobId, expense.Notes });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var expense = await _db.Expenses.FindAsync(new object[] { id }, ct);
        if (expense == null) return NotFound();
        expense.IsDeleted = true;
        expense.DeletedAt = DateTime.UtcNow;
        expense.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record ExpenseRequest(DateTime Date, decimal Amount, string Category, string Description, string? Vendor, Guid? JobId, string? Notes);
