using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/login")]
public class LoginController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly OrchardUserService _orchardUserService;
    private readonly ILogger<LoginController> _logger;

    public LoginController(
        DatabaseService databaseService,
        SessionService sessionService,
        OrchardUserService orchardUserService,
        ILogger<LoginController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
        _orchardUserService = orchardUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var user = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (user == null || !user.ContainsKey("user"))
        {
            return StatusCode(500, new { error = "No user is logged in." });
        }
        
        return Ok(user["user"]);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] JsonElement body)
    {
        try
        {
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var user = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (user != null && user.ContainsKey("user"))
            {
                return StatusCode(500, new { error = "A user is already logged in." });
            }
            
            if (!body.TryGetProperty("email", out var emailElement) || !body.TryGetProperty("password", out var passwordElement))
            {
                _logger.LogWarning("Login attempt with missing email or password");
                return BadRequest(new { error = "Email and password are required." });
            }
            
            var email = emailElement.GetString();
            var password = passwordElement.GetString();
            
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Login attempt with empty email or password");
                return BadRequest(new { error = "Email and password are required." });
            }
            
            _logger.LogInformation("Login attempt for email: {Email}", email);
            
            var dbUser = await _databaseService.QueryOneAsync(
                "SELECT * FROM users WHERE email = $email",
                new Dictionary<string, object?> { ["email"] = email }
            );
            
            if (dbUser == null || dbUser.Count == 0 || dbUser.ContainsKey("error"))
            {
                _logger.LogWarning("Login failed: User not found for email: {Email}", email);
                return StatusCode(500, new { error = "No such user." });
            }
            
            var dbPassword = dbUser["password"]?.ToString();
            if (string.IsNullOrEmpty(dbPassword) || !BCrypt.Net.BCrypt.EnhancedVerify(password, dbPassword))
            {
                _logger.LogWarning("Login failed: Password mismatch for email: {Email}", email);
                return StatusCode(500, new { error = "Password mismatch." });
            }
            
            // Remove password from user object
            dbUser.Remove("password");
            
            // Sync user to Orchard Core for role management
            var userId = Convert.ToInt32(dbUser["id"]);
            var firstName = dbUser["firstName"]?.ToString() ?? "";
            var lastName = dbUser["lastName"]?.ToString() ?? "";
            var role = dbUser["role"]?.ToString() ?? "user";
            
            try
            {
                await _orchardUserService.SyncUserFromDatabaseAsync(userId, email, firstName, lastName, role);
            }
            catch (Exception syncEx)
            {
                _logger.LogWarning(syncEx, "Failed to sync user to Orchard Core, continuing with login");
            }
            
            // Store user in session
            await _sessionService.SetSessionDataAsync(sessionId, "user", dbUser);
            
            _logger.LogInformation("Login successful for email: {Email}", email);
            return Ok(dbUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { error = "An error occurred during login. Please try again." });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var user = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (user == null || !user.ContainsKey("user"))
        {
            return StatusCode(500, new { error = "No user is logged in." });
        }
        
        await _sessionService.SetSessionDataAsync(sessionId, "user", null);
        
        return Ok(new { status = "Successful logout." });
    }
}

