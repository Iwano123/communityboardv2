using Microsoft.Data.Sqlite;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace CommunityBoard.Cms.Services;

public class SessionService
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<SessionService> _logger;

    public SessionService(DatabaseService databaseService, ILogger<SessionService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    public async Task<Dictionary<string, object?>?> GetSessionAsync(string sessionId)
    {
        var session = await _databaseService.QueryOneAsync(
            "SELECT * FROM sessions WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = sessionId }
        );

        if (session == null || session.Count == 0 || session.ContainsKey("error"))
        {
            return null;
        }

        return session;
    }

    public async Task<Dictionary<string, object?>?> GetSessionDataAsync(string sessionId)
    {
        var session = await GetSessionAsync(sessionId);
        if (session == null || !session.ContainsKey("data"))
        {
            return null;
        }

        var dataJson = session["data"]?.ToString() ?? "{}";
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(dataJson) ?? new Dictionary<string, object?>();
        }
        catch
        {
            return new Dictionary<string, object?>();
        }
    }

    public async Task SetSessionDataAsync(string sessionId, string key, object? value)
    {
        var data = await GetSessionDataAsync(sessionId) ?? new Dictionary<string, object?>();
        data[key] = value;

        // Use JsonSerializerOptions to handle complex objects properly
        var options = new JsonSerializerOptions
        {
            WriteIndented = false,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
        
        var dataJson = JsonSerializer.Serialize(data, options);
        await _databaseService.QueryAsync(
            @"UPDATE sessions SET modified = DATETIME('now'), data = $data WHERE id = $id",
            new Dictionary<string, object?>
            {
                ["id"] = sessionId,
                ["data"] = dataJson
            }
        );
    }

    public async Task<string> GetOrCreateSessionIdAsync(HttpContext context)
    {
        if (context.Request.Cookies.TryGetValue("session", out var sessionId) && !string.IsNullOrEmpty(sessionId))
        {
            var session = await GetSessionAsync(sessionId);
            if (session != null)
            {
                return sessionId;
            }
        }

        sessionId = Guid.NewGuid().ToString();
        
        // Configure cookie options for CORS and session management
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax, // Use Lax for localhost, None for cross-origin with Secure=true
            Secure = false, // Set to true in production with HTTPS
            MaxAge = TimeSpan.FromDays(30), // Session expires after 30 days
            Path = "/"
        };
        
        context.Response.Cookies.Append("session", sessionId, cookieOptions);

        await _databaseService.QueryAsync(
            "INSERT INTO sessions(id) VALUES($id)",
            new Dictionary<string, object?> { ["id"] = sessionId }
        );

        return sessionId;
    }
}

