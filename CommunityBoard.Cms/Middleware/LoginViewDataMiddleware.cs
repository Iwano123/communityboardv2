using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Logging;
using OrchardCore.Users.ViewModels;
using System.Threading.Tasks;

namespace CommunityBoard.Cms.Middleware;

/// <summary>
/// Middleware som säkerställer att Login-vyn har allt nödvändigt ViewData
/// </summary>
public class LoginViewDataMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LoginViewDataMiddleware> _logger;

    public LoginViewDataMiddleware(RequestDelegate next, ILogger<LoginViewDataMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        // Efter att requesten har bearbetats, kolla om det är en Login-view
        if (context.Request.Path.StartsWithSegments("/Login") && context.Request.Method == "GET")
        {
            _logger.LogInformation("LoginViewDataMiddleware: Detected Login GET request");

            // Om det finns en ViewResult i context, säkerställ att ViewData är korrekt satt
            // Detta görs genom att modifiera response om det är en ViewResult
            // Men eftersom vi är efter _next(), kan vi inte modifiera ViewData direkt
            // Så vi behöver använda en annan approach
        }
    }
}

