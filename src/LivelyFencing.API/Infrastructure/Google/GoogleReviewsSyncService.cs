using System.Text.Json;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LivelyFencing.API.Infrastructure.Google;

public class GoogleReviewsSyncService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleReviewsSyncService> _logger;
    private readonly IHttpClientFactory _httpFactory;

    public GoogleReviewsSyncService(IConfiguration config,
        ILogger<GoogleReviewsSyncService> logger,
        IHttpClientFactory httpFactory)
    {
        _config = config;
        _logger = logger;
        _httpFactory = httpFactory;
    }

    /// <summary>
    /// Fetches reviews from Google Places API and inserts any new ones
    /// as pending (Approved = false) so they go through the normal approval flow.
    /// Returns the count of newly imported reviews.
    /// </summary>
    public async Task<(int imported, string? error)> SyncAsync(AppDbContext db)
    {
        var apiKey = _config["Google:PlacesApiKey"];
        var placeId = _config["Google:PlaceId"];

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("${"))
            return (0, "Google Places API key is not configured.");
        if (string.IsNullOrWhiteSpace(placeId) || placeId.StartsWith("${"))
            return (0, "Google Place ID is not configured.");

        // Google Places Details — reviews field
        var url = $"https://maps.googleapis.com/maps/api/place/details/json" +
                  $"?place_id={Uri.EscapeDataString(placeId)}" +
                  $"&fields=reviews" +
                  $"&reviews_sort=newest" +
                  $"&key={apiKey}";

        var http = _httpFactory.CreateClient();
        HttpResponseMessage resp;
        try { resp = await http.GetAsync(url); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Places HTTP request failed");
            return (0, "Network error contacting Google Places API.");
        }

        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            _logger.LogError("Google Places returned {Status}: {Body}", resp.StatusCode, body);
            return (0, $"Google Places API error: {resp.StatusCode}");
        }

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        var status = root.GetProperty("status").GetString();
        if (status != "OK")
        {
            var msg = root.TryGetProperty("error_message", out var em) ? em.GetString() : status;
            return (0, $"Google Places status: {status} — {msg}");
        }

        if (!root.TryGetProperty("result", out var result) ||
            !result.TryGetProperty("reviews", out var reviewsEl))
            return (0, null); // no reviews yet, not an error

        // Load existing Google review IDs to avoid duplicates
        var existingIds = (await db.Reviews
            .Where(r => r.Source == "Google" && r.GoogleReviewId != null)
            .Select(r => r.GoogleReviewId!)
            .ToListAsync()).ToHashSet();

        int imported = 0;
        foreach (var rv in reviewsEl.EnumerateArray())
        {
            // Google uses author_url as a stable unique identifier
            var googleId = rv.TryGetProperty("author_url", out var au)
                ? au.GetString() : null;

            // Fallback: composite key if author_url absent
            if (googleId == null)
            {
                var aName = rv.TryGetProperty("author_name", out var an2) ? an2.GetString() ?? "" : "";
                var aTime = rv.TryGetProperty("time", out var t2) ? t2.GetInt64() : 0L;
                googleId = $"{aName}|{aTime}";
            }

            if (existingIds.Contains(googleId!)) continue;

            var review = new Review
            {
                ReviewerName   = rv.TryGetProperty("author_name",  out var name)  ? name.GetString()! : "Google Reviewer",
                Rating         = rv.TryGetProperty("rating",       out var rat)   ? rat.GetInt32()    : 5,
                Comment        = rv.TryGetProperty("text",         out var txt)   ? txt.GetString()!  : "",
                CreatedAt      = rv.TryGetProperty("time",         out var time)  
                                    ? DateTimeOffset.FromUnixTimeSeconds(time.GetInt64()).UtcDateTime
                                    : DateTime.UtcNow,
                ReviewerPhotoUrl = rv.TryGetProperty("profile_photo_url", out var ph) ? ph.GetString() : null,
                Source         = "Google",
                GoogleReviewId = googleId,
                Approved       = false   // goes through normal approval flow
            };
            db.Reviews.Add(review);
            imported++;
        }

        if (imported > 0)
            await db.SaveChangesAsync();

        _logger.LogInformation("Google review sync: {Count} new reviews imported", imported);
        return (imported, null);
    }
}
