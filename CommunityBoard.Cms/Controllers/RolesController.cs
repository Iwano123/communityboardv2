using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using OrchardCore.Users.Models;
using OrchardCore.Users.Services;
using OrchardCore.Users;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly OrchardUserService _orchardUserService;
    private readonly UserManager<IUser> _userManager;
    private readonly IServiceProvider _serviceProvider;
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        OrchardUserService orchardUserService,
        UserManager<IUser> userManager,
        IServiceProvider serviceProvider,
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<RolesController> logger)
    {
        _orchardUserService = orchardUserService;
        _userManager = userManager;
        _serviceProvider = serviceProvider;
        _databaseService = databaseService;
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all available roles
    /// </summary>
    [HttpGet]
    public Task<IActionResult> Get()
    {
        try
        {
            var roleManager = _serviceProvider.GetService<RoleManager<IdentityRole>>();
            if (roleManager == null)
            {
                return Task.FromResult<IActionResult>(StatusCode(500, new { error = "Role management not available" }));
            }

            var roles = roleManager.Roles.Select(r => r.Name).ToList();
            return Task.FromResult<IActionResult>(Ok(roles));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching roles");
            return Task.FromResult<IActionResult>(StatusCode(500, new { error = "An error occurred while fetching roles." }));
        }
    }

    /// <summary>
    /// Get roles for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserRoles(int userId)
    {
        try
        {
            // Get user from database
            var dbUser = await _databaseService.QueryOneAsync(
                "SELECT email FROM users WHERE id = $userId",
                new Dictionary<string, object?> { ["userId"] = userId }
            );

            if (dbUser == null || dbUser.Count == 0)
            {
                return NotFound(new { error = "User not found." });
            }

            var email = dbUser["email"]?.ToString();
            if (string.IsNullOrEmpty(email))
            {
                return NotFound(new { error = "User email not found." });
            }

            // Get Orchard Core user
            var orchardUser = await _orchardUserService.GetUserByEmailAsync(email);
            if (orchardUser == null)
            {
                // User not synced to Orchard Core yet, return database role
                var role = dbUser.ContainsKey("role") ? dbUser["role"]?.ToString() : "user";
                return Ok(new { roles = new[] { role }, source = "database" });
            }

            // Get roles from Orchard Core
            var roles = await _orchardUserService.GetUserRolesAsync(orchardUser);
            return Ok(new { roles = roles, source = "orchard" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user roles for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while fetching user roles." });
        }
    }

    /// <summary>
    /// Assign a role to a user
    /// </summary>
    [HttpPost("user/{userId}")]
    public async Task<IActionResult> AssignRole(int userId, [FromBody] JsonElement body)
    {
        try
        {
            // Check if current user is admin
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Unauthorized(new { error = "User must be logged in." });
            }

            var currentUser = sessionData["user"] as Dictionary<string, object?>;
            var currentUserRole = currentUser?["role"]?.ToString()?.ToLower();
            
            if (currentUserRole != "admin" && currentUserRole != "administrator")
            {
                return Forbid();
            }

            if (!body.TryGetProperty("role", out var roleElement))
            {
                return BadRequest(new { error = "role is required." });
            }

            var roleName = roleElement.GetString();
            if (string.IsNullOrEmpty(roleName))
            {
                return BadRequest(new { error = "role cannot be empty." });
            }

            // Get user from database
            var dbUser = await _databaseService.QueryOneAsync(
                "SELECT email, firstName, lastName, role FROM users WHERE id = $userId",
                new Dictionary<string, object?> { ["userId"] = userId }
            );

            if (dbUser == null || dbUser.Count == 0)
            {
                return NotFound(new { error = "User not found." });
            }

            var email = dbUser["email"]?.ToString() ?? "";
            var firstName = dbUser["firstName"]?.ToString() ?? "";
            var lastName = dbUser["lastName"]?.ToString() ?? "";

            // Update role in database
            await _databaseService.QueryAsync(
                "UPDATE users SET role = $role WHERE id = $userId",
                new Dictionary<string, object?> 
                { 
                    ["role"] = roleName.ToLower(),
                    ["userId"] = userId 
                }
            );

            // Sync to Orchard Core
            await _orchardUserService.SyncUserFromDatabaseAsync(userId, email, firstName, lastName, roleName);

            _logger.LogInformation("Role {Role} assigned to user {UserId} by admin", roleName, userId);
            return Ok(new { message = $"Role {roleName} assigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role to user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while assigning role." });
        }
    }

    /// <summary>
    /// Initialize default roles in Orchard Core
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeRoles()
    {
        try
        {
            // Check if current user is admin
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Unauthorized(new { error = "User must be logged in." });
            }

            var currentUser = sessionData["user"] as Dictionary<string, object?>;
            var currentUserRole = currentUser?["role"]?.ToString()?.ToLower();
            
            if (currentUserRole != "admin" && currentUserRole != "administrator")
            {
                return Forbid();
            }

            await _orchardUserService.InitializeRolesAsync();
            return Ok(new { message = "Roles initialized successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing roles");
            return StatusCode(500, new { error = "An error occurred while initializing roles." });
        }
    }

    /// <summary>
    /// Sync all users from database to Orchard Core
    /// </summary>
    [HttpPost("sync-users")]
    public async Task<IActionResult> SyncAllUsers()
    {
        try
        {
            // Check if current user is admin
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Unauthorized(new { error = "User must be logged in." });
            }

            var currentUser = sessionData["user"] as Dictionary<string, object?>;
            var currentUserRole = currentUser?["role"]?.ToString()?.ToLower();
            
            if (currentUserRole != "admin" && currentUserRole != "administrator")
            {
                return Forbid();
            }

            await _orchardUserService.SyncAllUsersAsync();
            return Ok(new { message = "All users synced to Orchard Core successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing users");
            return StatusCode(500, new { error = "An error occurred while syncing users." });
        }
    }
}

