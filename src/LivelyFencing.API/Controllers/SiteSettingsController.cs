using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("site-settings")]
public class SiteSettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;

    public SiteSettingsController(AppDbContext db, IConfiguration config, IHttpClientFactory httpFactory)
    {
        _db = db;
        _config = config;
        _httpFactory = httpFactory;
    }

    // Public: get carousel images
    [HttpGet("carousel")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCarousel()
    {
        var settings = await _db.SiteSettings.FirstOrDefaultAsync();
        if (settings == null)
            return Ok(new List<string>());
        var images = JsonSerializer.Deserialize<List<string>>(settings.CarouselImagesJson) ?? new();
        return Ok(images);
    }

    // Admin: update carousel images
    [HttpPut("carousel")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> UpdateCarousel([FromBody] List<string> images)
    {
        if (images == null)
            return BadRequest("Images list is required.");
        foreach (var url in images)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "https" && uri.Scheme != "http"))
                return BadRequest($"Invalid URL: {url}");
        }
        var settings = await _db.SiteSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SiteSettings { CarouselImagesJson = JsonSerializer.Serialize(images) };
            _db.SiteSettings.Add(settings);
        }
        else
        {
            settings.CarouselImagesJson = JsonSerializer.Serialize(images);
        }
        await _db.SaveChangesAsync();
        return Ok(images);
    }

    // Admin: get a Cloudflare Images direct-upload URL
    [HttpPost("carousel/upload-url")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> GetUploadUrl()
    {
        var accountId = _config["CloudflareImages:AccountId"];
        var apiToken  = _config["CloudflareImages:ApiToken"];
        var accountHash = _config["CloudflareImages:AccountHash"] ?? "7SJFqNxbKSsrglTrI1f7bw";

        if (string.IsNullOrWhiteSpace(accountId) || accountId.StartsWith("${") ||
            string.IsNullOrWhiteSpace(apiToken)  || apiToken.StartsWith("${"))
            return StatusCode(503, new { error = "Cloudflare Images is not configured. Add CF_IMAGES_ACCOUNT_ID and CF_IMAGES_TOKEN to the api-secret k8s secret." });

        var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiToken}");

        // Request a one-time direct-upload URL (expires in 30 min)
        var cfResponse = await client.PostAsync(
            $"https://api.cloudflare.com/client/v4/accounts/{accountId}/images/v2/direct_upload",
            new MultipartFormDataContent { { new StringContent("false"), "requireSignedURLs" } }
        );

        var body = await cfResponse.Content.ReadAsStringAsync();
        if (!cfResponse.IsSuccessStatusCode)
            return StatusCode(502, new { error = "Cloudflare Images API error", detail = body });

        var json = JsonNode.Parse(body);
        var result = json?["result"];
        var uploadUrl = result?["uploadURL"]?.GetValue<string>();
        var imageId   = result?["id"]?.GetValue<string>();

        if (string.IsNullOrEmpty(uploadUrl) || string.IsNullOrEmpty(imageId))
            return StatusCode(502, new { error = "Unexpected CF response", detail = body });

        var publicUrl = $"https://imagedelivery.net/{accountHash}/{imageId}/public";
        return Ok(new { uploadUrl, imageId, publicUrl });
    }
}
