using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("listings")]
public class ListingsController : ControllerBase
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly string? _serverToken;
    private readonly string? _datasetId;

    public ListingsController(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _serverToken = config["Bridge:ServerToken"];
        _datasetId   = config["Bridge:DatasetId"];
    }

    // Bridge is active only when BOTH env vars are configured.
    // While FMLS dataset is pending approval, DatasetId will be absent and
    // the controller falls back to DummyListings automatically.
    private bool UseBridge =>
        !string.IsNullOrWhiteSpace(_serverToken) &&
        !string.IsNullOrWhiteSpace(_datasetId);

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? city,
        [FromQuery] string? zip,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int?     minBeds,
        [FromQuery] decimal? minBaths,
        [FromQuery] string?  propertyType,
        [FromQuery] string?  status,
        [FromQuery] string?  sort,
        [FromQuery] int      page = 1)
    {
        if (!UseBridge)
            return SearchDummy(city, zip, minPrice, maxPrice, minBeds, minBaths,
                               propertyType, status, sort, page);

        return await SearchBridgeAsync(city, zip, minPrice, maxPrice, minBeds,
                                       minBaths, propertyType, status, sort, page);
    }

    [HttpGet("{listingKey}")]
    public async Task<IActionResult> Get(string listingKey)
    {
        if (!UseBridge)
        {
            var dummy = DummyListings.All.FirstOrDefault(
                l => l.ListingKey.Equals(listingKey, StringComparison.OrdinalIgnoreCase));
            return dummy == null ? NotFound() : Ok(dummy);
        }
        return await GetBridgeAsync(listingKey);
    }


    [HttpGet("photo")]
    public async Task<IActionResult> ProxyPhoto([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest();

        // Only allow known Bridge CDN domains
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme != "https" ||
            (!uri.Host.EndsWith(".cloudfront.net") && !uri.Host.EndsWith(".bridgedataoutput.com")))
            return BadRequest("Invalid image source");

        using var client = _httpFactory.CreateClient();
        if (!string.IsNullOrWhiteSpace(_serverToken))
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _serverToken);

        HttpResponseMessage response;
        try { response = await client.GetAsync(url); }
        catch { return StatusCode(502); }

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode);

        var content = await response.Content.ReadAsByteArrayAsync();
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
        return File(content, contentType);
    }

    // ── Dummy fallback ────────────────────────────────────────────────────────

    private IActionResult SearchDummy(
        string? city, string? zip, decimal? minPrice, decimal? maxPrice,
        int? minBeds, decimal? minBaths, string? propertyType, string? status,
        string? sort, int page)
    {
        var listings = DummyListings.All;
        if (!string.IsNullOrWhiteSpace(city))
            listings = listings.Where(l =>
                l.City.Contains(city.Trim(), StringComparison.OrdinalIgnoreCase) ||
                l.PostalCode == city.Trim()).ToList();
        if (!string.IsNullOrWhiteSpace(zip))
            listings = listings.Where(l => l.PostalCode == zip.Trim()).ToList();
        if (minPrice.HasValue)
            listings = listings.Where(l => l.ListPrice >= minPrice).ToList();
        if (maxPrice.HasValue)
            listings = listings.Where(l => l.ListPrice <= maxPrice).ToList();
        if (minBeds.HasValue)
            listings = listings.Where(l => l.BedroomsTotal >= minBeds).ToList();
        if (minBaths.HasValue)
            listings = listings.Where(l => l.BathroomsTotalDecimal >= minBaths).ToList();
        if (!string.IsNullOrWhiteSpace(propertyType))
            listings = listings.Where(l =>
                l.PropertySubType.Equals(propertyType, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(status))
            listings = listings.Where(l =>
                l.StandardStatus.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
        listings = sort switch
        {
            "price-desc" => listings.OrderByDescending(l => l.ListPrice).ToList(),
            "sqft-desc"  => listings.OrderByDescending(l => l.LivingArea).ToList(),
            "year-desc"  => listings.OrderByDescending(l => l.YearBuilt).ToList(),
            _            => listings.OrderBy(l => l.ListPrice).ToList(),
        };

        const int pageSize = 12;
        var total = listings.Count;
        var items = listings.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new { total, page, pageSize, listings = items });
    }

    // ── Bridge API proxy ──────────────────────────────────────────────────────

    private async Task<IActionResult> SearchBridgeAsync(
        string? city, string? zip, decimal? minPrice, decimal? maxPrice,
        int? minBeds, decimal? minBaths, string? propertyType, string? status,
        string? sort, int page)
    {
        const int pageSize = 12;

        // Suggested w/o city or zip: Brandon first + curated mid-market
        if (string.IsNullOrWhiteSpace(city) && string.IsNullOrWhiteSpace(zip) && sort == "suggested")
            return await SearchSuggestedAsync(minPrice, maxPrice, minBeds, minBaths, propertyType, status, page);

        var filters = new List<string>
        {
            // Default to Active when caller omits status
            $"StandardStatus eq '{(string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim())}'",
            "ListPrice gt 0",             // exclude test/null-price listings
            "InternetEntireListingDisplayYN ne false"  // FMLS Rule 13.1(b): respect opt-out
        };

        if (!string.IsNullOrWhiteSpace(city))
        {
            var c = city.Trim().Replace("'", "''");
            if (c.All(char.IsDigit))
                // Pure digits → ZIP prefix
                filters.Add($"startswith(PostalCode, '{c}')");
            else if (char.IsDigit(c[0]))
                // Starts with a number followed by letters/spaces → street address
                filters.Add($"contains(UnparsedAddress, '{c}')");
            else
                // Text → city name
                filters.Add($"startswith(City, '{c}')");
        }
        else if (string.IsNullOrWhiteSpace(zip) && sort == "agent")
        {
            filters.Add("ListAgentMlsId eq 'BELLBRAN'");
        }
        if (!string.IsNullOrWhiteSpace(zip))
            filters.Add($"startswith(PostalCode, '{zip.Trim().Replace("'", "''")}')");

        if (minPrice.HasValue)
            filters.Add($"ListPrice ge {minPrice.Value}");
        if (maxPrice.HasValue)
            filters.Add($"ListPrice le {maxPrice.Value}");
        if (minBeds.HasValue)
            filters.Add($"BedroomsTotal ge {minBeds.Value}");
        if (minBaths.HasValue)
            filters.Add($"BathroomsTotalDecimal ge {minBaths.Value}");
        if (!string.IsNullOrWhiteSpace(propertyType))
            filters.Add($"PropertySubType eq '{propertyType.Trim().Replace("'", "''")}'");

        var filter = string.Join(" and ", filters);
        var skip   = (page - 1) * pageSize;

        var url = $"https://api.bridgedataoutput.com/api/v2/OData/{_datasetId}/Property"
                + $"?$filter={Uri.EscapeDataString(filter)}"
                + $"&$top={pageSize}&$skip={skip}"
                + $"&$orderby={sort switch {
                    "price-desc" => "ListPrice desc",
                    "sqft-desc"  => "LivingArea desc",
                    "year-desc"  => "YearBuilt desc",
                    _            => "ListPrice asc"
                }}";

        using var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _serverToken);

        HttpResponseMessage response;
        try { response = await client.GetAsync(url); }
        catch { return StatusCode(502, "Unable to reach listings service."); }

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Listings service error.");

        var json = await response.Content.ReadAsStringAsync();
        var bridgeResponse = JsonSerializer.Deserialize<BridgePropertyResponse>(json, _jsonOptions);
        if (bridgeResponse?.Value == null)
            return Ok(new { total = 0, page, pageSize, listings = Array.Empty<ListingDto>() });

        var listings = bridgeResponse.Value
            .Where(p =>
                (p.ListPrice ?? 0m) > 0 &&
                !string.IsNullOrWhiteSpace(p.UnparsedAddress) &&
                (p.InternetEntireListingDisplayYN != false) &&
                !(p.PublicRemarks ?? "").Contains("DO NOT USE", StringComparison.OrdinalIgnoreCase))
            .Select(MapToDto).ToList();
        // Bridge test dataset does not return @odata.count; use page math for total
        var total    = bridgeResponse.Count ?? (skip + listings.Count + (listings.Count == pageSize ? pageSize : 0));
        return Ok(new { total, page, pageSize, listings });
    }


    private async Task<IActionResult> SearchSuggestedAsync(
        decimal? minPrice, decimal? maxPrice, int? minBeds, decimal? minBaths,
        string? propertyType, string? status, int page)
    {
        const int pageSize = 12;
        var statusVal  = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        var baseFilter = $"StandardStatus eq '{statusVal}' and ListPrice gt 0 and InternetEntireListingDisplayYN ne false";

        using var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _serverToken);

        // Step 1: Brandon's listings always lead the results (he has very few)
        var agentListings = await FetchBridgeListingsAsync(client,
            baseFilter + " and ListAgentMlsId eq 'BELLBRAN'",
            top: 10, skip: 0, orderby: "ListPrice asc");
        var agentKeys = agentListings.Select(l => l.ListingKey).ToHashSet();

        // Step 2: curated mid-market — $400k–$750k, 3+ beds
        var curatedFilter = baseFilter
            + " and ListPrice ge 400000 and ListPrice le 750000 and BedroomsTotal ge 3";

        // On page 1: agent listings fill the first slots; curated fills the rest.
        // On page 2+: no agent listings, offset curated skip to account for page-1 displacement.
        int agentCount   = agentListings.Count;
        int curatedSlots = pageSize - (page == 1 ? agentCount : 0);
        int curatedSkip  = page == 1
            ? 0
            : (pageSize - agentCount) + (page - 2) * pageSize;

        // Fetch a few extra to absorb any agent-key deduplication
        var curatedRaw = await FetchBridgeListingsAsync(client,
            curatedFilter, top: curatedSlots + agentCount, skip: curatedSkip, orderby: "ListPrice asc");
        var curatedDeduped = curatedRaw
            .Where(l => !agentKeys.Contains(l.ListingKey))
            .Take(curatedSlots)
            .ToList();

        var listings = page == 1
            ? agentListings.Concat(curatedDeduped).ToList()
            : curatedDeduped;

        var total = agentCount + curatedSkip + curatedDeduped.Count
                  + (curatedDeduped.Count == curatedSlots ? pageSize : 0);

        return Ok(new { total, page, pageSize, listings });
    }

    private async Task<List<ListingDto>> FetchBridgeListingsAsync(
        HttpClient client, string filter, int top, int skip, string orderby)
    {
        var url = $"https://api.bridgedataoutput.com/api/v2/OData/{_datasetId}/Property"
                + $"?$filter={Uri.EscapeDataString(filter)}"
                + $"&$top={top}&$skip={skip}&$orderby={Uri.EscapeDataString(orderby)}";

        HttpResponseMessage resp;
        try { resp = await client.GetAsync(url); }
        catch { return new List<ListingDto>(); }

        if (!resp.IsSuccessStatusCode) return new List<ListingDto>();

        var json   = await resp.Content.ReadAsStringAsync();
        var bridge = JsonSerializer.Deserialize<BridgePropertyResponse>(json, _jsonOptions);
        return (bridge?.Value ?? new List<BridgeProperty>())
            .Where(p =>
                (p.ListPrice ?? 0m) > 0 &&
                !string.IsNullOrWhiteSpace(p.UnparsedAddress) &&
                p.InternetEntireListingDisplayYN != false &&
                !(p.PublicRemarks ?? "").Contains("DO NOT USE", StringComparison.OrdinalIgnoreCase))
            .Select(MapToDto)
            .ToList();
    }

    private async Task<IActionResult> GetBridgeAsync(string listingKey)
    {
        // Single-resource endpoint: /Property('{key}')
        var url = $"https://api.bridgedataoutput.com/api/v2/OData/{_datasetId}"
                + $"/Property('{Uri.EscapeDataString(listingKey)}')";

        using var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _serverToken);

        HttpResponseMessage response;
        try { response = await client.GetAsync(url); }
        catch { return StatusCode(502, "Unable to reach listings service."); }

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return NotFound();
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Listings service error.");

        var json = await response.Content.ReadAsStringAsync();
        var prop = JsonSerializer.Deserialize<BridgeProperty>(json, _jsonOptions);
        return prop == null ? NotFound() : Ok(MapToDto(prop));
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static ListingDto MapToDto(BridgeProperty p)
    {
        var addr = (p.InternetAddressDisplayYN == false)
            ? "Address Not Disclosed"
            : (p.UnparsedAddress ?? "");
        return new(
        p.ListingKey        ?? "",
        addr,
        p.City              ?? "",
        p.StateOrProvince   ?? "",
        p.PostalCode        ?? "",
        p.ListPrice         ?? 0m,
        p.BedroomsTotal     ?? 0,
        p.BathroomsTotalDecimal ?? (decimal?)(p.BathroomsTotalInteger) ?? 0m,
        p.LivingArea        ?? p.BuildingAreaTotal ?? 0,
        p.PropertyType      ?? "Residential",
        p.PropertySubType   ?? "",
        p.StandardStatus    ?? "",
        p.YearBuilt         ?? 0,
        (int)(p.LotSizeSquareFeet ?? 0m),
        p.PublicRemarks     ?? "",
        p.Media?
            .OrderBy(m => m.Order ?? 999)
            .Select(m => m.MediaURL ?? "")
            .Where(u => !string.IsNullOrEmpty(u))
            .ToArray()
        ?? Array.Empty<string>(),
        p.ListOfficeName       ?? "",
        p.ListAgentDirectPhone ?? "",
        p.ListingId            ?? ""
        );
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
}

