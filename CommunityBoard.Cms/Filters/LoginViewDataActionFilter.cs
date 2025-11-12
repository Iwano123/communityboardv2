using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Logging;
using OrchardCore.Users.ViewModels;
using System.Linq;
using System.Threading.Tasks;

namespace CommunityBoard.Cms.Filters;

/// <summary>
/// Action filter som säkerställer att Login-vyn har allt nödvändigt ViewData
/// Detta körs INNAN action-metoden körs
/// </summary>
public class LoginViewDataActionFilter : IAsyncActionFilter
{
    private readonly ILogger<LoginViewDataActionFilter> _logger;

    public LoginViewDataActionFilter(ILogger<LoginViewDataActionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var actionName = context.RouteData.Values["action"]?.ToString();
        var controllerName = context.RouteData.Values["controller"]?.ToString();
        var isLoginPath = context.HttpContext.Request.Path.StartsWithSegments("/Login", StringComparison.OrdinalIgnoreCase);

        _logger.LogInformation("LoginViewDataActionFilter: Action={Action}, Controller={Controller}, Path={Path}", actionName, controllerName, context.HttpContext.Request.Path);

        // Om det är Login-action, säkerställ att Controller har ViewData INNAN action körs
        if ((actionName == "Login" && (controllerName == "Account" || controllerName == null)) || isLoginPath)
        {
            if (context.Controller is Controller controller)
            {
                _logger.LogInformation("LoginViewDataActionFilter: Setting up ViewData for Login action");
                
                // Säkerställ att ViewData finns
                if (controller.ViewData == null)
                {
                    var metadataProvider = context.HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Mvc.ModelBinding.IModelMetadataProvider>();
                    controller.ViewData = new Microsoft.AspNetCore.Mvc.ViewFeatures.ViewDataDictionary(metadataProvider, context.ModelState);
                }

                // Säkerställ att ReturnUrl finns
                if (!controller.ViewData.ContainsKey("ReturnUrl") || controller.ViewData["ReturnUrl"] == null)
                {
                    var returnUrl = context.HttpContext.Request.Query["ReturnUrl"].ToString();
                    if (string.IsNullOrEmpty(returnUrl))
                    {
                        returnUrl = context.HttpContext.Request.Query["returnUrl"].ToString();
                    }
                    controller.ViewData["ReturnUrl"] = returnUrl ?? "/";
                    _logger.LogInformation("LoginViewDataActionFilter: Set ReturnUrl={ReturnUrl}", controller.ViewData["ReturnUrl"]);
                }

                // Säkerställ att ExternalProviders finns
                if (!controller.ViewData.ContainsKey("ExternalProviders") || controller.ViewData["ExternalProviders"] == null)
                {
                    controller.ViewData["ExternalProviders"] = new System.Collections.Generic.List<Microsoft.AspNetCore.Authentication.AuthenticationScheme>();
                    _logger.LogInformation("LoginViewDataActionFilter: Set ExternalProviders to empty list");
                }

                // Säkerställ att DisableLocalLogin finns
                if (!controller.ViewData.ContainsKey("DisableLocalLogin") || controller.ViewData["DisableLocalLogin"] == null)
                {
                    controller.ViewData["DisableLocalLogin"] = false;
                    _logger.LogInformation("LoginViewDataActionFilter: Set DisableLocalLogin=false");
                }
            }
        }

        // Kör action-metoden
        var executedContext = await next();

        // Efter att action-metoden har körts, säkerställ att ViewResult har korrekt ViewData
        if ((actionName == "Login" && (controllerName == "Account" || controllerName == null)) || isLoginPath)
        {
            if (executedContext.Result is ViewResult viewResult)
            {
                _logger.LogInformation("LoginViewDataActionFilter: Found ViewResult, ensuring ViewData is set");

                // Säkerställ att ViewData finns
                if (viewResult.ViewData == null)
                {
                    _logger.LogWarning("LoginViewDataActionFilter: ViewData was null in ViewResult, creating new");
                    var metadataProvider = context.HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Mvc.ModelBinding.IModelMetadataProvider>();
                    viewResult.ViewData = new Microsoft.AspNetCore.Mvc.ViewFeatures.ViewDataDictionary(metadataProvider, context.ModelState);
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
                    _logger.LogInformation("LoginViewDataActionFilter: Set ReturnUrl in ViewResult={ReturnUrl}", viewResult.ViewData["ReturnUrl"]);
                }

                // Säkerställ att ExternalProviders finns
                if (!viewResult.ViewData.ContainsKey("ExternalProviders") || viewResult.ViewData["ExternalProviders"] == null)
                {
                    viewResult.ViewData["ExternalProviders"] = new System.Collections.Generic.List<Microsoft.AspNetCore.Authentication.AuthenticationScheme>();
                    _logger.LogInformation("LoginViewDataActionFilter: Set ExternalProviders in ViewResult to empty list");
                }

                // Säkerställ att DisableLocalLogin finns
                if (!viewResult.ViewData.ContainsKey("DisableLocalLogin") || viewResult.ViewData["DisableLocalLogin"] == null)
                {
                    viewResult.ViewData["DisableLocalLogin"] = false;
                    _logger.LogInformation("LoginViewDataActionFilter: Set DisableLocalLogin in ViewResult=false");
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
                    _logger.LogInformation("LoginViewDataActionFilter: Set Model in ViewResult to new LoginViewModel");
                }

                _logger.LogInformation("LoginViewDataActionFilter: Completed processing Login view");
            }
        }
    }
}

