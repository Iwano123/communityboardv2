using System;
using System.Linq;
using System.Collections.Generic;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Matching;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Logging;

namespace CommunityBoard.Cms.Policies;

/// <summary>
/// Resolves /admin ambiguity by preferring OrchardCore.Admin's AdminController.Index.
/// This does not affect other routes.
/// </summary>
public sealed class OrchardAdminEndpointSelectorPolicy : MatcherPolicy, IEndpointSelectorPolicy
{
    private readonly ILogger<OrchardAdminEndpointSelectorPolicy>? _logger;

    public OrchardAdminEndpointSelectorPolicy(ILogger<OrchardAdminEndpointSelectorPolicy>? logger = null)
    {
        _logger = logger;
    }

    public override int Order => -1000; // Run early to resolve ambiguity

    public bool AppliesToEndpoints(IReadOnlyList<Endpoint> endpoints)
    {
        if (endpoints == null || endpoints.Count <= 1)
        {
            return false;
        }

        // Apply only if there are multiple AdminController.Index matches
        var adminMatches = 0;
        for (var i = 0; i < endpoints.Count; i++)
        {
            var action = endpoints[i]?.Metadata?.GetMetadata<ControllerActionDescriptor>();
            if (action != null &&
                string.Equals(action.ControllerName, "Admin", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(action.ActionName, "Index", StringComparison.OrdinalIgnoreCase))
            {
                adminMatches++;
            }
        }
        return adminMatches > 1;
    }

    public Task ApplyAsync(HttpContext httpContext, CandidateSet candidates)
    {
        // Only act on /admin requests (case-insensitive, with or without trailing slash)
        var path = httpContext.Request.Path.Value ?? string.Empty;
        if (!path.Equals("/admin", StringComparison.OrdinalIgnoreCase) && 
            !path.Equals("/admin/", StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        _logger?.LogInformation("OrchardAdminEndpointSelectorPolicy: Processing /admin request with {Count} candidates", candidates.Count);

        // Prefer OrchardCore.Admin assembly when multiple AdminController.Index endpoints exist.
        var preferredIndex = -1;
        var adminIndices = new List<int>();
        var assemblyNames = new List<string>();
        
        for (var i = 0; i < candidates.Count; i++)
        {
            if (!candidates.IsValidCandidate(i))
            {
                continue;
            }
            
            var action = candidates[i].Endpoint?.Metadata?.GetMetadata<ControllerActionDescriptor>();
            if (action == null)
            {
                continue;
            }

            var isAdminIndex =
                string.Equals(action.ControllerName, "Admin", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(action.ActionName, "Index", StringComparison.OrdinalIgnoreCase);

            if (!isAdminIndex)
            {
                continue;
            }

            adminIndices.Add(i);
            var asmName = action.ControllerTypeInfo?.Assembly?.GetName()?.Name ?? string.Empty;
            assemblyNames.Add(asmName);
            
            _logger?.LogDebug("Found AdminController.Index in assembly: {AssemblyName}", asmName);
            
            // Prioritize OrchardCore.Admin (the main admin module)
            if (asmName.Equals("OrchardCore.Admin", StringComparison.OrdinalIgnoreCase))
            {
                preferredIndex = i;
                _logger?.LogInformation("Found OrchardCore.Admin, using it for /admin");
                break;
            }
        }

        // If we found OrchardCore.Admin, invalidate all others
        if (preferredIndex >= 0)
        {
            _logger?.LogInformation("OrchardAdminEndpointSelectorPolicy: Found OrchardCore.Admin at index {Index}, invalidating others", preferredIndex);
            for (var i = 0; i < candidates.Count; i++)
            {
                if (i != preferredIndex)
                {
                    candidates.SetValidity(i, false);
                }
            }
        }
        // If we didn't find OrchardCore.Admin but have multiple matches, use first one
        else if (adminIndices.Count > 1)
        {
            _logger?.LogWarning("OrchardCore.Admin not found in matches. Found: {Assemblies}. Using first match at index {Index}.", string.Join(", ", assemblyNames), adminIndices[0]);
            for (var i = 0; i < candidates.Count; i++)
            {
                if (adminIndices.Contains(i) && i != adminIndices[0])
                {
                    candidates.SetValidity(i, false);
                }
            }
        }
        else
        {
            _logger?.LogWarning("OrchardAdminEndpointSelectorPolicy: No admin matches found or only one match");
        }

        return Task.CompletedTask;
    }
}

