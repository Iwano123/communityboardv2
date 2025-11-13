namespace RestRoutes;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OrchardCore.Users;
using OrchardCore.Users.Models;
using OrchardCore.Users.Services;
using System.Text.Json.Nodes;
using System.Security.Claims;
using System.Linq;

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
            try
            {
                Console.WriteLine($"[REGISTER] Attempting to register user: Username={request?.Username}, Email={request?.Email}");
                
                if (request == null)
                {
                    Console.WriteLine("[REGISTER] Request body is null");
                    return Results.BadRequest(new { error = "Request body is required" });
                }
                
                if (string.IsNullOrEmpty(request.Username) ||
                    string.IsNullOrEmpty(request.Password))
                {
                    Console.WriteLine("[REGISTER] Validation failed: Username or password is empty");
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
                    var errorMessages = errors.Count > 0 
                        ? string.Join(", ", errors.Values) 
                        : "Unknown error";
                    Console.WriteLine($"[REGISTER] Registration failed. Errors: {errorMessages}");
                    Console.WriteLine($"[REGISTER] Error details: {System.Text.Json.JsonSerializer.Serialize(errors)}");
                    
                    return Results.BadRequest(new
                    {
                        error = "Registration failed",
                        details = errors
                    });
                }
                
                Console.WriteLine($"[REGISTER] User created successfully: {user.UserName}");

                // Assign Customer role (must exist in Orchard)
                try
                {
                    var roleResult = await userManager.AddToRoleAsync(user, "Customer");
                    if (!roleResult.Succeeded)
                    {
                        Console.WriteLine($"[REGISTER] Warning: Failed to assign Customer role. Errors: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                        // Continue anyway - user is created
                    }
                }
                catch (Exception roleEx)
                {
                    Console.WriteLine($"[REGISTER] Exception assigning Customer role: {roleEx.Message}");
                    // Continue anyway - user is created
                }

                var u = user as User;
                return Results.Ok(new
                {
                    id = u?.UserId,
                    username = user.UserName,
                    email = request.Email,
                    firstName = request.FirstName,
                    lastName = request.LastName,
                    phone = request.Phone,
                    role = "Customer",
                    message = "User created successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REGISTER] Exception occurred: {ex.Message}");
                Console.WriteLine($"[REGISTER] Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new
                {
                    error = "Registration failed",
                    details = new Dictionary<string, string>
                    {
                        ["Exception"] = ex.Message
                    }
                });
            }
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
            IUser? user = null;
            try
            {
                Console.WriteLine($"[LOGIN] Attempting login: UsernameOrEmail={request?.UsernameOrEmail}");
                
                if (string.IsNullOrEmpty(request.UsernameOrEmail) ||
                    string.IsNullOrEmpty(request.Password))
                {
                    Console.WriteLine("[LOGIN] Validation failed: UsernameOrEmail or password is empty");
                    return Results.BadRequest(new { error = "Username/email and password required" });
                }

                // Try to find user by username first, then by email
                user = await userManager.FindByNameAsync(request.UsernameOrEmail);
                if (user == null)
                {
                    Console.WriteLine($"[LOGIN] User not found by username, trying email: {request.UsernameOrEmail}");
                    user = await userManager.FindByEmailAsync(request.UsernameOrEmail);
                }

                if (user == null)
                {
                    Console.WriteLine($"[LOGIN] User not found: {request.UsernameOrEmail}");
                    return Results.Unauthorized();
                }

                Console.WriteLine($"[LOGIN] User found: {user.UserName}, Email: {(user as User)?.Email}");

                var result = await signInManager.PasswordSignInAsync(
                    user,
                    request.Password,
                    isPersistent: true,
                    lockoutOnFailure: false
                );

                if (!result.Succeeded)
                {
                    Console.WriteLine($"[LOGIN] Password sign-in failed for user: {user.UserName}");
                    if (result.IsLockedOut)
                    {
                        Console.WriteLine("[LOGIN] Account is locked out");
                    }
                    if (result.IsNotAllowed)
                    {
                        Console.WriteLine("[LOGIN] Login not allowed");
                    }
                    return Results.Unauthorized();
                }
                
                Console.WriteLine($"[LOGIN] Login successful for user: {user.UserName}");

                var u = user as User;
                return Results.Ok(new
                {
                    id = u?.UserId,
                    username = user.UserName,
                    email = u?.Email,
                    phoneNumber = u?.PhoneNumber,
                    firstName = u?.Properties?["FirstName"]?.ToString(),
                    lastName = u?.Properties?["LastName"]?.ToString(),
                    roles = context.User.FindAll(ClaimTypes.Role)
                        .Select(c => c.Value)
                        .ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN] Exception occurred: {ex.Message}");
                Console.WriteLine($"[LOGIN] Stack trace: {ex.StackTrace}");
                return Results.BadRequest(new { error = "Login failed", details = ex.Message });
            }
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
                id = u?.UserId,
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