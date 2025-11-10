using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/likes")]
public class LikesController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly SessionService _sessionService;
    private readonly ILogger<LikesController> _logger;

    public LikesController(
        DatabaseService databaseService,
        SessionService sessionService,
        ILogger<LikesController> logger)
    {
        _databaseService = databaseService;
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Get likes for a specific post
    /// </summary>
    [HttpGet("post/{postId}")]
    public async Task<IActionResult> GetPostLikes(int postId)
    {
        try
        {
            var likes = await _databaseService.QueryAsync(
                "SELECT COUNT(*) as count FROM likes WHERE post_id = $postId",
                new Dictionary<string, object?> { ["postId"] = postId }
            );

            var count = likes.Count > 0 && likes[0].ContainsKey("count") 
                ? Convert.ToInt32(likes[0]["count"]) 
                : 0;

            return Ok(new { post_id = postId, count = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching likes for post {PostId}", postId);
            return StatusCode(500, new { error = "An error occurred while fetching likes." });
        }
    }

    /// <summary>
    /// Check if current user has liked a post
    /// </summary>
    [HttpGet("post/{postId}/check")]
    public async Task<IActionResult> CheckUserLike(int postId)
    {
        try
        {
            var sessionId = await _sessionService.GetOrCreateSessionIdAsync(HttpContext);
            var sessionData = await _sessionService.GetSessionDataAsync(sessionId);
            
            if (sessionData == null || !sessionData.ContainsKey("user"))
            {
                return Ok(new { liked = false });
            }

            var user = sessionData["user"] as Dictionary<string, object?>;
            if (user == null || !user.ContainsKey("id"))
            {
                return Ok(new { liked = false });
            }

            var userId = Convert.ToInt32(user["id"]);
            
            var likes = await _databaseService.QueryAsync(
                "SELECT id FROM likes WHERE user_id = $userId AND post_id = $postId",
                new Dictionary<string, object?> 
                { 
                    ["userId"] = userId,
                    ["postId"] = postId 
                }
            );

            return Ok(new { liked = likes.Count > 0 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking like for post {PostId}", postId);
            return StatusCode(500, new { error = "An error occurred while checking like." });
        }
    }

    /// <summary>
    /// Toggle like on a post (like/unlike)
    /// </summary>
    [HttpPost("post/{postId}")]
    public async Task<IActionResult> ToggleLike(int postId)
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

            var userId = Convert.ToInt32(user["id"]);

            // Check if post exists
            var posts = await _databaseService.QueryAsync(
                "SELECT id FROM posts WHERE id = $postId",
                new Dictionary<string, object?> { ["postId"] = postId }
            );

            if (posts.Count == 0)
            {
                return NotFound(new { error = "Post not found." });
            }

            // Check if already liked
            var existingLikes = await _databaseService.QueryAsync(
                "SELECT id FROM likes WHERE user_id = $userId AND post_id = $postId",
                new Dictionary<string, object?> 
                { 
                    ["userId"] = userId,
                    ["postId"] = postId 
                }
            );

            if (existingLikes.Count > 0)
            {
                // Unlike
                await _databaseService.QueryAsync(
                    "DELETE FROM likes WHERE user_id = $userId AND post_id = $postId",
                    new Dictionary<string, object?> 
                    { 
                        ["userId"] = userId,
                        ["postId"] = postId 
                    }
                );

                // Get updated count
                var countResult = await _databaseService.QueryAsync(
                    "SELECT COUNT(*) as count FROM likes WHERE post_id = $postId",
                    new Dictionary<string, object?> { ["postId"] = postId }
                );

                var count = countResult.Count > 0 && countResult[0].ContainsKey("count") 
                    ? Convert.ToInt32(countResult[0]["count"]) 
                    : 0;

                return Ok(new { liked = false, count = count });
            }
            else
            {
                // Like
                await _databaseService.QueryAsync(
                    "INSERT INTO likes (user_id, post_id, created_at) VALUES ($userId, $postId, datetime('now'))",
                    new Dictionary<string, object?> 
                    { 
                        ["userId"] = userId,
                        ["postId"] = postId 
                    }
                );

                // Get updated count
                var countResult = await _databaseService.QueryAsync(
                    "SELECT COUNT(*) as count FROM likes WHERE post_id = $postId",
                    new Dictionary<string, object?> { ["postId"] = postId }
                );

                var count = countResult.Count > 0 && countResult[0].ContainsKey("count") 
                    ? Convert.ToInt32(countResult[0]["count"]) 
                    : 0;

                // Create notification for post author
                var postAuthor = await _databaseService.QueryAsync(
                    "SELECT author_id FROM posts WHERE id = $postId",
                    new Dictionary<string, object?> { ["postId"] = postId }
                );

                if (postAuthor.Count > 0)
                {
                    var authorId = Convert.ToInt32(postAuthor[0]["author_id"]);
                    if (authorId != userId) // Don't notify if user likes their own post
                    {
                        await _databaseService.QueryAsync(@"
                            INSERT INTO notifications (user_id, type, title, message, link)
                            VALUES ($authorId, 'like', 'New Like', $message, $link)
                        ", new Dictionary<string, object?>
                        {
                            ["authorId"] = authorId,
                            ["message"] = $"{user["firstName"]} {user["lastName"]} liked your post",
                            ["link"] = $"/post/{postId}"
                        });
                    }
                }

                return Ok(new { liked = true, count = count });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling like for post {PostId}", postId);
            return StatusCode(500, new { error = "An error occurred while toggling like." });
        }
    }
}

