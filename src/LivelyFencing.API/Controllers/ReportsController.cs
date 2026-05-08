using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("reports")]
[Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue([FromQuery] int year, [FromQuery] int? quarter)
    {
        var q = _db.Quotes.Where(x => x.Status == QuoteStatus.Accepted && x.AcceptedAt.HasValue && x.AcceptedAt.Value.Year == year);
        if (quarter.HasValue)
        {
            var (startMonth, endMonth) = quarter.Value switch { 1 => (1, 3), 2 => (4, 6), 3 => (7, 9), _ => (10, 12) };
            q = q.Where(x => x.AcceptedAt!.Value.Month >= startMonth && x.AcceptedAt.Value.Month <= endMonth);
        }
        var data = await q.GroupBy(x => new { x.AcceptedAt!.Value.Year, x.AcceptedAt.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Revenue = g.Sum(x => x.TotalAmount), QuoteCount = g.Count() })
            .OrderBy(x => x.Year).ThenBy(x => x.Month).ToListAsync();
        return Ok(new { Year = year, Quarter = quarter, Total = data.Sum(d => d.Revenue), ByMonth = data });
    }

    [HttpGet("contractor-payments")]
    public async Task<IActionResult> ContractorPayments([FromQuery] int year)
    {
        var data = await _db.ContractorPayments
            .Where(p => p.TaxYear == year)
            .GroupBy(p => new { p.ContractorId, p.Contractor.Name, p.Contractor.Email })
            .Select(g => new { g.Key.ContractorId, g.Key.Name, g.Key.Email, TotalPaid = g.Sum(p => p.Amount), PaymentCount = g.Count() })
            .OrderByDescending(x => x.TotalPaid)
            .ToListAsync();
        return Ok(new { Year = year, TotalContractors = data.Count, TotalPaid = data.Sum(d => d.TotalPaid), Contractors = data });
    }

    [HttpGet("job-summary")]
    public async Task<IActionResult> JobSummary([FromQuery] int year)
    {
        var jobs = await _db.Jobs
            .Where(j => j.CreatedAt.Year == year)
            .Include(j => j.Customer)
            .Include(j => j.Quotes.Where(q => q.Status == QuoteStatus.Accepted))
            .ToListAsync();

        var contractorCostsByJob = await _db.ContractorPayments
            .Where(p => p.TaxYear == year && p.JobId.HasValue)
            .GroupBy(p => p.JobId!.Value)
            .Select(g => new { JobId = g.Key, Cost = g.Sum(p => p.Amount) })
            .ToDictionaryAsync(x => x.JobId, x => x.Cost);

        var summary = jobs.Select(j =>
        {
            var revenue = j.Quotes.Sum(q => q.TotalAmount);
            var cost = contractorCostsByJob.GetValueOrDefault(j.Id);
            return new { j.Id, j.Title, FencingType = j.FencingType.ToString(), Status = j.Status.ToString(), Customer = j.Customer.Name, Revenue = revenue, ContractorCost = cost, GrossMargin = revenue - cost, j.CreatedAt };
        }).OrderByDescending(x => x.Revenue).ToList();

        return Ok(new { Year = year, TotalJobs = summary.Count, TotalRevenue = summary.Sum(s => s.Revenue), TotalContractorCost = summary.Sum(s => s.ContractorCost), Jobs = summary });
    }

    [HttpGet("tax-summary")]
    public async Task<IActionResult> TaxSummary([FromQuery] int year)
    {
        var quotedRevenue = await _db.Quotes.Where(q => q.Status == QuoteStatus.Accepted && q.AcceptedAt.HasValue && q.AcceptedAt.Value.Year == year).SumAsync(q => q.TotalAmount);
        var otherIncome = await _db.Incomes.Where(i => i.Date.Year == year).SumAsync(i => (decimal?)i.Amount) ?? 0m;
        var totalRevenue = quotedRevenue + otherIncome;
        var contractorCosts = await _db.ContractorPayments.Where(p => p.TaxYear == year).SumAsync(p => p.Amount);
        var contractorCount = await _db.ContractorPayments.Where(p => p.TaxYear == year).Select(p => p.ContractorId).Distinct().CountAsync();
        var jobsCompleted = await _db.Jobs.Where(j => j.CompletedAt.HasValue && j.CompletedAt.Value.Year == year).CountAsync();
        var totalExpenses = await _db.Expenses.Where(e => e.Date.Year == year).SumAsync(e => (decimal?)e.Amount) ?? 0m;
        var expenseCount = await _db.Expenses.Where(e => e.Date.Year == year).CountAsync();

        return Ok(new { Year = year, QuotedRevenue = quotedRevenue, OtherIncome = otherIncome, TotalRevenue = totalRevenue, TotalContractorCosts = contractorCosts, TotalExpenses = totalExpenses, GrossProfit = totalRevenue - contractorCosts - totalExpenses, ContractorsPaid = contractorCount, CompletedJobs = jobsCompleted, ExpenseCount = expenseCount });
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