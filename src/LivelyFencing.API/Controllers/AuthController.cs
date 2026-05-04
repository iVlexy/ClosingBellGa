using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LivelyFencing.API.Infrastructure.Auth;
using LivelyFencing.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("auth")]
[Authorize(Policy = AuthorizationPolicies.AnyRole)]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuthController(AppDbContext db) => _db = db;

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == User.GetEmail());
        if (user == null) return NotFound();
        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            name = user.Name,
            role = user.Role.ToString()
        });
    }
}