// ── Bridge response models ────────────────────────────────────────────────────

public class BridgePropertyResponse
{
    [JsonPropertyName("@odata.count")]
    public int? Count { get; set; }
    public List<BridgeProperty>? Value { get; set; }
}

public class BridgeProperty
{
    public string?  ListingKey              { get; set; }
    public string?  ListingId               { get; set; }
    public string?  UnparsedAddress         { get; set; }
    public string?  City                    { get; set; }
    public string?  StateOrProvince         { get; set; }
    public string?  PostalCode              { get; set; }
    public decimal? ListPrice               { get; set; }
    public int?     BedroomsTotal           { get; set; }
    public decimal? BathroomsTotalDecimal   { get; set; }
    public int?     BathroomsTotalInteger    { get; set; }
    public int?     LivingArea              { get; set; }
    public int?     BuildingAreaTotal        { get; set; }
    public string?  PropertyType            { get; set; }
    public string?  PropertySubType         { get; set; }
    public string?  StandardStatus          { get; set; }
    public int?     YearBuilt               { get; set; }
    public decimal? LotSizeSquareFeet       { get; set; }
    public string?  PublicRemarks           { get; set; }
    public List<BridgeMedia>? Media                   { get; set; }
    public string?  ListOfficeName                  { get; set; }
    public string?  ListAgentDirectPhone            { get; set; }
    public bool?    InternetEntireListingDisplayYN  { get; set; }
    public bool?    InternetAddressDisplayYN        { get; set; }
}

