using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("jobs")]
[Authorize(Policy = AuthorizationPolicies.Internal)]
public class JobsController : ControllerBase
{
    private readonly AppDbContext _db;
    public JobsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? customerId, [FromQuery] JobStatus? status)
    {
        var q = _db.Jobs.Include(j => j.Customer).AsQueryable();
        if (customerId.HasValue) q = q.Where(j => j.CustomerId == customerId.Value);
        if (status.HasValue) q = q.Where(j => j.Status == status.Value);
        return Ok(await q.OrderByDescending(j => j.CreatedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var j = await _db.Jobs.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        return j == null ? NotFound() : Ok(j);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Create([FromBody] JobRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!await _db.Customers.AnyAsync(c => c.Id == req.CustomerId)) return BadRequest("Customer not found");
        var job = new Job
        {
            CustomerId = req.CustomerId, Title = req.Title, Description = req.Description,
            FencingType = req.FencingType, LinearFeet = req.LinearFeet, Height = req.Height,
            Gates = req.Gates, Location = req.Location, Notes = req.Notes
        };
        _db.Jobs.Add(job);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = job.Id }, job);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> Update(Guid id, [FromBody] JobRequest req)
    {
        var job = await _db.Jobs.FindAsync(id);
        if (job == null) return NotFound();
        job.Title = req.Title; job.Description = req.Description; job.FencingType = req.FencingType;
        job.LinearFeet = req.LinearFeet; job.Height = req.Height; job.Gates = req.Gates;
        job.Location = req.Location; job.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return Ok(job);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateJobStatusRequest req)
    {
        var job = await _db.Jobs.FindAsync(id);
        if (job == null) return NotFound();
        job.Status = req.Status;
        if (req.Status == JobStatus.Completed) job.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { job.Id, Status = job.Status.ToString() });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var job = await _db.Jobs.FindAsync(id);
        if (job == null) return NotFound();
        job.Status = JobStatus.Cancelled;
        job.IsDeleted = true;
        job.DeletedAt = DateTime.UtcNow;
        job.DeletedByEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "unknown";
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record JobRequest(Guid CustomerId, string Title, string? Description, FencingType FencingType, decimal? LinearFeet, decimal? Height, int? Gates, string? Location, string? Notes);
public record UpdateJobStatusRequest(JobStatus Status);
