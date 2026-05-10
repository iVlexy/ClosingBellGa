using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Enums;

namespace LivelyFencing.API.Infrastructure.Background;

public class TransactionAutoAdvanceService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransactionAutoAdvanceService> _logger;

    public TransactionAutoAdvanceService(IServiceScopeFactory scopeFactory, ILogger<TransactionAutoAdvanceService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Short startup delay, then check every 24 hours
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            await AdvanceTransactions(stoppingToken);
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task AdvanceTransactions(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var today = DateTime.UtcNow.Date;

            var active = await db.Transactions
                .Where(t => !t.IsDeleted
                    && t.Status != TransactionStatus.Closed
                    && t.Status != TransactionStatus.FallThrough)
                .ToListAsync(ct);

            int advanced = 0;
            foreach (var t in active)
            {
                // OfferSubmitted → UnderContract when binding/contract date arrives
                if (t.Status == TransactionStatus.OfferSubmitted
                    && t.ContractDate.HasValue && t.ContractDate.Value.Date <= today)
                { t.Status = TransactionStatus.UnderContract; advanced++; }

                // UnderContract → FinanceContingency when due diligence period ends
                else if (t.Status == TransactionStatus.UnderContract
                    && t.DueDiligenceEndDate.HasValue && t.DueDiligenceEndDate.Value.Date <= today)
                { t.Status = TransactionStatus.FinanceContingency; advanced++; }

                // FinanceContingency → ClearToClose when finance contingency expires
                else if (t.Status == TransactionStatus.FinanceContingency
                    && t.FinanceContingencyDate.HasValue && t.FinanceContingencyDate.Value.Date <= today)
                { t.Status = TransactionStatus.ClearToClose; advanced++; }

                // ClearToClose → Closed on closing day
                else if (t.Status == TransactionStatus.ClearToClose
                    && t.ClosingDate.HasValue && t.ClosingDate.Value.Date <= today)
                { t.Status = TransactionStatus.Closed; advanced++; }
            }

            if (advanced > 0)
            {
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Auto-advanced {Count} transaction(s) based on key dates", advanced);
            }
            else
            {
                _logger.LogDebug("TransactionAutoAdvance: no changes needed today");
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error in TransactionAutoAdvanceService");
        }
    }
}
