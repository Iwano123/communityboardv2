using Microsoft.Data.Sqlite;
using System.Text.Json;
using System.Collections.Generic;

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

        var dataJson = JsonSerializer.Serialize(data);
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
        context.Response.Cookies.Append("session", sessionId);

        await _databaseService.QueryAsync(
            "INSERT INTO sessions(id) VALUES($id)",
            new Dictionary<string, object?> { ["id"] = sessionId }
        );

        return sessionId;
    }
}

