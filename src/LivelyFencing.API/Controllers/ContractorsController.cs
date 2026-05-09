using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure;
using LivelyFencing.API.Infrastructure.Auth;
using LivelyFencing.API.Infrastructure.PDF;
using QuestPDF.Fluent;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("contractors")]
[Authorize(Policy = AuthorizationPolicies.AdminOrAccountant)]
public class ContractorsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ContractorsController(AppDbContext db, IConfiguration config)
    {
        _db = db; _config = config;
    }

    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(await _db.Contractors.Where(c => c.IsActive)
            .Select(c => new { c.Id, c.Name, c.Email, c.Phone, c.City, c.State, TaxIdType = c.TaxIdType.ToString(), c.IsActive, c.CreatedAt })
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var c = await _db.Contractors.Include(x => x.Payments).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        var key = _config["Encryption:Key"]!;
        var maskedTaxId = EncryptionService.MaskTaxId(EncryptionService.Decrypt(c.TaxIdEncrypted, c.TaxIdIV, key));
        return Ok(new { c.Id, c.Name, c.Email, c.Phone, c.Address, c.City, c.State, c.Zip, TaxIdType = c.TaxIdType.ToString(), TaxId = maskedTaxId, c.IsActive, c.CreatedAt, Payments = c.Payments });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContractorRequest req)
    {
        var key = _config["Encryption:Key"]!;
        var (cipher, iv) = EncryptionService.Encrypt(req.TaxId, key);
        var contractor = new Contractor
        {
            Name = req.Name, Email = req.Email, Phone = req.Phone, Address = req.Address,
            City = req.City, State = req.State, Zip = req.Zip,
            TaxIdType = req.TaxIdType, TaxIdEncrypted = cipher, TaxIdIV = iv
        };
        _db.Contractors.Add(contractor);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = contractor.Id }, new { contractor.Id, contractor.Name });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ContractorRequest req)
    {
        var c = await _db.Contractors.FindAsync(id);
        if (c == null) return NotFound();
        var key = _config["Encryption:Key"]!;
        var (cipher, iv) = EncryptionService.Encrypt(req.TaxId, key);
        c.Name = req.Name; c.Email = req.Email; c.Phone = req.Phone; c.Address = req.Address;
        c.City = req.City; c.State = req.State; c.Zip = req.Zip;
        c.TaxIdType = req.TaxIdType; c.TaxIdEncrypted = cipher; c.TaxIdIV = iv;
        await _db.SaveChangesAsync();
        return Ok(new { c.Id, c.Name });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var contractor = await _db.Contractors.FindAsync(id);
        if (contractor == null) return NotFound();
        contractor.IsDeleted = true;
        contractor.DeletedAt = DateTime.UtcNow;
        contractor.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Payments
    [HttpGet("{id}/payments")]
    public async Task<IActionResult> GetPayments(Guid id, [FromQuery] int? year)
    {
        var q = _db.ContractorPayments.Where(p => p.ContractorId == id);
        if (year.HasValue) q = q.Where(p => p.TaxYear == year.Value);
        return Ok(await q.OrderByDescending(p => p.PaymentDate).ToListAsync());
    }

    [HttpPost("{id}/payments")]
    public async Task<IActionResult> AddPayment(Guid id, [FromBody] PaymentRequest req)
    {
        if (!await _db.Contractors.AnyAsync(c => c.Id == id)) return NotFound();
        var payment = new ContractorPayment
        {
            ContractorId = id, JobId = req.JobId, Amount = req.Amount,
            PaymentDate = req.PaymentDate, Description = req.Description,
            TaxYear = req.PaymentDate.Year
        };
        _db.ContractorPayments.Add(payment);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPayments), new { id }, payment);
    }

    [HttpDelete("{id}/payments/{paymentId}")]
    public async Task<IActionResult> DeletePayment(Guid id, Guid paymentId)
    {
        var p = await _db.ContractorPayments.FirstOrDefaultAsync(x => x.Id == paymentId && x.ContractorId == id);
        if (p == null) return NotFound();
        p.IsDeleted = true;
        p.DeletedAt = DateTime.UtcNow;
        p.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // 1099-NEC PDF
    [HttpGet("{id}/1099")]
    public async Task<IActionResult> Get1099(Guid id, [FromQuery] int year)
    {
        var contractor = await _db.Contractors.FindAsync(id);
        if (contractor == null) return NotFound();
        var key = _config["Encryption:Key"]!;
        var taxId = EncryptionService.Decrypt(contractor.TaxIdEncrypted, contractor.TaxIdIV, key);
        var totalPayments = await _db.ContractorPayments
            .Where(p => p.ContractorId == id && p.TaxYear == year)
            .SumAsync(p => p.Amount);

        var formData = new Form1099NecData(
            contractor, taxId, totalPayments, year,
            _config["Company:Name"] ?? "Closing Bell Real Estate",
            _config["Company:Address"] ?? "Your Address Here",
            _config["Company:TaxId"] ?? "XX-XXXXXXX"
        );

        var pdf = new Form1099NecDocument(formData);
        var bytes = pdf.GeneratePdf();
        return File(bytes, "application/pdf", $"1099-NEC-{contractor.Name.Replace(" ", "_")}-{year}.pdf");
    }
}

public record ContractorRequest(string Name, string Email, string? Phone, string? Address, string? City, string? State, string? Zip, TaxIdType TaxIdType, string TaxId);
public record PaymentRequest(Guid? JobId, decimal Amount, DateTime PaymentDate, string? Description);
