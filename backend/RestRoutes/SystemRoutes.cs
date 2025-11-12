namespace RestRoutes;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using OrchardCore.ContentManagement;
using OrchardCore.ContentManagement.Metadata;
using OrchardCore.ContentManagement.Records;
using OrchardCore.Documents;
using OrchardCore.Roles.Models;
using OrchardCore.Users;
using OrchardCore.Users.Models;
using YesSql;
using YesSql.Services;
using System.Text.Json;

public static class SystemRoutes
{
    private static bool IsAdministrator(HttpContext context)
    {
        return context.User.Identity?.IsAuthenticated == true &&
               context.User.IsInRole("Administrator");
    }

    public static void MapSystemRoutes(this WebApplication app)
    {
        // Get all content types (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/content-types", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IContentDefinitionManager contentDefinitionManager) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return permissionCheck;
            }

            var contentTypes = (await contentDefinitionManager.ListTypeDefinitionsAsync())
                .Select(type => type.Name)
                .OrderBy(n => n)
                .ToList();

            return Results.Json(contentTypes);
        });

        // Get all roles from RolesDocument (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/roles", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IDocumentManager<RolesDocument> documentManager) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return permissionCheck;
            }

            var rolesDocument = await documentManager.GetOrCreateMutableAsync();

            var roleNames = rolesDocument.Roles
                .Select(r => r.RoleName)
                .Where(n => !string.IsNullOrEmpty(n))
                .OrderBy(n => n)
                .ToList();

            return Results.Json(roleNames);
        });

        // Serve admin script (Administrator always allowed, others need RestPermissions)
        app.MapGet("api/system/admin-script.js", async (
            HttpContext context,
            [FromServices] ISession session) =>
        {
            if (!IsAdministrator(context))
            {
                var permissionCheck = await PermissionsACL.CheckPermissions("system", "GET", context, session);
                if (permissionCheck != null) return Results.Content("console.error('Access denied');", "application/javascript");
            }

            var scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "RestRoutes", "admin-script.js");
            var script = await File.ReadAllTextAsync(scriptPath);
            return Results.Content(script, "application/javascript");
        });

        // Get all users (available to all authenticated users for messaging purposes)
        // NOTE: This endpoint does NOT require RestPermissions - it's available to all authenticated users
        // because users need to see other users to send messages
        // IMPORTANT: This route must be registered BEFORE MapGetRoutes() to avoid matching /api/{contentType}
        app.MapGet("api/users", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] UserManager<IUser> userManager) =>
        {
            // Must be authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            // Get all users from UserIndex
            var users = await session
                .Query<OrchardCore.Users.Models.User, OrchardCore.Users.Indexes.UserIndex>()
                .ListAsync();

            var usersList = new List<Dictionary<string, object>>();
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            foreach (var user in users)
            {
                var u = user as User;
                var userDict = new Dictionary<string, object>
                {
                    ["id"] = u?.UserId ?? "",
                    ["username"] = user.UserName ?? "",
                    ["email"] = u?.Email ?? "",
                    ["firstName"] = u?.Properties?["FirstName"]?.ToString() ?? "",
                    ["lastName"] = u?.Properties?["LastName"]?.ToString() ?? "",
                    ["phoneNumber"] = u?.PhoneNumber ?? ""
                };

                // Get user roles
                var roles = await userManager.GetRolesAsync(user);
                userDict["roles"] = roles;

                usersList.Add(userDict);
            }

            return Results.Json(usersList);
        });

        // Get notifications for current user
        // NOTE: This endpoint does NOT require RestPermissions - it's available to all authenticated users
        // because it only returns notifications for the current user's own messages
        // IMPORTANT: This route must be registered BEFORE MapGetRoutes() to avoid matching /api/{contentType}
        app.MapGet("api/notifications", async (
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IContentManager contentManager,
            [FromServices] UserManager<IUser> userManager) =>
        {
            // Must be authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Results.Json(new List<object>());
            }

            var currentUser = await userManager.GetUserAsync(context.User);
            if (currentUser == null)
            {
                return Results.Json(new List<object>());
            }

            var userEmail = (currentUser as User)?.Email ?? currentUser.UserName ?? "";

            // Hämta alla Chat-meddelanden och Comment-meddelanden direkt från databasen
            var chatItems = await session
                .Query()
                .For<ContentItem>()
                .With<ContentItemIndex>(x => x.ContentType == "Chat" && x.Published)
                .ListAsync();

            var commentItems = await session
                .Query()
                .For<ContentItem>()
                .With<ContentItemIndex>(x => x.ContentType == "Comment" && x.Published)
                .ListAsync();

            // Konvertera till clean format manuellt
            var jsonOptions = new System.Text.Json.JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
            };
            
            var chatJsonString = System.Text.Json.JsonSerializer.Serialize(chatItems, jsonOptions);
            var chatPlainObjects = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, System.Text.Json.JsonElement>>>(chatJsonString);
            if (chatPlainObjects == null) chatPlainObjects = new List<Dictionary<string, System.Text.Json.JsonElement>>();

            var commentJsonString = System.Text.Json.JsonSerializer.Serialize(commentItems, jsonOptions);
            var commentPlainObjects = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, System.Text.Json.JsonElement>>>(commentJsonString);
            if (commentPlainObjects == null) commentPlainObjects = new List<Dictionary<string, System.Text.Json.JsonElement>>();

            // Clean up messages and comments manually
            var cleanMessages = chatPlainObjects.Select(obj => GetRoutes.CleanObject(obj, "Chat", null)).ToList();
            var cleanComments = commentPlainObjects.Select(obj => GetRoutes.CleanObject(obj, "Comment", null)).ToList();

            // Gruppera meddelanden per avsändare - bara ta det senaste från varje avsändare
            var messagesBySender = new Dictionary<string, Dictionary<string, object>>();

            foreach (var msg in cleanMessages)
            {
                // Extrahera fält från rensad data
                var receiverId = msg.ContainsKey("receiverId") ? msg["receiverId"]?.ToString() ?? "" : "";
                var isRead = msg.ContainsKey("isRead") && msg["isRead"] is bool readValue ? readValue : true;
                var message = msg.ContainsKey("message") ? msg["message"]?.ToString() ?? "" : "";
                var senderId = msg.ContainsKey("senderId") ? msg["senderId"]?.ToString() ?? "" : "";
                var chatRoomId = msg.ContainsKey("chatRoomId") ? msg["chatRoomId"]?.ToString() ?? "" : "";
                // Extrahera createdDate säkert - kan vara sträng eller Dictionary
                var createdDate = "";
                if (msg.ContainsKey("createdDate"))
                {
                    var createdDateValue = msg["createdDate"];
                    if (createdDateValue is string strDate)
                    {
                        createdDate = strDate;
                    }
                    else if (createdDateValue != null)
                    {
                        createdDate = createdDateValue.ToString() ?? "";
                    }
                }
                // Om createdDate fortfarande är tomt, försök hitta från createdUtc
                if (string.IsNullOrEmpty(createdDate) && msg.ContainsKey("createdUtc"))
                {
                    var createdUtcValue = msg["createdUtc"];
                    if (createdUtcValue is string strUtc)
                    {
                        createdDate = strUtc;
                    }
                    else if (createdUtcValue != null)
                    {
                        createdDate = createdUtcValue.ToString() ?? "";
                    }
                }

                // Skapa notifikation endast om meddelandet är för denna användare och är oläst
                if ((receiverId == userEmail || receiverId == currentUser.UserName) && !isRead && !string.IsNullOrEmpty(message))
                {
                    // Använd senderId som nyckel för gruppering
                    var senderKey = senderId.ToLowerInvariant();
                    
                    // Om vi redan har ett meddelande från denna avsändare, jämför datum
                    if (messagesBySender.ContainsKey(senderKey))
                    {
                        // Extrahera existingDateStr säkert
                        string existingDateStr = "";
                        if (messagesBySender[senderKey].ContainsKey("created_at"))
                        {
                            var existingDateValue = messagesBySender[senderKey]["created_at"];
                            if (existingDateValue is string str)
                            {
                                existingDateStr = str;
                            }
                            else if (existingDateValue != null)
                            {
                                existingDateStr = existingDateValue.ToString() ?? "";
                            }
                        }
                        var newDateStr = createdDate;
                        
                        // Om det nya meddelandet är nyare, ersätt det gamla
                        if (!string.IsNullOrEmpty(newDateStr) && !string.IsNullOrEmpty(existingDateStr))
                        {
                            try
                            {
                                var existingDate = DateTime.Parse(existingDateStr);
                                var newDate = DateTime.Parse(newDateStr);
                                if (newDate > existingDate)
                                {
                                    // Det nya meddelandet är nyare, ersätt det gamla
                                    messagesBySender.Remove(senderKey);
                                }
                                else
                                {
                                    // Det gamla meddelandet är nyare, hoppa över detta
                                    continue;
                                }
                            }
                            catch
                            {
                                // Om datum-parsing misslyckas, behåll det befintliga
                                continue;
                            }
                        }
                        else if (string.IsNullOrEmpty(existingDateStr) && !string.IsNullOrEmpty(newDateStr))
                        {
                            // Det nya meddelandet har datum, det gamla inte - ersätt
                            messagesBySender.Remove(senderKey);
                        }
                        else
                        {
                            // Båda saknar datum eller det gamla är bättre - hoppa över
                            continue;
                        }
                    }

                    // Hämta avsändarens namn
                    var senderName = senderId;
                    if (!string.IsNullOrEmpty(senderId))
                    {
                        // Använd UserManager för att hitta användaren baserat på email eller username
                        IUser? senderUser = null;
                        if (senderId.Contains("@"))
                        {
                            senderUser = await userManager.FindByEmailAsync(senderId);
                        }
                        else
                        {
                            senderUser = await userManager.FindByNameAsync(senderId);
                        }
                        
                        if (senderUser != null)
                        {
                            var sender = senderUser as User;
                            var firstName = sender?.Properties?["FirstName"]?.ToString() ?? "";
                            var lastName = sender?.Properties?["LastName"]?.ToString() ?? "";
                            senderName = !string.IsNullOrEmpty(firstName) || !string.IsNullOrEmpty(lastName)
                                ? $"{firstName} {lastName}".Trim()
                                : senderUser.UserName ?? senderId;
                        }
                    }

                    // Säkerställ att created_at är en sträng, inte ett Dictionary
                    string createdDateStr = "";
                    if (!string.IsNullOrEmpty(createdDate) && !createdDate.Contains("Dictionary"))
                    {
                        // Försök parsa datumet för att säkerställa att det är giltigt
                        try
                        {
                            DateTime.Parse(createdDate);
                            createdDateStr = createdDate;
                        }
                        catch
                        {
                            // Om det inte går att parsa, använd fallback
                            createdDateStr = DateTime.UtcNow.ToString("O");
                        }
                    }
                    else
                    {
                        // Fallback till nuvarande tid om inget datum finns eller om det är ett Dictionary
                        createdDateStr = DateTime.UtcNow.ToString("O");
                    }

                    var notification = new Dictionary<string, object>
                    {
                        ["id"] = senderKey.GetHashCode(), // Använd samma ID för samma avsändare
                        ["user_id"] = 0, // Not used
                        ["type"] = "message",
                        ["title"] = $"New message from {senderName}",
                        ["message"] = message.Length > 100 ? message.Substring(0, 100) + "..." : message,
                        ["link"] = $"/messages?chatRoomId={Uri.EscapeDataString(chatRoomId)}",
                        ["read"] = false,
                        ["created_at"] = createdDateStr, // Säkerställ att det är en sträng
                        ["senderId"] = senderId // Spara senderId för gruppering
                    };

                    messagesBySender[senderKey] = notification;
                }
            }

            // Hantera kommentar-notifikationer
            // Gruppera kommentarer per avsändare och post
            var commentsBySenderAndPost = new Dictionary<string, Dictionary<string, object>>();

            foreach (var comment in cleanComments)
            {
                // Extrahera fält från kommentaren
                var postId = comment.ContainsKey("postId") ? comment["postId"]?.ToString() ?? "" : "";
                var authorId = comment.ContainsKey("authorId") ? comment["authorId"]?.ToString() ?? "" : "";
                var commentContent = comment.ContainsKey("content") ? comment["content"]?.ToString() ?? "" : "";
                // Kontrollera om kommentaren är markerad som läst
                var isRead = false;
                if (comment.ContainsKey("isRead") && comment["isRead"] is bool readValue)
                {
                    isRead = readValue;
                }
                // Extrahera createdDate säkert - kan vara sträng eller Dictionary
                var createdDate = "";
                if (comment.ContainsKey("createdDate"))
                {
                    var createdDateValue = comment["createdDate"];
                    if (createdDateValue is string strDate && !strDate.Contains("Dictionary"))
                    {
                        createdDate = strDate;
                    }
                    else if (createdDateValue != null)
                    {
                        var dateStr = createdDateValue.ToString() ?? "";
                        // Om det är typnamnet för Dictionary, hoppa över det
                        if (!dateStr.Contains("Dictionary"))
                        {
                            createdDate = dateStr;
                        }
                    }
                }
                // Om createdDate fortfarande är tomt, försök hitta från createdUtc
                if (string.IsNullOrEmpty(createdDate) && comment.ContainsKey("createdUtc"))
                {
                    var createdUtcValue = comment["createdUtc"];
                    if (createdUtcValue is string strUtc && !strUtc.Contains("Dictionary"))
                    {
                        createdDate = strUtc;
                    }
                    else if (createdUtcValue != null)
                    {
                        var utcStr = createdUtcValue.ToString() ?? "";
                        if (!utcStr.Contains("Dictionary"))
                        {
                            createdDate = utcStr;
                        }
                    }
                }
                // Om createdDate fortfarande är tomt eller innehåller Dictionary, använd Common Part
                if (string.IsNullOrEmpty(createdDate) || createdDate.Contains("Dictionary"))
                {
                    // Försök hitta från Common Part direkt från comment-objektet
                    if (comment.ContainsKey("createdUtc"))
                    {
                        // Om createdUtc finns men är Dictionary, hoppa över
                    }
                    // Om inget datum hittas, kommer vi att använda DateTime.UtcNow som fallback senare
                }

                // Hitta postens ägare
                if (!string.IsNullOrEmpty(postId))
                {
                    var postItem = await contentManager.GetAsync(postId);
                    if (postItem != null)
                    {
                        var postOwner = postItem.Owner ?? postItem.Author;
                        
                        // Normalisera jämförelser: kontrollera både email och username för både postOwner och authorId
                        var postOwnerEmail = "";
                        var postOwnerUsername = postOwner ?? "";
                        if (!string.IsNullOrEmpty(postOwner))
                        {
                            var postOwnerUser = await userManager.FindByNameAsync(postOwner);
                            if (postOwnerUser == null && postOwner.Contains("@"))
                            {
                                postOwnerUser = await userManager.FindByEmailAsync(postOwner);
                            }
                            if (postOwnerUser != null)
                            {
                                var postOwnerUserObj = postOwnerUser as User;
                                postOwnerEmail = postOwnerUserObj?.Email ?? "";
                                postOwnerUsername = postOwnerUser.UserName ?? postOwner;
                            }
                        }
                        
                        var authorEmail = "";
                        var authorUsername = authorId ?? "";
                        if (!string.IsNullOrEmpty(authorId))
                        {
                            IUser? authorUser = null;
                            if (authorId.Contains("@"))
                            {
                                authorUser = await userManager.FindByEmailAsync(authorId);
                            }
                            else
                            {
                                authorUser = await userManager.FindByNameAsync(authorId);
                            }
                            if (authorUser != null)
                            {
                                var authorUserObj = authorUser as User;
                                authorEmail = authorUserObj?.Email ?? "";
                                authorUsername = authorUser.UserName ?? authorId;
                            }
                        }
                        
                        // Kontrollera om posten tillhör den inloggade användaren (jämför både email och username)
                        var isPostOwner = (postOwnerEmail == userEmail || postOwnerUsername == userEmail || 
                                         postOwnerEmail == currentUser.UserName || postOwnerUsername == currentUser.UserName);
                        
                        // Kontrollera att kommentaren inte är från post-ägaren själv
                        var isNotSelfComment = !string.IsNullOrEmpty(authorId) && 
                                             authorEmail != userEmail && authorEmail != postOwnerEmail &&
                                             authorUsername != currentUser.UserName && authorUsername != postOwnerUsername &&
                                             authorId != postOwner;
                        
                        // Skapa notifikation endast om kommentaren är för denna användare, postens ägare är den inloggade användaren, och kommentaren inte är markerad som läst
                        if (isPostOwner && isNotSelfComment && !string.IsNullOrEmpty(commentContent) && !isRead)
                        {
                            // Använd kombinationen av authorId och postId som nyckel för gruppering
                            var commentKey = $"{authorId.ToLowerInvariant()}_{postId}";
                            
                            // Om vi redan har en kommentar från samma avsändare på samma post, jämför datum
                            if (commentsBySenderAndPost.ContainsKey(commentKey))
                            {
                                // Extrahera existingDateStr säkert
                                string existingDateStr = "";
                                if (commentsBySenderAndPost[commentKey].ContainsKey("created_at"))
                                {
                                    var existingDateValue = commentsBySenderAndPost[commentKey]["created_at"];
                                    if (existingDateValue is string str)
                                    {
                                        existingDateStr = str;
                                    }
                                    else if (existingDateValue != null)
                                    {
                                        existingDateStr = existingDateValue.ToString() ?? "";
                                    }
                                }
                                var newDateStr = createdDate;
                                
                                if (!string.IsNullOrEmpty(newDateStr) && !string.IsNullOrEmpty(existingDateStr))
                                {
                                    try
                                    {
                                        var existingDate = DateTime.Parse(existingDateStr);
                                        var newDate = DateTime.Parse(newDateStr);
                                        if (newDate <= existingDate)
                                        {
                                            continue; // Det gamla är nyare eller samma, hoppa över
                                        }
                                        commentsBySenderAndPost.Remove(commentKey);
                                    }
                                    catch
                                    {
                                        continue;
                                    }
                                }
                                else if (string.IsNullOrEmpty(newDateStr))
                                {
                                    continue; // Ingen datum, hoppa över
                                }
                            }

                            // Hämta kommentar-avsändarens namn
                            var commentAuthorName = authorId;
                            if (!string.IsNullOrEmpty(authorId))
                            {
                                IUser? commentUser = null;
                                if (authorId.Contains("@"))
                                {
                                    commentUser = await userManager.FindByEmailAsync(authorId);
                                }
                                else
                                {
                                    commentUser = await userManager.FindByNameAsync(authorId);
                                }
                                
                                if (commentUser != null)
                                {
                                    var commentUserObj = commentUser as User;
                                    var firstName = commentUserObj?.Properties?["FirstName"]?.ToString() ?? "";
                                    var lastName = commentUserObj?.Properties?["LastName"]?.ToString() ?? "";
                                    commentAuthorName = !string.IsNullOrEmpty(firstName) || !string.IsNullOrEmpty(lastName)
                                        ? $"{firstName} {lastName}".Trim()
                                        : commentUser.UserName ?? authorId;
                                }
                            }

                            // Hämta postens titel för länken
                            var postTitle = postItem.DisplayText ?? "Post";
                            var postLink = $"/post/{postId}"; // Antag att posts har en route som /post/{id}

                            // Säkerställ att created_at är en sträng, inte ett Dictionary
                            string createdDateStr = "";
                            if (!string.IsNullOrEmpty(createdDate) && !createdDate.Contains("Dictionary"))
                            {
                                // Försök parsa datumet för att säkerställa att det är giltigt
                                try
                                {
                                    DateTime.Parse(createdDate);
                                    createdDateStr = createdDate;
                                }
                                catch
                                {
                                    // Om det inte går att parsa, använd fallback
                                    createdDateStr = DateTime.UtcNow.ToString("O");
                                }
                            }
                            else
                            {
                                // Fallback till nuvarande tid om inget datum finns eller om det är ett Dictionary
                                createdDateStr = DateTime.UtcNow.ToString("O");
                            }

                            var commentNotification = new Dictionary<string, object>
                            {
                                ["id"] = commentKey.GetHashCode(),
                                ["user_id"] = 0,
                                ["type"] = "comment",
                                ["title"] = $"New comment from {commentAuthorName}",
                                ["message"] = commentContent.Length > 100 ? commentContent.Substring(0, 100) + "..." : commentContent,
                                ["link"] = postLink,
                                ["read"] = false,
                                ["created_at"] = createdDateStr, // Säkerställ att det är en sträng
                                ["senderId"] = authorId,
                                ["postId"] = postId // Spara postId för att kunna markera som läst senare
                            };

                            commentsBySenderAndPost[commentKey] = commentNotification;
                        }
                    }
                }
            }

            // Kombinera meddelande- och kommentar-notifikationer
            var allNotifications = new List<Dictionary<string, object>>();
            allNotifications.AddRange(messagesBySender.Values);
            allNotifications.AddRange(commentsBySenderAndPost.Values);

            // Sortera alla notifikationer efter created_at (nyaste först)
            var sortedNotifications = allNotifications.OrderByDescending(n => 
            {
                if (!n.ContainsKey("created_at"))
                {
                    return DateTime.MinValue;
                }
                
                var createdAtValue = n["created_at"];
                string? createdAt = null;
                
                // Hantera olika typer av created_at värden
                if (createdAtValue is string str)
                {
                    createdAt = str;
                }
                else if (createdAtValue != null)
                {
                    createdAt = createdAtValue.ToString();
                }
                
                if (string.IsNullOrEmpty(createdAt))
                {
                    return DateTime.MinValue;
                }
                
                // Försök parsa datumet säkert
                try
                {
                    return DateTime.Parse(createdAt);
                }
                catch
                {
                    return DateTime.MinValue;
                }
            }).ToList();

            return Results.Json(sortedNotifications);
        });

        // Mark notification as read (mark all messages from sender as read)
        app.MapPut("api/notifications/{id}", async (
            int id,
            HttpContext context,
            [FromServices] ISession session,
            [FromServices] IContentManager contentManager,
            [FromServices] UserManager<IUser> userManager) =>
        {
            // Must be authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            var currentUser = await userManager.GetUserAsync(context.User);
            if (currentUser == null)
            {
                return Results.Unauthorized();
            }

            var userEmail = (currentUser as User)?.Email ?? currentUser.UserName ?? "";

            // Hämta alla Chat-meddelanden för att hitta senderId från notifikationen
            var contentItems = await session
                .Query()
                .For<ContentItem>()
                .With<ContentItemIndex>(x => x.ContentType == "Chat" && x.Published)
                .ListAsync();

            var jsonOptions = new System.Text.Json.JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
            };
            var jsonString = System.Text.Json.JsonSerializer.Serialize(contentItems, jsonOptions);
            var plainObjects = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, System.Text.Json.JsonElement>>>(jsonString);
            if (plainObjects == null) plainObjects = new List<Dictionary<string, System.Text.Json.JsonElement>>();

            var cleanMessages = plainObjects.Select(obj => GetRoutes.CleanObject(obj, "Chat", null)).ToList();

            // Hitta senderId eller commentKey från notifikationen
            // Notifikationens ID kan vara hash av senderId (för meddelanden) eller commentKey (för kommentarer)
            string? targetSenderId = null;
            string? targetCommentKey = null;
            
            // Först, kolla meddelanden
            foreach (var msg in cleanMessages)
            {
                var receiverId = msg.ContainsKey("receiverId") ? msg["receiverId"]?.ToString() ?? "" : "";
                var senderId = msg.ContainsKey("senderId") ? msg["senderId"]?.ToString() ?? "" : "";
                var isRead = msg.ContainsKey("isRead") && msg["isRead"] is bool readValue ? readValue : true;
                
                // Om detta meddelande är från en avsändare och är oläst, och notifikationens ID matchar hash av senderId
                if ((receiverId == userEmail || receiverId == currentUser.UserName) && !isRead && !string.IsNullOrEmpty(senderId))
                {
                    var senderKey = senderId.ToLowerInvariant();
                    var senderHash = senderKey.GetHashCode();
                    if (senderHash == id)
                    {
                        targetSenderId = senderId;
                        break;
                    }
                }
            }
            
            // Om vi inte hittade något meddelande, kolla kommentarer
            if (string.IsNullOrEmpty(targetSenderId))
            {
                var commentItems = await session
                    .Query()
                    .For<ContentItem>()
                    .With<ContentItemIndex>(x => x.ContentType == "Comment" && x.Published)
                    .ListAsync();

                var commentJsonString = System.Text.Json.JsonSerializer.Serialize(commentItems, jsonOptions);
                var commentPlainObjects = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, System.Text.Json.JsonElement>>>(commentJsonString);
                if (commentPlainObjects != null)
                {
                    var cleanComments = commentPlainObjects.Select(obj => GetRoutes.CleanObject(obj, "Comment", null)).ToList();
                    
                    foreach (var comment in cleanComments)
                    {
                        var postId = comment.ContainsKey("postId") ? comment["postId"]?.ToString() ?? "" : "";
                        var authorId = comment.ContainsKey("authorId") ? comment["authorId"]?.ToString() ?? "" : "";
                        
                        if (!string.IsNullOrEmpty(postId) && !string.IsNullOrEmpty(authorId))
                        {
                            var postItem = await contentManager.GetAsync(postId);
                            if (postItem != null)
                            {
                                var postOwner = postItem.Owner ?? postItem.Author;
                                if ((postOwner == userEmail || postOwner == currentUser.UserName) && authorId != postOwner)
                                {
                                    var commentKey = $"{authorId.ToLowerInvariant()}_{postId}";
                                    var commentHash = commentKey.GetHashCode();
                                    if (commentHash == id)
                                    {
                                        targetCommentKey = commentKey;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Om vi hittade senderId, markera alla meddelanden från denna avsändare som lästa
            if (!string.IsNullOrEmpty(targetSenderId))
            {
                var messagesToMark = contentItems.Where(item =>
                {
                    var jsonItem = System.Text.Json.JsonSerializer.Serialize(item, jsonOptions);
                    var itemDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(jsonItem);
                    if (itemDict == null) return false;

                    var cleaned = GetRoutes.CleanObject(itemDict, "Chat", null);
                    var msgSenderId = cleaned.ContainsKey("senderId") ? cleaned["senderId"]?.ToString() ?? "" : "";
                    var msgReceiverId = cleaned.ContainsKey("receiverId") ? cleaned["receiverId"]?.ToString() ?? "" : "";
                    var msgIsRead = cleaned.ContainsKey("isRead") && cleaned["isRead"] is bool readValue ? readValue : true;

                    return (msgReceiverId == userEmail || msgReceiverId == currentUser.UserName) &&
                           msgSenderId == targetSenderId &&
                           !msgIsRead;
                }).ToList();

                foreach (var item in messagesToMark)
                {
                    try
                    {
                        var contentItem = await contentManager.GetAsync(item.ContentItemId);
                        if (contentItem != null)
                        {
                            // Uppdatera isRead field direkt i Content-dictionaryn
                            if (contentItem.Content.ContainsKey("Chat"))
                            {
                                var chatContent = contentItem.Content["Chat"] as Dictionary<string, object>;
                                if (chatContent != null && chatContent.ContainsKey("IsRead"))
                                {
                                    var isReadField = chatContent["IsRead"] as Dictionary<string, object>;
                                    if (isReadField != null)
                                    {
                                        isReadField["Value"] = true;
                                    }
                                    else
                                    {
                                        // Om det inte finns som dictionary, skapa det
                                        chatContent["IsRead"] = new Dictionary<string, object> { ["Value"] = true };
                                    }
                                }
                                else if (chatContent != null)
                                {
                                    // Om IsRead inte finns, skapa det
                                    chatContent["IsRead"] = new Dictionary<string, object> { ["Value"] = true };
                                }
                                
                                await contentManager.UpdateAsync(contentItem);
                                await contentManager.PublishAsync(contentItem);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error marking message as read: {ex.Message}");
                    }
                }
            }
            else if (!string.IsNullOrEmpty(targetCommentKey))
            {
                // För kommentar-notifikationer, markera alla kommentarer från samma avsändare på samma post som lästa
                // Vi lägger till IsRead fältet programmatiskt om det inte finns
                var commentItemsToMark = await session
                    .Query()
                    .For<ContentItem>()
                    .With<ContentItemIndex>(x => x.ContentType == "Comment" && x.Published)
                    .ListAsync();

                var parts = targetCommentKey.Split('_');
                if (parts.Length == 2)
                {
                    var targetAuthorId = parts[0];
                    var targetPostId = parts[1];

                    foreach (var item in commentItemsToMark)
                    {
                        try
                        {
                            var jsonItem = System.Text.Json.JsonSerializer.Serialize(item, jsonOptions);
                            var itemDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(jsonItem);
                            if (itemDict == null) continue;

                            var cleaned = GetRoutes.CleanObject(itemDict, "Comment", null);
                            var commentPostId = cleaned.ContainsKey("postId") ? cleaned["postId"]?.ToString() ?? "" : "";
                            var commentAuthorId = cleaned.ContainsKey("authorId") ? cleaned["authorId"]?.ToString() ?? "" : "";
                            
                            // Normalisera authorId för jämförelse
                            var normalizedCommentAuthorId = commentAuthorId.ToLowerInvariant();
                            var normalizedTargetAuthorId = targetAuthorId.ToLowerInvariant();
                            
                            if (commentPostId == targetPostId && normalizedCommentAuthorId == normalizedTargetAuthorId)
                            {
                                var contentItem = await contentManager.GetAsync(item.ContentItemId);
                                if (contentItem != null)
                                {
                                    // Uppdatera IsRead field direkt i Content-dictionaryn
                                    if (contentItem.Content.ContainsKey("Comment"))
                                    {
                                        var commentContent = contentItem.Content["Comment"] as Dictionary<string, object>;
                                        if (commentContent != null && commentContent.ContainsKey("IsRead"))
                                        {
                                            var isReadField = commentContent["IsRead"] as Dictionary<string, object>;
                                            if (isReadField != null)
                                            {
                                                isReadField["Value"] = true;
                                            }
                                            else
                                            {
                                                // Om det inte finns som dictionary, skapa det
                                                commentContent["IsRead"] = new Dictionary<string, object> { ["Value"] = true };
                                            }
                                        }
                                        else if (commentContent != null)
                                        {
                                            // Om IsRead inte finns, skapa det programmatiskt
                                            commentContent["IsRead"] = new Dictionary<string, object> { ["Value"] = true };
                                        }
                                        
                                        await contentManager.UpdateAsync(contentItem);
                                        await contentManager.PublishAsync(contentItem);
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error marking comment as read: {ex.Message}");
                        }
                    }
                }
            }

            return Results.Json(new { success = true });
        });

        // Delete notification
        app.MapDelete("api/notifications/{id}", (
            int id,
            HttpContext context,
            [FromServices] ISession session) =>
        {
            // Must be authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            // För nu, returnera success (notifikationer kommer från Chat-meddelanden)
            // Notifikationer tas bort när meddelanden markeras som lästa eller raderas
            return Results.Json(new { success = true });
        });
    }
}
