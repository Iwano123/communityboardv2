using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OrchardCore.Users;
using OrchardCore.Users.Models;
using OrchardCore.Users.Services;
using System.Text.Json.Nodes;
using System.Security.Claims;
using System.Linq;

namespace CommunityBoard.Cms;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        // Register new user
        app.MapPost("/api/auth/register", async (
            [FromBody] RegisterRequest request,
            [FromServices] IUserService userService,
            [FromServices] UserManager<IUser> userManager) =>
        {
            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.Password))
            {
                return Results.BadRequest(new { error = "Username and password required" });
            }

            var errors = new Dictionary<string, string>();
            var user = await userService.CreateUserAsync(
                new User
                {
                    UserName = request.Username,
                    Email = request.Email,
                    EmailConfirmed = true,
                    PhoneNumber = request.Phone,
                    Properties = new JsonObject
                    {
                        ["FirstName"] = request.FirstName ?? "",
                        ["LastName"] = request.LastName ?? ""
                    }
                },
                request.Password,
                (key, message) => errors[key] = message
            );

            if (user == null)
            {
                return Results.BadRequest(new
                {
                    error = "Registration failed",
                    details = errors
                });
            }

            // Assign Customer role (must exist in Orchard)
            await userManager.AddToRoleAsync(user, "Customer");

            return Results.Ok(new
            {
                username = user.UserName,
                email = request.Email,
                firstName = request.FirstName,
                lastName = request.LastName,
                phone = request.Phone,
                role = "Customer",
                message = "User created successfully"
            });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // POST /api/auth/login - Login with username OR email
        app.MapPost("/api/auth/login", async (
            [FromBody] LoginRequest request,
            [FromServices] SignInManager<IUser> signInManager,
            [FromServices] UserManager<IUser> userManager,
            HttpContext context) =>
        {
            if (string.IsNullOrEmpty(request.UsernameOrEmail) ||
                string.IsNullOrEmpty(request.Password))
            {
                return Results.BadRequest(new { error = "Username/email and password required" });
            }

            // Try to find user by username first, then by email
            var user = await userManager.FindByNameAsync(request.UsernameOrEmail);
            if (user == null)
            {
                user = await userManager.FindByEmailAsync(request.UsernameOrEmail);
            }

            if (user == null)
            {
                return Results.Json(new { error = "Invalid username or password" }, statusCode: 401);
            }

            var result = await signInManager.PasswordSignInAsync(
                user,
                request.Password,
                isPersistent: true,
                lockoutOnFailure: false
            );

            if (!result.Succeeded)
            {
                return Results.Json(new { error = "Invalid username or password" }, statusCode: 401);
            }

            var u = user as User;
            var roles = await userManager.GetRolesAsync(user);

            return Results.Ok(new
            {
                username = user.UserName,
                email = u?.Email,
                phoneNumber = u?.PhoneNumber,
                firstName = u?.Properties?["FirstName"]?.ToString(),
                lastName = u?.Properties?["LastName"]?.ToString(),
                roles = roles
            });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // GET /api/auth/login - Get current user
        app.MapGet("/api/auth/login", async (
            HttpContext context,
            [FromServices] UserManager<IUser> userManager) =>
        {
            var user = await userManager.GetUserAsync(context.User);
            if (user == null)
            {
                return Results.Unauthorized();
            }

            var u = user as User;

            return Results.Ok(new
            {
                username = user.UserName,
                email = u?.Email,
                phoneNumber = u?.PhoneNumber,
                firstName = u?.Properties?["FirstName"]?.ToString(),
                lastName = u?.Properties?["LastName"]?.ToString(),
                roles = context.User.FindAll(ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList()
            });
        });

        // DELETE /api/auth/login - Logout
        app.MapDelete("/api/auth/login", async (
            [FromServices] SignInManager<IUser> signInManager) =>
        {
            await signInManager.SignOutAsync();
            return Results.Ok(new { message = "Logged out successfully" });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // POST /api/auth/reset-admin-password - Återställ admin-lösenord
        app.MapPost("/api/auth/reset-admin-password", async (
            [FromBody] ResetAdminPasswordRequest request,
            [FromServices] UserManager<IUser> userManager) =>
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.NewPassword))
            {
                return Results.BadRequest(new { error = "Username and new password required" });
            }

            var user = await userManager.FindByNameAsync(request.Username);
            if (user == null)
            {
                user = await userManager.FindByEmailAsync(request.Username);
            }

            if (user == null)
            {
                return Results.BadRequest(new { error = "User not found" });
            }

            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var result = await userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
            {
                return Results.BadRequest(new { error = "Failed to reset password", details = result.Errors });
            }

            return Results.Ok(new { message = "Password reset successfully" });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // POST /api/auth/recreate-admin - Ta bort och skapa ny admin-användare
        app.MapPost("/api/auth/recreate-admin", async (
            [FromBody] CreateAdminRequest request,
            [FromServices] IUserService userService,
            [FromServices] UserManager<IUser> userManager) =>
        {
            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.Email))
            {
                return Results.BadRequest(new { error = "Username, email and password required" });
            }

            // Ta bort befintlig admin-användare om den finns
            var existingAdmins = await userManager.GetUsersInRoleAsync("Administrator");
            if (existingAdmins != null && existingAdmins.Any())
            {
                foreach (var admin in existingAdmins)
                {
                    if (admin.UserName == request.Username || (admin is User u && u.Email == request.Email))
                    {
                        await userManager.DeleteAsync(admin);
                    }
                }
            }

            // Skapa ny admin-användare
            var errors = new Dictionary<string, string>();
            var user = await userService.CreateUserAsync(
                new User
                {
                    UserName = request.Username,
                    Email = request.Email,
                    EmailConfirmed = true,
                    Properties = new JsonObject
                    {
                        ["FirstName"] = request.FirstName ?? "Admin",
                        ["LastName"] = request.LastName ?? "User"
                    }
                },
                request.Password,
                (key, message) => errors[key] = message
            );

            if (user == null)
            {
                return Results.BadRequest(new
                {
                    error = "Failed to create admin user",
                    details = errors
                });
            }

            // Ge användaren Administrator-rollen
            await userManager.AddToRoleAsync(user, "Administrator");

            return Results.Ok(new
            {
                username = user.UserName,
                email = request.Email,
                message = "Admin user recreated successfully. You can now log in."
            });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // POST /api/auth/create-admin - Skapa admin-användare (endast om ingen admin finns)
        app.MapPost("/api/auth/create-admin", async (
            [FromBody] CreateAdminRequest request,
            [FromServices] IUserService userService,
            [FromServices] UserManager<IUser> userManager) =>
        {
            // Kolla om det redan finns en admin
            var existingAdmins = await userManager.GetUsersInRoleAsync("Administrator");
            if (existingAdmins != null && existingAdmins.Any())
            {
                return Results.BadRequest(new { error = "Admin user already exists", message = "Use /api/auth/reset-admin-password to reset password" });
            }

            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.Email))
            {
                return Results.BadRequest(new { error = "Username, email and password required" });
            }

            var errors = new Dictionary<string, string>();
            var user = await userService.CreateUserAsync(
                new User
                {
                    UserName = request.Username,
                    Email = request.Email,
                    EmailConfirmed = true,
                    Properties = new JsonObject
                    {
                        ["FirstName"] = request.FirstName ?? "Admin",
                        ["LastName"] = request.LastName ?? "User"
                    }
                },
                request.Password,
                (key, message) => errors[key] = message
            );

            if (user == null)
            {
                return Results.BadRequest(new
                {
                    error = "Failed to create admin user",
                    details = errors
                });
            }

            // Ge användaren Administrator-rollen
            await userManager.AddToRoleAsync(user, "Administrator");

            return Results.Ok(new
            {
                username = user.UserName,
                email = request.Email,
                message = "Admin user created successfully. You can now log in."
            });
        })
        .AllowAnonymous()
        .DisableAntiforgery();

        // POST /api/auth/enable-features - Aktivera Orchard Core-features
        app.MapPost("/api/auth/enable-features", async (
            HttpContext context) =>
        {
            // Detta är en placeholder - features måste aktiveras via Orchard Core's admin-panel
            // eller via appsettings.json vid startup
            return Results.Ok(new
            {
                message = "Features måste aktiveras via Orchard Core's admin-panel på /admin/features",
                note = "Features som listas i appsettings.json under OrchardCore.Features.Default aktiveras automatiskt vid startup",
                features = new[]
                {
                    "OrchardCore.Admin",
                    "TheAdmin",
                    "OrchardCore.Users",
                    "OrchardCore.Roles",
                    "OrchardCore.Resources",
                    "OrchardCore.Features"
                }
            });
        })
        .AllowAnonymous()
        .DisableAntiforgery();
    }
}

public record RegisterRequest(
    string Username,
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Phone
);

public record LoginRequest(string UsernameOrEmail, string Password);

public record CreateAdminRequest(
    string Username,
    string Email,
    string Password,
    string? FirstName,
    string? LastName
);

public record ResetAdminPasswordRequest(
    string Username,
    string NewPassword
);

