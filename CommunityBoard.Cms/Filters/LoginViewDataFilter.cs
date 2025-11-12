using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Logging;
using OrchardCore.Users.ViewModels;

namespace CommunityBoard.Cms.Filters;

/// <summary>
/// Filter som säkerställer att Login-vyn har allt nödvändigt ViewData
/// </summary>
public class LoginViewDataFilter : IAsyncResultFilter
{
    private readonly ILogger<LoginViewDataFilter> _logger;

    public LoginViewDataFilter(ILogger<LoginViewDataFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        // Kolla om det är en ViewResult för Login-action
        if (context.Result is ViewResult viewResult)
        {
            var actionName = context.RouteData.Values["action"]?.ToString();
            var controllerName = context.RouteData.Values["controller"]?.ToString();

            var isLoginPath = context.HttpContext.Request.Path.StartsWithSegments("/Login", StringComparison.OrdinalIgnoreCase);
            _logger.LogInformation("LoginViewDataFilter: Action={Action}, Controller={Controller}, Path={Path}", actionName, controllerName, context.HttpContext.Request.Path);

            if ((actionName == "Login" && (controllerName == "Account" || controllerName == null)) || isLoginPath)
            {
                _logger.LogInformation("LoginViewDataFilter: Processing Login view");

                // Säkerställ att ViewData finns
                if (viewResult.ViewData == null)
                {
                    _logger.LogWarning("LoginViewDataFilter: ViewData was null, creating new ViewDataDictionary");
                    viewResult.ViewData = new ViewDataDictionary(context.HttpContext.RequestServices.GetRequiredService<IModelMetadataProvider>(), context.ModelState);
                }

                // Säkerställ att ReturnUrl finns
                if (!viewResult.ViewData.ContainsKey("ReturnUrl") || viewResult.ViewData["ReturnUrl"] == null)
                {
                    var returnUrl = context.HttpContext.Request.Query["ReturnUrl"].ToString();
                    if (string.IsNullOrEmpty(returnUrl))
                    {
                        returnUrl = context.HttpContext.Request.Query["returnUrl"].ToString();
                    }
                    viewResult.ViewData["ReturnUrl"] = returnUrl ?? "/";
                    _logger.LogDebug("LoginViewDataFilter: Set ReturnUrl={ReturnUrl}", viewResult.ViewData["ReturnUrl"]);
                }

                // Säkerställ att ExternalProviders finns (tom lista om null)
                if (!viewResult.ViewData.ContainsKey("ExternalProviders") || viewResult.ViewData["ExternalProviders"] == null)
                {
                    viewResult.ViewData["ExternalProviders"] = new List<Microsoft.AspNetCore.Authentication.AuthenticationScheme>();
                    _logger.LogDebug("LoginViewDataFilter: Set ExternalProviders to empty list");
                }

                // Säkerställ att DisableLocalLogin finns
                if (!viewResult.ViewData.ContainsKey("DisableLocalLogin") || viewResult.ViewData["DisableLocalLogin"] == null)
                {
                    viewResult.ViewData["DisableLocalLogin"] = false;
                    _logger.LogDebug("LoginViewDataFilter: Set DisableLocalLogin=false");
                }

                // Säkerställ att Model finns
                if (viewResult.ViewData.Model == null)
                {
                    viewResult.ViewData.Model = new LoginViewModel
                    {
                        UserName = "",
                        Password = "",
                        RememberMe = false
                    };
                    _logger.LogDebug("LoginViewDataFilter: Set Model to new LoginViewModel");
                }

                _logger.LogInformation("LoginViewDataFilter: Completed processing Login view");
            }
        }

        await next();
    }
}

