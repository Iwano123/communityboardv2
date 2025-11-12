namespace RestRoutes;

using System.Security.Claims;

public static class PermissionsACL
{
    public static async Task<IResult?> CheckPermissions(
        string contentType,
        string httpMethod,
        HttpContext context,
        YesSql.ISession session)
    {
        // Fetch all RestPermissions
        var permissions = await GetRoutes.FetchCleanContent("RestPermissions", session, populate: false);

        // Build permissions lookup: permissionsByRole[role][contentType][restMethod] = true
        var permissionsByRole = new Dictionary<string, Dictionary<string, Dictionary<string, bool>>>();

        if (permissions == null) permissions = new List<Dictionary<string, object>>();

        // Debug: Log what we found
        Console.WriteLine($"[PermissionsACL] Found {permissions.Count} RestPermissions entries");

        foreach (var permission in permissions)
        {
            if (permission == null) continue;

            // Debug: Log all keys in permission
            Console.WriteLine($"[PermissionsACL] Permission keys: {string.Join(", ", permission.Keys)}");

            // Helper function to convert comma-separated strings or text field dictionaries to list
            // Handles both: new TextField format (plain string) and old MultiTextField format (dictionary)
            static List<string> ConvertCommaSeparatedToList(object? value)
            {
                if (value == null) return [];

                // OLD FORMAT: Dictionary with "text" property (ghosted from old MultiTextField)
                if (value is Dictionary<string, object> dict && dict.ContainsKey("text"))
                {
                    value = dict["text"];
                }

                // NEW FORMAT: Plain string (clean TextField)
                if (value is not string strValue) return [];

                return strValue
                    .Split(',')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();
            }

            // Helper function to convert arrays/enumerables to list
            static List<string> ConvertArrayToList(object? value)
            {
                if (value == null) return [];
                if (value is not IEnumerable<object> enumValue) return [];

                return enumValue
                    .Select(v => v?.ToString()?.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Cast<string>()
                    .ToList();
            }

            // Debug: Log raw values BEFORE conversion
            var rawRestMethods = permission.GetValueOrDefault("restMethods");
            Console.WriteLine($"[PermissionsACL] RAW restMethods value: {rawRestMethods?.GetType().Name ?? "null"}");
            Console.WriteLine($"[PermissionsACL] RAW restMethods content: {System.Text.Json.JsonSerializer.Serialize(rawRestMethods)}");

            var roles = ConvertCommaSeparatedToList(permission.GetValueOrDefault("roles"));
            var contentTypes = ConvertCommaSeparatedToList(permission.GetValueOrDefault("contentTypes"));
            var restMethods = ConvertCommaSeparatedToList(rawRestMethods);

            // Debug: Log parsed values
            Console.WriteLine($"[PermissionsACL] Roles: [{string.Join(", ", roles)}]");
            Console.WriteLine($"[PermissionsACL] ContentTypes: [{string.Join(", ", contentTypes)}]");
            Console.WriteLine($"[PermissionsACL] RestMethods: [{string.Join(", ", restMethods)}]");

            foreach (var role in roles)
            {
                if (!permissionsByRole.ContainsKey(role))
                    permissionsByRole[role] = new Dictionary<string, Dictionary<string, bool>>();

                foreach (var ct in contentTypes)
                {
                    if (!permissionsByRole[role].ContainsKey(ct))
                        permissionsByRole[role][ct] = new Dictionary<string, bool>();

                    foreach (var restMethod in restMethods)
                    {
                        permissionsByRole[role][ct][restMethod] = true;
                    }
                }
            }
        }

        // Get user roles (or "Anonymous" if not authenticated)
        var userRoles = new List<string>();
        if (context.User.Identity?.IsAuthenticated == true)
        {
            userRoles = context.User.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();
        }

        // Always include Anonymous role
        if (!userRoles.Contains("Anonymous"))
        {
            userRoles.Add("Anonymous");
        }

        var requestMethod = httpMethod.ToUpper();

        // Debug: Log user roles and what we're checking
        Console.WriteLine($"[PermissionsACL] User roles: [{string.Join(", ", userRoles)}]");
        Console.WriteLine($"[PermissionsACL] Checking: {requestMethod} {contentType}");
        Console.WriteLine($"[PermissionsACL] Available roles in permissions: [{string.Join(", ", permissionsByRole.Keys)}]");

        // Check if any of the user's roles has permission
        var hasPermission = false;
        foreach (var role in userRoles)
        {
            if (permissionsByRole.ContainsKey(role))
            {
                Console.WriteLine($"[PermissionsACL] Role '{role}' found in permissions");
                if (permissionsByRole[role].ContainsKey(contentType))
                {
                    Console.WriteLine($"[PermissionsACL] ContentType '{contentType}' found for role '{role}'");
                    if (permissionsByRole[role][contentType].ContainsKey(requestMethod))
                    {
                        Console.WriteLine($"[PermissionsACL] Method '{requestMethod}' found - PERMISSION GRANTED");
                        hasPermission = true;
                        break;
                    }
                    else
                    {
                        Console.WriteLine($"[PermissionsACL] Method '{requestMethod}' NOT found. Available methods: [{string.Join(", ", permissionsByRole[role][contentType].Keys)}]");
                    }
                }
                else
                {
                    Console.WriteLine($"[PermissionsACL] ContentType '{contentType}' NOT found for role '{role}'. Available types: [{string.Join(", ", permissionsByRole[role].Keys)}]");
                }
            }
        }

        if (!hasPermission)
        {
            return Results.Json(new
            {
                error = "Forbidden",
                message = $"User does not have permission to {requestMethod} {contentType}"
            }, statusCode: 403);
        }

        // Permission granted, return null to indicate success
        return null;
    }
}
