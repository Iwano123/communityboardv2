using Microsoft.AspNetCore.Identity;
using OrchardCore.Users.Models;
using OrchardCore.Users.Services;
using System.Security.Claims;
using CommunityBoard.Cms.Services;
using Microsoft.Extensions.DependencyInjection;
using OrchardCore.Users;

namespace CommunityBoard.Cms.Services;

/// <summary>
/// Service for managing users and roles using Orchard Core's Identity system
/// This integrates Orchard Core's user management with the existing database
/// </summary>
public class OrchardUserService
{
    private readonly UserManager<IUser> _userManager;
    private readonly IUserStore<IUser> _userStore;
    private readonly DatabaseService _databaseService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrchardUserService> _logger;

    public OrchardUserService(
        UserManager<IUser> userManager,
        IUserStore<IUser> userStore,
        DatabaseService databaseService,
        IServiceProvider serviceProvider,
        ILogger<OrchardUserService> logger)
    {
        _userManager = userManager;
        _userStore = userStore;
        _databaseService = databaseService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Initialize default roles in Orchard Core
    /// </summary>
    public async Task InitializeRolesAsync()
    {
        try
        {
            var roleManager = _serviceProvider.GetService<RoleManager<IdentityRole>>();
            if (roleManager == null)
            {
                _logger.LogWarning("RoleManager not available - roles may need to be created manually in Orchard Core admin");
                return;
            }

            var roles = new[] { "Administrator", "Moderator", "User" };

            foreach (var roleName in roles)
            {
                var roleExists = await roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    var role = new IdentityRole(roleName);
                    var result = await roleManager.CreateAsync(role);
                    if (result.Succeeded)
                    {
                        _logger.LogInformation("Created Orchard Core role: {RoleName}", roleName);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to create role {RoleName}: {Errors}", 
                            roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing Orchard Core roles");
        }
    }

    /// <summary>
    /// Create or update a user in Orchard Core from database user
    /// </summary>
    public async Task<IUser?> SyncUserFromDatabaseAsync(int userId, string email, string firstName, string lastName, string role)
    {
        try
        {
            // Check if user already exists in Orchard Core
            var existingUser = await _userManager.FindByEmailAsync(email);
            
            if (existingUser == null)
            {
                // Create new Orchard Core user
                var user = new User
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                // Set custom properties
                if (user is User orchardUser)
                {
                    // Store our database user ID in a claim for reference
                    await _userStore.SetUserNameAsync(user, email, CancellationToken.None);
                }

                // Create user without password (they'll use our existing auth)
                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to create Orchard Core user for {Email}: {Errors}", 
                        email, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return null;
                }

                existingUser = user;
                _logger.LogInformation("Created Orchard Core user for database user {UserId}", userId);
            }

            // Sync role
            await SyncUserRoleAsync(existingUser, role);

            return existingUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing user {UserId} to Orchard Core", userId);
            return null;
        }
    }

    /// <summary>
    /// Sync user role from database to Orchard Core
    /// </summary>
    public async Task SyncUserRoleAsync(IUser user, string role)
    {
        try
        {
            var userEmail = await _userManager.GetEmailAsync(user) ?? "";
            
            // Map database roles to Orchard Core roles
            var orchardRole = MapRoleToOrchard(role);

            // Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Remove all current roles
            if (currentRoles.Any())
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
            }

            // Add new role
            if (!string.IsNullOrEmpty(orchardRole))
            {
                var result = await _userManager.AddToRoleAsync(user, orchardRole);
                if (result.Succeeded)
                {
                    _logger.LogInformation("Assigned role {Role} to user {Email}", orchardRole, userEmail);
                }
                else
                {
                    _logger.LogWarning("Failed to assign role {Role} to user {Email}: {Errors}", 
                        orchardRole, userEmail, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
        catch (Exception ex)
        {
            var userEmail = await _userManager.GetEmailAsync(user) ?? "";
            _logger.LogError(ex, "Error syncing role for user {Email}", userEmail);
        }
    }

    /// <summary>
    /// Map database role to Orchard Core role
    /// </summary>
    private string MapRoleToOrchard(string dbRole)
    {
        return dbRole?.ToLower() switch
        {
            "admin" or "administrator" => "Administrator",
            "moderator" => "Moderator",
            "user" or _ => "User"
        };
    }

    /// <summary>
    /// Get user roles from Orchard Core
    /// </summary>
    public async Task<IList<string>> GetUserRolesAsync(IUser user)
    {
        try
        {
            return await _userManager.GetRolesAsync(user);
        }
        catch (Exception ex)
        {
            var userEmail = await GetUserEmailAsync(user);
            _logger.LogError(ex, "Error getting roles for user {Email}", userEmail);
            return new List<string>();
        }
    }

    /// <summary>
    /// Check if user has a specific role
    /// </summary>
    public async Task<bool> UserHasRoleAsync(IUser user, string role)
    {
        try
        {
            var roles = await GetUserRolesAsync(user);
            return roles.Contains(role, StringComparer.OrdinalIgnoreCase);
        }
        catch (Exception ex)
        {
            var userEmail = await GetUserEmailAsync(user);
            _logger.LogError(ex, "Error checking role for user {Email}", userEmail);
            return false;
        }
    }

    /// <summary>
    /// Get Orchard Core user by email
    /// </summary>
    public async Task<IUser?> GetUserByEmailAsync(string email)
    {
        try
        {
            return await _userManager.FindByEmailAsync(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding user by email {Email}", email);
            return null;
        }
    }

    /// <summary>
    /// Get user email from IUser
    /// </summary>
    public async Task<string> GetUserEmailAsync(IUser user)
    {
        try
        {
            return await _userManager.GetEmailAsync(user) ?? "";
        }
        catch
        {
            return "";
        }
    }

    /// <summary>
    /// Sync all users from database to Orchard Core
    /// </summary>
    public async Task SyncAllUsersAsync()
    {
        try
        {
            var users = await _databaseService.QueryAsync(
                "SELECT id, email, firstName, lastName, role FROM users"
            );

            foreach (var user in users)
            {
                var userId = Convert.ToInt32(user["id"]);
                var email = user["email"]?.ToString() ?? "";
                var firstName = user["firstName"]?.ToString() ?? "";
                var lastName = user["lastName"]?.ToString() ?? "";
                var role = user["role"]?.ToString() ?? "user";

                await SyncUserFromDatabaseAsync(userId, email, firstName, lastName, role);
            }

            _logger.LogInformation("Synced {Count} users to Orchard Core", users.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing all users to Orchard Core");
        }
    }
}

