using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("transactions")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TransactionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? clientId, [FromQuery] string? status)
    {
        var q = _db.Transactions.Include(t => t.Client).Include(t => t.Documents).AsQueryable();
        if (clientId.HasValue) q = q.Where(t => t.ClientId == clientId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TransactionStatus>(status, out var s))
            q = q.Where(t => t.Status == s);
        var data = await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(data.Select(t => MapTransaction(t)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var t = await _db.Transactions.Include(x => x.Client).Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id);
        return t == null ? NotFound() : Ok(MapTransaction(t));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] TransactionRequest req)
    {
        if (!Enum.TryParse<TransactionType>(req.Type, out var type)) return BadRequest("Invalid type");
        var t = new Transaction
        {
            ClientId = req.ClientId,
            ListingKey = req.ListingKey,
            Address = req.Address,
            Type = type,
            Status = req.Status != null && Enum.TryParse<TransactionStatus>(req.Status, out var st) ? st : TransactionStatus.Prospecting,
            OfferDate = req.OfferDate,
            ContractDate = req.ContractDate,
            InspectionDate = req.InspectionDate,
            AppraisalDate = req.AppraisalDate,
            ClosingDate = req.ClosingDate,
            SalePrice = req.SalePrice,
            CommissionRate = req.CommissionRate,
            CommissionExpected = req.CommissionExpected,
            CommissionReceived = req.CommissionReceived,
            Notes = req.Notes,
            CreatedByEmail = User.GetEmail()
        };
        _db.Transactions.Add(t);
        await _db.SaveChangesAsync();
        await _db.Entry(t).Reference(x => x.Client).LoadAsync();
        return Ok(MapTransaction(t));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] TransactionRequest req)
    {
        var t = await _db.Transactions.FindAsync(id);
        if (t == null) return NotFound();
        if (!Enum.TryParse<TransactionType>(req.Type, out var type)) return BadRequest("Invalid type");
        t.ClientId = req.ClientId;
        t.ListingKey = req.ListingKey;
        t.Address = req.Address;
        t.Type = type;
        t.Status = req.Status != null && Enum.TryParse<TransactionStatus>(req.Status, out var st) ? st : t.Status;
        t.OfferDate = req.OfferDate;
        t.ContractDate = req.ContractDate;
        t.InspectionDate = req.InspectionDate;
        t.AppraisalDate = req.AppraisalDate;
        t.ClosingDate = req.ClosingDate;
        t.SalePrice = req.SalePrice;
        t.CommissionRate = req.CommissionRate;
        t.CommissionExpected = req.CommissionExpected;
        t.CommissionReceived = req.CommissionReceived;
        t.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] TxStatusRequest req)
    {
        var t = await _db.Transactions.FindAsync(id);
        if (t == null) return NotFound();
        if (!Enum.TryParse<TransactionStatus>(req.Status, out var s)) return BadRequest("Invalid status");
        t.Status = s;
        await _db.SaveChangesAsync();
        return Ok(new { t.Id, Status = t.Status.ToString() });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var t = await _db.Transactions.FindAsync(id);
        if (t == null) return NotFound();
        t.IsDeleted = true; t.DeletedAt = DateTime.UtcNow; t.DeletedByEmail = User.GetEmail();
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/documents")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> AddDoc(Guid id, [FromBody] DocRequest req)
    {
        var doc = new TransactionDocument
        {
            TransactionId = id,
            Name = req.Name,
            Status = req.Status != null && Enum.TryParse<DocumentStatus>(req.Status, out var ds) ? ds : DocumentStatus.Pending,
            DueDate = req.DueDate,
            Notes = req.Notes
        };
        _db.TransactionDocuments.Add(doc);
        await _db.SaveChangesAsync();
        return Ok(new { doc.Id, doc.TransactionId, doc.Name, Status = doc.Status.ToString(), doc.DueDate, doc.Notes, doc.CreatedAt });
    }

    [HttpPut("{id}/documents/{docId}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> UpdateDoc(Guid id, Guid docId, [FromBody] DocRequest req)
    {
        var doc = await _db.TransactionDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.TransactionId == id);
        if (doc == null) return NotFound();
        doc.Name = req.Name;
        doc.Status = req.Status != null && Enum.TryParse<DocumentStatus>(req.Status, out var ds) ? ds : doc.Status;
        doc.DueDate = req.DueDate;
        doc.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return Ok(new { doc.Id, doc.TransactionId, doc.Name, Status = doc.Status.ToString(), doc.DueDate, doc.Notes });
    }

    [HttpDelete("{id}/documents/{docId}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> DeleteDoc(Guid id, Guid docId)
    {
        var doc = await _db.TransactionDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.TransactionId == id);
        if (doc == null) return NotFound();
        _db.TransactionDocuments.Remove(doc);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static object MapTransaction(Transaction t) => new
    {
        t.Id, t.ClientId,
        ClientName = t.Client?.Name ?? "",
        ClientEmail = t.Client?.Email ?? "",
        t.ListingKey, t.Address,
        Type = t.Type.ToString(),
        Status = t.Status.ToString(),
        t.OfferDate, t.ContractDate, t.InspectionDate, t.AppraisalDate, t.ClosingDate,
        t.SalePrice, t.CommissionRate, t.CommissionExpected, t.CommissionReceived,
        t.Notes, t.CreatedByEmail, t.CreatedAt,
        Documents = t.Documents.Select(d => new { d.Id, d.Name, Status = d.Status.ToString(), d.DueDate, d.Notes, d.CreatedAt }).ToList()
    };
}

public record TransactionRequest(
    Guid ClientId, string? ListingKey, string? Address, string Type, string? Status,
    DateTime? OfferDate, DateTime? ContractDate, DateTime? InspectionDate,
    DateTime? AppraisalDate, DateTime? ClosingDate,
    decimal? SalePrice, decimal? CommissionRate, decimal? CommissionExpected, decimal? CommissionReceived,
    string? Notes);

public record DocRequest(string Name, string? Status, DateTime? DueDate, string? Notes);
public record TxStatusRequest(string Status);
