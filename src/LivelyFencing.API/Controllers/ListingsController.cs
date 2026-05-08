using Microsoft.AspNetCore.Mvc;

namespace LivelyFencing.API.Controllers;

// NOTE: This controller returns hardcoded Atlanta-area dummy listings.
// When Brandon receives Bridge Data Output API access from FMLS:
//   1. Register at https://bridgedataoutput.com and get approved for FMLS dataset
//   2. Add env vars: Bridge__ServerToken and Bridge__DatasetId to the API deployment
//   3. Replace DummyListings.All calls below with Bridge API proxy calls
//   Bridge API: GET https://api.bridgedataoutput.com/api/v2/OData/{datasetId}/Property
//   Auth header: Authorization: Bearer {serverToken}
//   RESO Web API docs: https://bridgedataoutput.com/docs/platform/API
//   Key filter params: $filter=StandardStatus eq 'Active' and City eq 'Atlanta'
//                      $top=200, $skip=N, $orderby=ListPrice asc
//   Photo access via Media field on Property resource (CDN URLs, link directly)

[ApiController]
[Route("listings")]
public class ListingsController : ControllerBase
{
    [HttpGet]
    public IActionResult Search(
        [FromQuery] string? city,
        [FromQuery] string? zip,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? minBeds,
        [FromQuery] decimal? minBaths,
        [FromQuery] string? propertyType,
        [FromQuery] string? status,
        [FromQuery] int page = 1)
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

        const int pageSize = 12;
        var total = listings.Count;
        var items = listings.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new { total, page, pageSize, listings = items });
    }

    [HttpGet("{listingKey}")]
    public IActionResult Get(string listingKey)
    {
        var listing = DummyListings.All.FirstOrDefault(
            l => l.ListingKey.Equals(listingKey, StringComparison.OrdinalIgnoreCase));
        return listing == null ? NotFound() : Ok(listing);
    }
}

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
    string ListingKey,
    string UnparsedAddress,
    string City,
    string StateOrProvince,
    string PostalCode,
    decimal ListPrice,
    int BedroomsTotal,
    decimal BathroomsTotalDecimal,
    int LivingArea,
    string PropertyType,
    string PropertySubType,
    string StandardStatus,
    int YearBuilt,
    int LotSizeSquareFeet,
    string PublicRemarks,
    string[] Photos);