public class BridgeMedia
{
    public string? MediaURL      { get; set; }
    public int?    Order         { get; set; }
    public string? MediaCategory { get; set; }
}

// ── Dummy listings (fallback while FMLS dataset approval is pending) ──────────

public static class DummyListings
{
    public static readonly List<ListingDto> All = new()
    {
        new ListingDto("ATL001", "742 Peachtree Hills Ave NE", "Atlanta", "GA", "30305",
            649000m, 4, 3.5m, 2840, "Residential", "Single Family Residence", "Active", 1985, 8712,
            "Stunning renovation in the heart of Buckhead. Chef's kitchen with quartz countertops, " +
            "hardwood floors throughout, oversized primary suite with spa bath. Private backyard oasis " +
            "with deck and mature landscaping.",
            new[] { "https://picsum.photos/seed/atl001a/800/600", "https://picsum.photos/seed/atl001b/800/600", "https://picsum.photos/seed/atl001c/800/600" }),

        new ListingDto("ATL002", "805 Juniper St NE Apt 12", "Atlanta", "GA", "30308",
            385000m, 2, 2.0m, 1180, "Residential", "Condominium", "Active", 2008, 0,
            "Stylish Midtown condo steps from Piedmont Park. Floor-to-ceiling windows, modern kitchen " +
            "with stainless appliances, in-unit laundry, and rooftop pool access. Walk to the BeltLine, " +
            "restaurants, and MARTA.",
            new[] { "https://picsum.photos/seed/atl002a/800/600", "https://picsum.photos/seed/atl002b/800/600" }),

        new ListingDto("ATL003", "256 Elizabeth St NE", "Atlanta", "GA", "30307",
            495000m, 3, 2.5m, 2100, "Residential", "Townhouse", "Active", 2015, 2178,
            "Modern Inman Park townhouse with private rooftop deck and city views. Open floor plan, " +
            "gourmet kitchen, and attached two-car garage. Short walk to Krog Street Market and the BeltLine.",
            new[] { "https://picsum.photos/seed/atl003a/800/600", "https://picsum.photos/seed/atl003b/800/600" }),

        new ListingDto("ATL004", "1019 N Highland Ave NE", "Atlanta", "GA", "30306",
            720000m, 4, 3.0m, 3100, "Residential", "Single Family Residence", "Active", 1925, 7840,
            "Classic Virginia-Highland craftsman fully renovated. Original hardwood floors, coffered " +
            "ceilings, and two fireplaces. Chef's kitchen opens to sunroom overlooking professionally " +
            "landscaped yard with pergola.",
            new[] { "https://picsum.photos/seed/atl004a/800/600", "https://picsum.photos/seed/atl004b/800/600", "https://picsum.photos/seed/atl004c/800/600" }),

        new ListingDto("ATL005", "312 Commerce Dr", "Decatur", "GA", "30030",
            425000m, 3, 2.0m, 1850, "Residential", "Single Family Residence", "Active", 1978, 10890,
            "Charming Decatur ranch on a large level lot. Fully updated kitchen and bathrooms, new HVAC, " +
            "screened back porch, and two-car garage. Walking distance to downtown Decatur and MARTA.",
            new[] { "https://picsum.photos/seed/atl005a/800/600", "https://picsum.photos/seed/atl005b/800/600" }),

        new ListingDto("ATL006", "1422 Memorial Dr SE", "Atlanta", "GA", "30317",
            299000m, 2, 1.0m, 1050, "Residential", "Single Family Residence", "Active", 1940, 6534,
            "Classic East Atlanta Village bungalow with original hardwood floors and rocking chair porch. " +
            "Large backyard, great opportunity for first-time buyers or investors. Sold as-is.",
            new[] { "https://picsum.photos/seed/atl006a/800/600", "https://picsum.photos/seed/atl006b/800/600" }),

        new ListingDto("ATL007", "4550 Club Dr NE", "Atlanta", "GA", "30319",
            785000m, 5, 4.0m, 3800, "Residential", "Single Family Residence", "Active", 2005, 14375,
            "Executive Brookhaven home on quiet cul-de-sac. Soaring ceilings, chef's kitchen, finished " +
            "basement with media room and wet bar. Landscaped yard with outdoor kitchen, fireplace, and " +
            "professional lighting.",
            new[] { "https://picsum.photos/seed/atl007a/800/600", "https://picsum.photos/seed/atl007b/800/600", "https://picsum.photos/seed/atl007c/800/600" }),

        new ListingDto("ATL008", "671 Grant Park Ave SE", "Atlanta", "GA", "30315",
            475000m, 3, 2.0m, 1780, "Residential", "Single Family Residence", "Active", 1935, 6000,
            "Beautifully renovated Grant Park craftsman across from the park. Updated kitchen, period " +
            "details preserved, master suite addition, and private fenced backyard. Steps from the " +
            "BeltLine and Atlanta Zoo.",
            new[] { "https://picsum.photos/seed/atl008a/800/600", "https://picsum.photos/seed/atl008b/800/600" }),

        new ListingDto("ATL009", "1538 Oakdale Rd NE", "Atlanta", "GA", "30307",
            550000m, 4, 3.0m, 2400, "Residential", "Single Family Residence", "Active Under Contract", 1920, 7500,
            "Gorgeous Candler Park craftsman on a tree-lined street. Wrap-around porch, original period " +
            "details, updated systems, and finished attic primary suite. Rare find in one of Atlanta's " +
            "most desirable in-town neighborhoods.",
            new[] { "https://picsum.photos/seed/atl009a/800/600", "https://picsum.photos/seed/atl009b/800/600" }),

        new ListingDto("ATL010", "2240 Village Green Dr", "Smyrna", "GA", "30080",
            490000m, 4, 3.0m, 2650, "Residential", "Single Family Residence", "Active", 2024, 5500,
            "Brand new construction in Smyrna's newest master-planned community. Open-concept living, " +
            "9-foot ceilings, quartz countertops, LVP flooring, and smart home tech. Community pool, " +
            "clubhouse, and walking trails. Full builder warranty.",
            new[] { "https://picsum.photos/seed/atl010a/800/600", "https://picsum.photos/seed/atl010b/800/600" }),

        new ListingDto("ATL011", "3344 Peachtree Rd NE Unit 2505", "Atlanta", "GA", "30326",
            625000m, 3, 3.0m, 2200, "Residential", "Condominium", "Active", 2015, 0,
            "Sophisticated 25th-floor Buckhead condo with sweeping skyline views. Wall-to-wall windows, " +
            "chef's kitchen, spa bath, two parking spaces. Full-service building with concierge, resort " +
            "pool, fitness center, and dog park.",
            new[] { "https://picsum.photos/seed/atl011a/800/600", "https://picsum.photos/seed/atl011b/800/600" }),

        new ListingDto("ATL012", "144 Rogers St NE", "Atlanta", "GA", "30317",
            389000m, 3, 2.0m, 1500, "Residential", "Single Family Residence", "Coming Soon", 1945, 8712,
            "Charming Kirkwood bungalow with outstanding curb appeal. Updated kitchen with butcher block " +
            "counters, renovated baths, original hardwoods, large master suite, and level fenced backyard. " +
            "Steps to Kirkwood Village shops and restaurants.",
            new[] { "https://picsum.photos/seed/atl012a/800/600", "https://picsum.photos/seed/atl012b/800/600" })
    };
}

public record ListingDto(
    string   ListingKey,
    string   UnparsedAddress,
    string   City,
    string   StateOrProvince,
    string   PostalCode,
    decimal  ListPrice,
    int      BedroomsTotal,
    decimal  BathroomsTotalDecimal,
    int      LivingArea,
    string   PropertyType,
    string   PropertySubType,
    string   StandardStatus,
    int      YearBuilt,
    int      LotSizeSquareFeet,
    string   PublicRemarks,
    string[] Photos,
    string   ListOfficeName = "",
    string   ListAgentPhone = "",
    string   ListingId     = "");
