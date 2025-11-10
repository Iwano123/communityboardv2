using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<NotificationController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var user = sessionData["user"] as Dictionary<string, object?>;
        var userId = Convert.ToInt32(user?["id"]);

        // Parse query parameters
        var query = Request.Query;
        var sql = "SELECT * FROM notifications WHERE user_id = $user_id";
        var parameters = new Dictionary<string, object?> { ["user_id"] = userId };

        // Handle orderby - parse format like "-created_at" or "created_at"
        if (query.ContainsKey("orderby"))
        {
            var orderby = query["orderby"].ToString();
            if (orderby.StartsWith("-"))
            {
                var column = orderby.Substring(1);
                // Sanitize column name
                column = Regex.Replace(column, @"[^a-zA-Z0-9_]", "");
                sql += $" ORDER BY {column} DESC";
            }
            else
            {
                var column = Regex.Replace(orderby, @"[^a-zA-Z0-9_]", "");
                sql += $" ORDER BY {column} ASC";
            }
        }

        // Handle limit
        if (query.ContainsKey("limit"))
        {
            sql += $" LIMIT {query["limit"]}";
        }

        var results = await _databaseService.QueryAsync(sql, parameters);
        
        if (results.Count > 0 && results[0].ContainsKey("error"))
        {
            return BadRequest(results[0]);
        }
        
        return Ok(results);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] JsonElement body)
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var user = sessionData["user"] as Dictionary<string, object?>;
        var userId = Convert.ToInt32(user?["id"]);

        // Verify the notification belongs to the user
        var notification = await _databaseService.QueryOneAsync(
            "SELECT * FROM notifications WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = id }
        );

        if (notification.Count == 0 || notification.ContainsKey("error"))
        {
            return NotFound(new { error = "Notification not found." });
        }

        var notificationUserId = Convert.ToInt32(notification["user_id"]);
        if (notificationUserId != userId)
        {
            return Unauthorized(new { error = "Unauthorized." });
        }

        // Parse body
        var bodyDict = new Dictionary<string, object?>();
        if (body.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in body.EnumerateObject())
            {
                bodyDict[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString(),
                    JsonValueKind.Number => prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    _ => prop.Value.GetRawText()
                };
            }
        }

        // Build update SQL
        bodyDict.Remove("id");
        bodyDict.Remove("user_id");
        var updates = string.Join(",", bodyDict.Keys.Select(k => $"{k}=${k}"));
        var sql = $"UPDATE notifications SET {updates} WHERE id = $id AND user_id = $user_id";
        
        bodyDict["id"] = id;
        bodyDict["user_id"] = userId;
        
        var result = await _databaseService.QueryOneAsync(sql, bodyDict);
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var user = sessionData["user"] as Dictionary<string, object?>;
        var userId = Convert.ToInt32(user?["id"]);

        var result = await _databaseService.QueryOneAsync(
            "UPDATE notifications SET read = 1 WHERE user_id = $user_id AND read = 0",
            new Dictionary<string, object?> { ["user_id"] = userId }
        );
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var user = sessionData["user"] as Dictionary<string, object?>;
        var userId = Convert.ToInt32(user?["id"]);

        // Verify the notification belongs to the user
        var notification = await _databaseService.QueryOneAsync(
            "SELECT * FROM notifications WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = id }
        );

        if (notification.Count == 0 || notification.ContainsKey("error"))
        {
            return NotFound(new { error = "Notification not found." });
        }

        var notificationUserId = Convert.ToInt32(notification["user_id"]);
        if (notificationUserId != userId)
        {
            return Unauthorized(new { error = "Unauthorized." });
        }

        var result = await _databaseService.QueryOneAsync(
            "DELETE FROM notifications WHERE id = $id AND user_id = $user_id",
            new Dictionary<string, object?> { ["id"] = id, ["user_id"] = userId }
        );
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] JsonElement body)
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        // Parse body
        var bodyDict = new Dictionary<string, object?>();
        if (body.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in body.EnumerateObject())
            {
                bodyDict[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString(),
                    JsonValueKind.Number => prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    _ => prop.Value.GetRawText()
                };
            }
        }

        var userId = Convert.ToInt32(bodyDict["user_id"]);
        var title = bodyDict["title"]?.ToString() ?? "";
        var message = bodyDict["message"]?.ToString() ?? "";
        var type = bodyDict.ContainsKey("type") ? bodyDict["type"]?.ToString() ?? "general" : "general";
        var link = bodyDict.ContainsKey("link") ? bodyDict["link"]?.ToString() : null;

        // Create notification in database
        var notificationParams = new Dictionary<string, object?>
        {
            ["user_id"] = userId,
            ["type"] = type,
            ["title"] = title,
            ["message"] = message,
            ["link"] = link,
            ["read"] = 0
        };

        var result = await _databaseService.QueryOneAsync(
            @"INSERT INTO notifications(user_id, type, title, message, link, read, created_at)
              VALUES($user_id, $type, $title, $message, $link, $read, datetime('now'))",
            notificationParams
        );

        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }

        // Get the insert id
        var insertIdResult = await _databaseService.QueryOneAsync(
            "SELECT id FROM notifications ORDER BY id DESC LIMIT 1"
        );

        // TODO: Send push notification using WebPush library
        // For now, just return success
        // In production, you would:
        // 1. Get push subscriptions for the user
        // 2. Send push notifications using WebPush.NET or similar

        return Ok(new { 
            success = true, 
            notificationId = insertIdResult.GetValueOrDefault("id"),
            message = "Notification created. Push notifications will be implemented with WebPush library."
        });
    }
}

