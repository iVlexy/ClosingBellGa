using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("customers")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search)
    {
        var q = _db.Customers.Where(c => c.IsActive);
        if (!string.IsNullOrEmpty(search))
            q = q.Where(c => c.Name.Contains(search) || c.Email.Contains(search) || (c.Company != null && c.Company.Contains(search)));
        return Ok(await q.OrderBy(c => c.Name).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var c = await _db.Customers.Include(x => x.Jobs).Include(x => x.Quotes).FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] CustomerRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var c = new Customer { Name = req.Name, Company = req.Company, Email = req.Email, Phone = req.Phone, BillingAddress = req.BillingAddress, City = req.City, State = req.State, Zip = req.Zip };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = c.Id }, c);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CustomerRequest req)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = req.Name; c.Company = req.Company; c.Email = req.Email;
        c.Phone = req.Phone; c.BillingAddress = req.BillingAddress; c.City = req.City; c.State = req.State; c.Zip = req.Zip;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CustomerRequest(string Name, string? Company, string Email, string? Phone, string? BillingAddress, string? City, string? State, string? Zip);
