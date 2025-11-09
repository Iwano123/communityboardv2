using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/push_subscriptions")]
public class PushSubscriptionController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly ILogger<PushSubscriptionController> _logger;

    public PushSubscriptionController(
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<PushSubscriptionController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] JsonElement body)
    {
        var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
        var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
        
        if (sessionData == null || !sessionData.ContainsKey("user"))
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var user = sessionData["user"] as Dictionary<string, object?>;
        var userId = Convert.ToInt32(user?["id"]);

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

        // Override user_id with the authenticated user's ID
        bodyDict["user_id"] = userId;

        // Check if subscription with this endpoint already exists
        var existing = await _databaseService.QueryOneAsync(
            "SELECT * FROM push_subscriptions WHERE endpoint = $endpoint",
            new Dictionary<string, object?> { ["endpoint"] = bodyDict["endpoint"] }
        );

        if (existing.Count > 0 && !existing.ContainsKey("error"))
        {
            // Update existing subscription
            var updates = new Dictionary<string, object?>
            {
                ["user_id"] = userId,
                ["p256dh"] = bodyDict["p256dh"],
                ["auth"] = bodyDict["auth"]
            };
            var updateSql = "UPDATE push_subscriptions SET user_id = $user_id, p256dh = $p256dh, auth = $auth WHERE endpoint = $endpoint";
            updates["endpoint"] = bodyDict["endpoint"];
            
            var result = await _databaseService.QueryOneAsync(updateSql, updates);
            
            if (result.ContainsKey("error"))
            {
                return BadRequest(result);
            }
            
            return Ok(new { success = true, message = "Push subscription updated" });
        }
        else
        {
            // Insert new subscription
            var columns = string.Join(",", bodyDict.Keys);
            var values = string.Join(",", bodyDict.Keys.Select(k => $"${k}"));
            var sql = $"INSERT INTO push_subscriptions({columns}) VALUES({values})";
            
            var result = await _databaseService.QueryOneAsync(sql, bodyDict);
            
            if (result.ContainsKey("error"))
            {
                return BadRequest(result);
            }
            
            // Get the insert id
            var insertIdResult = await _databaseService.QueryOneAsync(
                "SELECT id FROM push_subscriptions ORDER BY id DESC LIMIT 1"
            );
            
            return Ok(new { success = true, id = insertIdResult.GetValueOrDefault("id") });
        }
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

        var results = await _databaseService.QueryAsync(
            "SELECT * FROM push_subscriptions WHERE user_id = $user_id",
            new Dictionary<string, object?> { ["user_id"] = userId }
        );
        
        if (results.Count > 0 && results[0].ContainsKey("error"))
        {
            return BadRequest(results[0]);
        }
        
        return Ok(results);
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

        // Verify the subscription belongs to the user
        var subscription = await _databaseService.QueryOneAsync(
            "SELECT * FROM push_subscriptions WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = id }
        );

        if (subscription.Count == 0 || subscription.ContainsKey("error"))
        {
            return NotFound(new { error = "Subscription not found." });
        }

        var subscriptionUserId = Convert.ToInt32(subscription["user_id"]);
        if (subscriptionUserId != userId)
        {
            return Unauthorized(new { error = "Unauthorized." });
        }

        var result = await _databaseService.QueryOneAsync(
            "DELETE FROM push_subscriptions WHERE id = $id AND user_id = $user_id",
            new Dictionary<string, object?> { ["id"] = id, ["user_id"] = userId }
        );
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }
}

