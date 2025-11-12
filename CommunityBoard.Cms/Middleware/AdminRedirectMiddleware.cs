using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace CommunityBoard.Cms.Middleware;

public class AdminRedirectMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AdminRedirectMiddleware>? _logger;

    public AdminRedirectMiddleware(RequestDelegate next, ILogger<AdminRedirectMiddleware>? logger = null)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only handle /admin requests (exact match, no trailing slash or path)
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals("/admin", StringComparison.OrdinalIgnoreCase))
        {
            _logger?.LogDebug("AdminRedirectMiddleware: Redirecting /admin to /admin/users");
            // Redirect to /admin/users which should work
            context.Response.Redirect("/admin/users", permanent: false);
            return;
        }

        await _next(context);
    }
}

