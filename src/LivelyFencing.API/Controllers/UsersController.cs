using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using LivelyFencing.API.Infrastructure.Auth;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("users")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(await _db.Users.Select(u => new { u.Id, u.Email, u.Name, Role = u.Role.ToString(), u.CreatedAt, u.LastLoginAt, u.IsActive }).ToListAsync());

    [HttpPatch("{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest req)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (!Enum.TryParse<UserRole>(req.Role, out var role)) return BadRequest("Invalid role");
        user.Role = role;
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.Email, Role = user.Role.ToString() });
    }

    [HttpPatch("{id}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest req)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = req.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record UpdateRoleRequest(string Role);
public record SetActiveRequest(bool IsActive);
