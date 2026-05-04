using System.Security.Claims;

namespace LivelyFencing.API.Infrastructure.Auth;

public static class AuthorizationPolicies
{
    public const string Admin = "Admin";
    public const string AdminOrSales = "AdminOrSales";
    public const string AdminOrAccountant = "AdminOrAccountant";
    public const string Internal = "Internal";
    public const string AnyRole = "AnyRole";

    public static void AddPolicies(Microsoft.AspNetCore.Authorization.AuthorizationOptions options)
    {
        options.AddPolicy(Admin, policy =>
            policy.RequireClaim(ClaimTypes.Role, "Admin"));

        options.AddPolicy(AdminOrSales, policy =>
            policy.RequireClaim(ClaimTypes.Role, "Admin", "Sales"));

        options.AddPolicy(AdminOrAccountant, policy =>
            policy.RequireClaim(ClaimTypes.Role, "Admin", "Accountant"));

        options.AddPolicy(Internal, policy =>
            policy.RequireClaim(ClaimTypes.Role, "Admin", "Sales", "Accountant", "FieldWorker"));

        options.AddPolicy(AnyRole, policy =>
            policy.RequireClaim(ClaimTypes.Role, "Admin", "Sales", "Accountant", "FieldWorker", "Customer"));
    }
}

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
        => Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public static string GetEmail(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Email)!;

    public static string GetRole(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Role)!;

    public static bool IsAdmin(this ClaimsPrincipal user)
        => user.GetRole() == "Admin";
}
