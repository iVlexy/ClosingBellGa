using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("reports")]
[Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet("tax-summary")]
    public async Task<IActionResult> TaxSummary([FromQuery] int year)
    {
        var totalIncome = await _db.Incomes.Where(i => i.Date.Year == year).SumAsync(i => (decimal?)i.Amount) ?? 0m;
        var totalExpenses = await _db.Expenses.Where(e => e.Date.Year == year).SumAsync(e => (decimal?)e.Amount) ?? 0m;
        var expenseCount = await _db.Expenses.Where(e => e.Date.Year == year).CountAsync();

        return Ok(new { Year = year, TotalIncome = totalIncome, TotalExpenses = totalExpenses, GrossProfit = totalIncome - totalExpenses, ExpenseCount = expenseCount });
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> ExpenseSummary([FromQuery] int year)
    {
        var expenses = await _db.Expenses
            .Where(e => e.Date.Year == year)
            .ToListAsync();

        var byCategory = expenses
            .GroupBy(e => e.Category.ToString())
            .Select(g => new { Category = g.Key, Total = g.Sum(e => e.Amount), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .ToList();

        var byMonth = expenses
            .GroupBy(e => e.Date.Month)
            .Select(g => new { Month = g.Key, Total = g.Sum(e => e.Amount), Count = g.Count() })
            .OrderBy(x => x.Month)
            .ToList();

        return Ok(new {
            Year = year,
            Total = expenses.Sum(e => e.Amount),
            Count = expenses.Count,
            ByCategory = byCategory,
            ByMonth = byMonth
        });
    }

    [HttpGet("income")]
    public async Task<IActionResult> IncomeSummary([FromQuery] int year)
    {
        var incomes = await _db.Incomes
            .Where(i => i.Date.Year == year)
            .ToListAsync();

        var byCategory = incomes
            .GroupBy(i => i.Category.ToString())
            .Select(g => new { Category = g.Key, Total = g.Sum(i => i.Amount), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .ToList();

        var byMonth = incomes
            .GroupBy(i => i.Date.Month)
            .Select(g => new { Month = g.Key, Total = g.Sum(i => i.Amount), Count = g.Count() })
            .OrderBy(x => x.Month)
            .ToList();

        return Ok(new {
            Year = year,
            Total = incomes.Sum(i => i.Amount),
            Count = incomes.Count,
            ByCategory = byCategory,
            ByMonth = byMonth
        });
    }
    [HttpGet("pipeline-funnel")]
    public async Task<IActionResult> PipelineFunnel()
    {
        var leads = await _db.ContactRequests.ToListAsync();
        var showingClientIds = await _db.Showings.Select(s => s.ClientId).Distinct().ToListAsync();
        var showingSet = showingClientIds.ToHashSet();
        var txClientStatuses = await _db.Transactions
            .Select(t => new { t.ClientId, t.Status }).ToListAsync();
        var txByClient = txClientStatuses.GroupBy(t => t.ClientId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Status).ToList());

        var bySource = leads.GroupBy(l => string.IsNullOrWhiteSpace(l.Source) ? "Website" : l.Source);

        var result = bySource.Select(kv =>
        {
            var total = kv.Count();
            var convertedIds = kv.Where(l => l.ConvertedCustomerId.HasValue)
                .Select(l => l.ConvertedCustomerId!.Value).ToHashSet();
            var converted = convertedIds.Count;
            var hadShowing = convertedIds.Count(id => showingSet.Contains(id));
            var hadOffer = convertedIds.Count(id => txByClient.ContainsKey(id));
            var closed = convertedIds.Count(id => txByClient.ContainsKey(id) &&
                txByClient[id].Contains(TransactionStatus.Closed));
            return new
            {
                Source = kv.Key,
                TotalLeads = total,
                ConvertedToClient = converted,
                HadShowing = hadShowing,
                SubmittedOffer = hadOffer,
                Closed = closed
            };
        }).OrderByDescending(x => x.TotalLeads).ToList();

        return Ok(result);
    }

    [HttpGet("gci-summary")]
    public async Task<IActionResult> GciSummary([FromQuery] int year)
    {
        var transactions = await _db.Transactions
            .Where(t => t.Status == TransactionStatus.Closed
                && t.ClosingDate.HasValue
                && t.ClosingDate.Value.Year == year)
            .ToListAsync();

        var byMonth = transactions
            .GroupBy(t => t.ClosingDate!.Value.Month)
            .Select(g => new
            {
                Month = g.Key,
                ClosedCount = g.Count(),
                TotalVolume = g.Sum(t => t.SalePrice ?? 0),
                TotalCommission = g.Sum(t => t.CommissionReceived ?? t.CommissionExpected ?? 0)
            })
            .OrderBy(x => x.Month)
            .ToList();

        return Ok(new
        {
            Year = year,
            TotalClosings = transactions.Count,
            TotalVolume = transactions.Sum(t => t.SalePrice ?? 0),
            TotalGCI = transactions.Sum(t => t.CommissionReceived ?? t.CommissionExpected ?? 0),
            ByMonth = byMonth
        });
    }

}