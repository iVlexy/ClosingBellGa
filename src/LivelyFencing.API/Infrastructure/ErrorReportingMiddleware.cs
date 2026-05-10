using System.Net.Http.Json;
using System.Text.Json;

namespace LivelyFencing.API.Infrastructure;

/// <summary>
/// Catches unhandled exceptions, logs them, and submits a bug report to the
/// BCS bug-tracking API automatically.
/// </summary>
public class ErrorReportingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorReportingMiddleware> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private const string BugApiUrl = "https://bcs-api.browningethan23.workers.dev/api/bugs/report";

    public ErrorReportingMiddleware(
        RequestDelegate next,
        ILogger<ErrorReportingMiddleware> logger,
        IHttpClientFactory httpClientFactory)
    {
        _next = next;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            // Capture all request data synchronously before context is disposed
            var method      = context.Request.Method;
            var path_       = context.Request.Path.Value ?? "/";
            var query_      = context.Request.QueryString.Value ?? "";
            var traceId_    = context.TraceIdentifier;
            var userId_     = context.User?.Identity?.Name ?? "anonymous";
            var host_       = context.Request.Host.ToString();
            var contentType_= context.Request.ContentType ?? "(none)";
            var userAgent_  = context.Request.Headers["User-Agent"].FirstOrDefault() ?? "(none)";
            var cfIp_       = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault() ?? "(none)";

            // Fire-and-forget bug report — don't let reporting failure break the response
            _ = Task.Run(() => ReportBugAsync(ex, method, path_, query_, traceId_, userId_, host_, contentType_, userAgent_, cfIp_));

            // Return 500 to caller
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "An unexpected error occurred.",
                    requestId = context.TraceIdentifier
                }));
            }
        }
    }

    private async Task ReportBugAsync(
        Exception ex,
        string method, string path, string query,
        string traceId, string userId,
        string host, string contentType, string userAgent, string cfIp)
    {
        try
        {
            var now = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC");

            // Build inner exception chain
            var exChain = new System.Text.StringBuilder();
            var current = ex;
            while (current != null)
            {
                exChain.AppendLine($"[{current.GetType().FullName}] {current.Message}");
                if (current.StackTrace != null)
                    exChain.AppendLine(current.StackTrace);
                current = current.InnerException;
                if (current != null) exChain.AppendLine("--- Inner Exception ---");
            }

            var description = $"""
## Unhandled Exception — Closing Bell GA API
**Time:** {now}
**Request ID:** {traceId}
**Endpoint:** {method} {path}{query}
**User:** {userId}

## Exception
```
{exChain}
```

## Session / Request Context
- Method: {method}
- Path: {path}{query}
- Host: {host}
- Content-Type: {contentType}
- User-Agent: {userAgent}
- CF-Connecting-IP: {cfIp}
""";

            var payload = new
            {
                title = $"[API Error] {ex.GetType().Name}: {(ex.Message.Length > 120 ? ex.Message[..120] + "…" : ex.Message)} ({method} {path})",
                description,
                priority = "high",
                submitterName = "Closing Bell API (auto)",
                submitterEmail = "api-monitor@closingbellga.com"
            };

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var response = await client.PostAsJsonAsync(BugApiUrl, payload);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                Console.Error.WriteLine($"[ErrorReporting] Bug report failed: {response.StatusCode} {body}");
            }
            else
            {
                _logger.LogInformation("Bug report submitted for {Method} {Path}", method, path);
            }
        }
        catch (Exception reportEx)
        {
            Console.Error.WriteLine($"[ErrorReporting] Could not submit bug report: {reportEx.Message}");
        }
    }
}
