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
    private readonly ILogger<LoginController> _logger;

    public LoginController(
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<LoginController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
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
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var user = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (user != null && user.ContainsKey("user"))
        {
            return StatusCode(500, new { error = "A user is already logged in." });
        }
        
        var email = body.GetProperty("email").GetString();
        var password = body.GetProperty("password").GetString();
        
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }
        
        var dbUser = await _databaseService.QueryOneAsync(
            "SELECT * FROM users WHERE email = $email",
            new Dictionary<string, object?> { ["email"] = email }
        );
        
        if (dbUser == null || dbUser.Count == 0 || dbUser.ContainsKey("error"))
        {
            return StatusCode(500, new { error = "No such user." });
        }
        
        var dbPassword = dbUser["password"]?.ToString();
        if (string.IsNullOrEmpty(dbPassword) || !BCrypt.Net.BCrypt.EnhancedVerify(password, dbPassword))
        {
            return StatusCode(500, new { error = "Password mismatch." });
        }
        
        // Remove password from user object
        dbUser.Remove("password");
        
        // Store user in session
        await _sessionService.SetSessionDataAsync(sessionId, "user", dbUser);
        
        return Ok(dbUser);
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

