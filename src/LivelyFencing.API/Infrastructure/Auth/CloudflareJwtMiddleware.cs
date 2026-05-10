using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LivelyFencing.API.Infrastructure.Auth;

public class CloudflareJwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CloudflareJwtMiddleware> _logger;

    // Cache JWKS keys for 1 hour to avoid fetching on every request
    private static IList<SecurityKey>? _cachedSigningKeys;
    private static DateTime _keysLastFetched = DateTime.MinValue;
    private static readonly TimeSpan _keysCacheDuration = TimeSpan.FromHours(1);
    private static readonly SemaphoreSlim _keysLock = new(1, 1);

    public CloudflareJwtMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<CloudflareJwtMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        // Skip auth for health check, swagger, and CORS preflight
        var path = context.Request.Path.Value ?? "";
        var method = context.Request.Method;
        bool isAnonymousRoute =
            path.StartsWith("/health") ||
            path.StartsWith("/webhooks") ||
            path.StartsWith("/swagger") ||
            method == "OPTIONS" ||
            (path == "/contact" && method == "POST") ||
            (path == "/reviews" && method == "GET") ||
            (path == "/reviews" && method == "POST") ||
            (path == "/site-settings/carousel" && method == "GET");
        if (isAnonymousRoute)
        {
            await _next(context);
            return;
        }

        var token = ExtractToken(context);
        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { error = "Missing authentication token" });
            return;
        }

        try
        {
            var teamDomain = _configuration["Cloudflare:TeamDomain"]!;
            var audience = _configuration["Cloudflare:Audience"]!;
            _logger.LogInformation("JWT validation: teamDomain={TD} audience={AUD}", teamDomain, audience);

            var signingKeys = await GetSigningKeysAsync(teamDomain);

            var handler = new JsonWebTokenHandler();
            var validationResult = await handler.ValidateTokenAsync(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://{teamDomain}.cloudflareaccess.com",
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                IssuerSigningKeys = signingKeys
            });

            if (!validationResult.IsValid)
            {
                var exMsg = validationResult.Exception?.Message ?? "unknown";
                var exType = validationResult.Exception?.GetType().Name ?? "unknown";
                _logger.LogWarning("JWT validation failed: [{ExType}] {ExMessage}", exType, exMsg);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid token", detail = $"{exType}: {exMsg}" });
                return;
            }

            var email = validationResult.Claims.TryGetValue("email", out var emailObj) ? emailObj?.ToString() : null;
            if (string.IsNullOrEmpty(email))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { error = "Token missing email claim" });
                return;
            }

            // Provision or fetch user
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                var name = (validationResult.Claims.TryGetValue("name", out var nameObj) ? nameObj?.ToString() : null) ?? email;
                user = new User { Email = email, Name = name, Role = UserRole.Customer };
                db.Users.Add(user);
            }
            user.LastLoginAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // Build ClaimsPrincipal
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var identity = new ClaimsIdentity(claims, "CloudflareJwt");
            context.User = new ClaimsPrincipal(identity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "JWT validation failed");
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { error = "Authentication failed" });
            return;
        }

        await _next(context);
    }

    private async Task<IList<SecurityKey>> GetSigningKeysAsync(string teamDomain)
    {
        if (_cachedSigningKeys != null && DateTime.UtcNow - _keysLastFetched < _keysCacheDuration)
            return _cachedSigningKeys;

        await _keysLock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            if (_cachedSigningKeys != null && DateTime.UtcNow - _keysLastFetched < _keysCacheDuration)
                return _cachedSigningKeys;

            using var httpClient = new HttpClient();
            var jwksJson = await httpClient.GetStringAsync(
                $"https://{teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs");
            var keySet = new JsonWebKeySet(jwksJson);
            _cachedSigningKeys = keySet.GetSigningKeys();
            _keysLastFetched = DateTime.UtcNow;
            _logger.LogInformation("Loaded {Count} Cloudflare signing keys", _cachedSigningKeys.Count);
            return _cachedSigningKeys;
        }
        finally
        {
            _keysLock.Release();
        }
    }

    private static string? ExtractToken(HttpContext context)
    {
        // Standard Authorization header
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return authHeader["Bearer ".Length..].Trim();

        // Cloudflare Access injects this header on tunnel requests for Access-protected apps
        var cfAssertion = context.Request.Headers["Cf-Access-Jwt-Assertion"].ToString();
        if (!string.IsNullOrEmpty(cfAssertion))
            return cfAssertion;

        // Fall back to CF_Authorization cookie (sent when withCredentials is used)
        return context.Request.Cookies["CF_Authorization"];
    }
}

public static class CloudflareJwtMiddlewareExtensions
{
    public static IApplicationBuilder UseCloudflareJwt(this IApplicationBuilder app)
        => app.UseMiddleware<CloudflareJwtMiddleware>();
}
