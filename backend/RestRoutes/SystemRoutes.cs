namespace RestRoutes;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using OrchardCore.ContentManagement.Metadata;
using OrchardCore.Documents;
using OrchardCore.Roles.Models;
using OrchardCore.Users;
using OrchardCore.Users.Models;
using YesSql;
using System.Text.Json;

public static class SystemRoutes
{
    private static bool IsAdministrator(HttpContext context)
    {
        return context.User.Identity?.IsAuthenticated == true &&
               context.User.IsInRole("Administrator");
    }

    public static void MapSystemRoutes(this WebApplication app)
    {
        // Get all content types (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/content-types", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IContentDefinitionManager contentDefinitionManager) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return permissionCheck;
            }

            var contentTypes = (await contentDefinitionManager.ListTypeDefinitionsAsync())
                .Select(type => type.Name)
                .OrderBy(n => n)
                .ToList();

            return Results.Json(contentTypes);
        });

        // Get all roles from RolesDocument (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/roles", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IDocumentManager<RolesDocument> documentManager) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return permissionCheck;
            }

            var rolesDocument = await documentManager.GetOrCreateMutableAsync();

            var roleNames = rolesDocument.Roles
                .Select(r => r.RoleName)
                .Where(n => !string.IsNullOrEmpty(n))
                .OrderBy(n => n)
                .ToList();

            return Results.Json(roleNames);
        });

        // Serve admin script (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/admin-script.js", async (
            HttpContext context,
            [FromServices] ISession session) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return Results.Content("console.error('Access denied');", "application/javascript");
            }

            var scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "RestRoutes", "admin-script.js");
            var script = await File.ReadAllTextAsync(scriptPath);
            return Results.Content(script, "application/javascript");
        });

        // Get all users (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/users", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] UserManager<IUser> userManager) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return permissionCheck;
            }

            // Get all users from UserIndex
            var users = await session
                .Query<OrchardCore.Users.Models.User, OrchardCore.Users.Indexes.UserIndex>()
                .ListAsync();

            var usersList = new List<Dictionary<string, object>>();
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            foreach (var user in users)
            {
                var u = user as User;
                var userDict = new Dictionary<string, object>
                {
                    ["id"] = u?.UserId ?? "",
                    ["username"] = user.UserName ?? "",
                    ["email"] = u?.Email ?? "",
                    ["firstName"] = u?.Properties?["FirstName"]?.ToString() ?? "",
                    ["lastName"] = u?.Properties?["LastName"]?.ToString() ?? "",
                    ["phoneNumber"] = u?.PhoneNumber ?? ""
                };

                // Get user roles
                var roles = await userManager.GetRolesAsync(user);
                userDict["roles"] = roles;

                usersList.Add(userDict);
            }

            return Results.Json(usersList);
        });
    }
}
