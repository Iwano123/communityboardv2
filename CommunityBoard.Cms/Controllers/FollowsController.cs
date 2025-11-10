using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/follows")]
public class FollowsController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<FollowsController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Get followers count for a user
    /// </summary>
    [HttpGet("followers/{userId}")]
    public async Task<IActionResult> GetFollowers(int userId)
    {
        try
        {
            var followers = await _databaseService.QueryAsync(
                "SELECT COUNT(*) as count FROM follows WHERE following_id = $userId",
                new Dictionary<string, object?> { ["userId"] = userId }
            );

            var count = followers.Count > 0 && followers[0].ContainsKey("count") 
                ? Convert.ToInt32(followers[0]["count"]) 
                : 0;

            return Ok(new { user_id = userId, count = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching followers for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while fetching followers." });
        }
    }

    /// <summary>
    /// Get following count for a user
    /// </summary>
    [HttpGet("following/{userId}")]
    public async Task<IActionResult> GetFollowing(int userId)
    {
        try
        {
            var following = await _databaseService.QueryAsync(
                "SELECT COUNT(*) as count FROM follows WHERE follower_id = $userId",
                new Dictionary<string, object?> { ["userId"] = userId }
            );

            var count = following.Count > 0 && following[0].ContainsKey("count") 
                ? Convert.ToInt32(following[0]["count"]) 
                : 0;

            return Ok(new { user_id = userId, count = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching following for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while fetching following." });
        }
    }

    /// <summary>
    /// Check if current user is following another user
    /// </summary>
    [HttpGet("check/{userId}")]
    public async Task<IActionResult> CheckFollow(int userId)
    {
        try
        {
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Ok(new { following = false });
            }

            var user = sessionData["user"] as Dictionary<string, object?>;
            if (user == null || !user.ContainsKey("id"))
            {
                return Ok(new { following = false });
            }

            var followerId = Convert.ToInt32(user["id"]);
            
            var follows = await _databaseService.QueryAsync(
                "SELECT id FROM follows WHERE follower_id = $followerId AND following_id = $userId",
                new Dictionary<string, object?> 
                { 
                    ["followerId"] = followerId,
                    ["userId"] = userId 
                }
            );

            return Ok(new { following = follows.Count > 0 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking follow for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while checking follow." });
        }
    }

    /// <summary>
    /// Toggle follow on a user (follow/unfollow)
    /// </summary>
    [HttpPost("{userId}")]
    public async Task<IActionResult> ToggleFollow(int userId)
    {
        try
        {
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Unauthorized(new { error = "User must be logged in." });
            }

            var user = sessionData["user"] as Dictionary<string, object?>;
            if (user == null || !user.ContainsKey("id"))
            {
                return Unauthorized(new { error = "Invalid user session." });
            }

            var followerId = Convert.ToInt32(user["id"]);

            if (followerId == userId)
            {
                return BadRequest(new { error = "Cannot follow yourself." });
            }

            // Check if user exists
            var users = await _databaseService.QueryAsync(
                "SELECT id, firstName, lastName FROM users WHERE id = $userId",
                new Dictionary<string, object?> { ["userId"] = userId }
            );

            if (users.Count == 0)
            {
                return NotFound(new { error = "User not found." });
            }

            // Check if already following
            var existingFollows = await _databaseService.QueryAsync(
                "SELECT id FROM follows WHERE follower_id = $followerId AND following_id = $userId",
                new Dictionary<string, object?> 
                { 
                    ["followerId"] = followerId,
                    ["userId"] = userId 
                }
            );

            if (existingFollows.Count > 0)
            {
                // Unfollow
                await _databaseService.QueryAsync(
                    "DELETE FROM follows WHERE follower_id = $followerId AND following_id = $userId",
                    new Dictionary<string, object?> 
                    { 
                        ["followerId"] = followerId,
                        ["userId"] = userId 
                    }
                );

                // Get updated counts
                var followersCount = await _databaseService.QueryAsync(
                    "SELECT COUNT(*) as count FROM follows WHERE following_id = $userId",
                    new Dictionary<string, object?> { ["userId"] = userId }
                );

                var count = followersCount.Count > 0 && followersCount[0].ContainsKey("count") 
                    ? Convert.ToInt32(followersCount[0]["count"]) 
                    : 0;

                return Ok(new { following = false, followers_count = count });
            }
            else
            {
                // Follow
                await _databaseService.QueryAsync(
                    "INSERT INTO follows (follower_id, following_id, created_at) VALUES ($followerId, $userId, datetime('now'))",
                    new Dictionary<string, object?> 
                    { 
                        ["followerId"] = followerId,
                        ["userId"] = userId 
                    }
                );

                // Get updated counts
                var followersCount = await _databaseService.QueryAsync(
                    "SELECT COUNT(*) as count FROM follows WHERE following_id = $userId",
                    new Dictionary<string, object?> { ["userId"] = userId }
                );

                var count = followersCount.Count > 0 && followersCount[0].ContainsKey("count") 
                    ? Convert.ToInt32(followersCount[0]["count"]) 
                    : 0;

                // Create notification for followed user
                var followedUser = users[0];
                await _databaseService.QueryAsync(@"
                    INSERT INTO notifications (user_id, type, title, message, link)
                    VALUES ($userId, 'follow', 'New Follower', $message, $link)
                ", new Dictionary<string, object?>
                {
                    ["userId"] = userId,
                    ["message"] = $"{user["firstName"]} {user["lastName"]} started following you",
                    ["link"] = $"/profile/{followerId}"
                });

                return Ok(new { following = true, followers_count = count });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling follow for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while toggling follow." });
        }
    }
}

