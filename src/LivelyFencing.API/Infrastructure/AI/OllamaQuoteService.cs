using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LivelyFencing.API.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace LivelyFencing.API.Infrastructure.AI;

public record QuoteLineItemSuggestion(
    string Category,
    string Description,
    decimal Quantity,
    decimal UnitPrice
);

public class OllamaQuoteService
{
    private readonly HttpClient _http;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<OllamaQuoteService> _logger;

    public OllamaQuoteService(HttpClient http, AppDbContext db, IConfiguration config, ILogger<OllamaQuoteService> logger)
    {
        _http = http;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<List<QuoteLineItemSuggestion>> GenerateQuoteAsync(
        string jobDescription, string fencingType, decimal? linearFeet, decimal? height, int? gates,
        CancellationToken ct = default)
    {
        var ollamaUrl = _config["Ollama:BaseUrl"] ?? "http://ollama:11434";

        // Step 1: Embed the job description (fall back to fencing type if no description provided)
        var textToEmbed = string.IsNullOrWhiteSpace(jobDescription)
            ? $"{fencingType} fence installation"
            : jobDescription;
        var embedding = await GetEmbeddingAsync(ollamaUrl, textToEmbed, ct);

        // Step 2: Find similar completed jobs (only if we have a valid embedding)
        var similarJobs = new List<Domain.Entities.JobEmbedding>();
        if (embedding.Memory.Length > 0)
        {
            similarJobs = await _db.JobEmbeddings
                .OrderBy(e => e.Embedding.L2Distance(embedding))
                .Take(5)
                .Include(e => e.Job)
                    .ThenInclude(j => j.Quotes.Where(q => q.Status == Domain.Enums.QuoteStatus.Accepted))
                        .ThenInclude(q => q.LineItems)
                .ToListAsync(ct);
        }

        // Step 3: Build context from similar jobs
        var contextBuilder = new StringBuilder();
        contextBuilder.AppendLine("Past fencing jobs and their accepted quotes (for reference):");
        foreach (var je in similarJobs.Where(j => j.Job.Quotes.Any()))
        {
            var job = je.Job;
            var quote = job.Quotes.First();
            contextBuilder.AppendLine($"---");
            contextBuilder.AppendLine($"Job: {job.Title} | Type: {job.FencingType} | {job.LinearFeet}ft x {job.Height}ft | {job.Gates} gates");
            contextBuilder.AppendLine("Line items:");
            foreach (var li in quote.LineItems)
                contextBuilder.AppendLine($"  - [{li.Category}] {li.Description}: qty={li.Quantity}, unitPrice=${li.UnitPrice}");
        }

        // Step 4: Build prompt
        var prompt = $$"""
{{contextBuilder}}

---
Now generate a detailed quote for this NEW job:
Type: {{fencingType}}
Linear feet: {{linearFeet ?? 0}}
Height: {{height ?? 0}} ft
Gates: {{gates ?? 0}}
Description: {{jobDescription}}

Return ONLY a valid JSON array of line items. Each item must have:
- "category": one of Material, Labour, Equipment, Permit, Disposal, Other
- "description": string
- "quantity": number
- "unitPrice": number (USD)

Example format:
[
  {"category":"Material","description":"Vinyl fence panels (6ft)","quantity":20,"unitPrice":45.00},
  {"category":"Labour","description":"Installation labor","quantity":8,"unitPrice":75.00}
]
""";

        // Step 5: Call llama3.2
        var response = await CallGenerateAsync(ollamaUrl, prompt, ct);

        // Step 6: Parse JSON from response
        return ParseLineItems(response);
    }

    private async Task<Vector> GetEmbeddingAsync(string baseUrl, string text, CancellationToken ct)
    {
        var payload = new { model = "nomic-embed-text", prompt = text };
        var res = await _http.PostAsJsonAsync($"{baseUrl}/api/embeddings", payload, ct);
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        var floats = body.GetProperty("embedding").EnumerateArray().Select(e => e.GetSingle()).ToArray();
        return new Vector(floats);
    }

    private async Task<string> CallGenerateAsync(string baseUrl, string prompt, CancellationToken ct)
    {
        var payload = new
        {
            model = "llama3.2",
            prompt,
            stream = false,
            format = "json",
            options = new { temperature = 0.2, num_predict = 2048 }
        };

        var res = await _http.PostAsJsonAsync($"{baseUrl}/api/generate", payload, ct);
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return body.GetProperty("response").GetString() ?? "[]";
    }

    private List<QuoteLineItemSuggestion> ParseLineItems(string json)
    {
        try
        {
            // Find the JSON array in the response
            var start = json.IndexOf('[');
            var end = json.LastIndexOf(']');
            if (start < 0 || end < 0) return new List<QuoteLineItemSuggestion>();

            var arrayJson = json[start..(end + 1)];
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var items = JsonSerializer.Deserialize<List<AiLineItemDto>>(arrayJson, options);
            if (items == null) return new List<QuoteLineItemSuggestion>();

            return items.Select(item => new QuoteLineItemSuggestion(
                item.Category ?? "Other",
                item.Description ?? "",
                item.Quantity,
                item.UnitPrice
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse AI quote line items from: {Json}", json);
            return new List<QuoteLineItemSuggestion>();
        }
    }

    private record AiLineItemDto(string? Category, string? Description, decimal Quantity, decimal UnitPrice);
}
