using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace CommunityBoard.Cms.Middleware;

/// <summary>
/// Middleware som fångar /admin och använder Orchard Core's inbyggda admin-routing
/// </summary>
public class AdminRouteMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AdminRouteMiddleware>? _logger;

    public AdminRouteMiddleware(RequestDelegate next, ILogger<AdminRouteMiddleware>? logger = null)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        
        // Om det är /admin, låt Orchard Core hantera det
        if (path.Equals("/admin", StringComparison.OrdinalIgnoreCase) || 
            path.Equals("/admin/", StringComparison.OrdinalIgnoreCase))
        {
            _logger?.LogInformation("AdminRouteMiddleware: Fångar /admin request");
            // Låt requesten passera till Orchard Core
            await _next(context);
            return;
        }

        await _next(context);
    }
}

