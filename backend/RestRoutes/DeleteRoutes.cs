namespace RestRoutes;

using OrchardCore.ContentManagement;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using OrchardCore.Users;
using System.Security.Claims;

public static class DeleteRoutes
{
    public static void MapDeleteRoutes(this WebApplication app)
    {
        app.MapDelete("api/{contentType}/{id}", async (
            string contentType,
            string id,
            [FromServices] IContentManager contentManager,
            [FromServices] YesSql.ISession session,
            [FromServices] UserManager<IUser> userManager,
            HttpContext context) =>
        {
            try
            {
                // Check permissions
                var permissionCheck = await PermissionsACL.CheckPermissions(contentType, "DELETE", context, session);
                if (permissionCheck != null) return permissionCheck;

                // Get the existing content item
                var contentItem = await contentManager.GetAsync(id, VersionOptions.Published);

                if (contentItem == null || contentItem.ContentType != contentType)
                {
                    return Results.Json(new { error = "Content item not found" }, statusCode: 404);
                }

                // Check ownership: Users can only delete their own content (unless Administrator or Moderator)
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var currentUser = await userManager.GetUserAsync(context.User);
                    if (currentUser != null)
                    {
                        var userRoles = context.User.FindAll(ClaimTypes.Role)
                            .Select(c => c.Value)
                            .ToList();

                        // Administrators and Moderators can delete any content
                        var isAdminOrModerator = userRoles.Contains("Administrator") || userRoles.Contains("Moderator");

                        if (!isAdminOrModerator)
                        {
                            // Check if the current user owns this content item
                            var owner = contentItem.Owner ?? contentItem.Author;
                            var currentUserName = currentUser.UserName ?? "";
                            var currentUserEmail = (currentUser as OrchardCore.Users.Models.User)?.Email ?? "";

                            // Normalize comparison: check both username and email
                            var isOwner = !string.IsNullOrEmpty(owner) && 
                                         (owner.Equals(currentUserName, StringComparison.OrdinalIgnoreCase) ||
                                          owner.Equals(currentUserEmail, StringComparison.OrdinalIgnoreCase));

                            if (!isOwner)
                            {
                                return Results.Json(new {
                                    error = "Forbidden",
                                    message = "You can only delete your own content"
                                }, statusCode: 403);
                            }
                        }
                    }
                }
                else
                {
                    // Anonymous users cannot delete content (should be caught by permissions check, but double-check)
                    return Results.Json(new {
                        error = "Unauthorized",
                        message = "Authentication required to delete content"
                    }, statusCode: 401);
                }

                // Remove the content item
                await contentManager.RemoveAsync(contentItem);
                await session.SaveChangesAsync();

                return Results.Json(new {
                    success = true,
                    id = id
                }, statusCode: 200);
            }
            catch (Exception ex)
            {
                return Results.Json(new {
                    error = ex.Message
                }, statusCode: 500);
            }
        });
    }
}
