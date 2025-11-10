using Microsoft.Data.Sqlite;
using System.Collections.Generic;
using System.Dynamic;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;

namespace CommunityBoard.Cms.Services;

public class DatabaseService
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(IConfiguration configuration, IWebHostEnvironment environment, ILogger<DatabaseService> logger)
    {
        var dbPath = configuration.GetValue<string>("DatabasePath") ?? "App_Data/bulletin_board.db";
        
        // Resolve relative paths to absolute paths
        if (!Path.IsPathRooted(dbPath))
        {
            var contentRoot = environment.ContentRootPath;
            dbPath = Path.Combine(contentRoot, dbPath);
        }
        
        // Ensure directory exists
        var dbDirectory = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
        {
            Directory.CreateDirectory(dbDirectory);
        }
        
        _connectionString = $"Data Source={dbPath}";
        _logger = logger;
        
        logger.LogInformation("Database path: {DbPath}", dbPath);
        
        // Initialize database tables
        InitializeDatabaseAsync().GetAwaiter().GetResult();
    }
    
    private async Task InitializeDatabaseAsync()
    {
        try
        {
            // Create users table (must be created first as other tables reference it)
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firstName TEXT NOT NULL,
                    lastName TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    created TEXT DEFAULT (datetime('now'))
                )
            ");
            
            // Create conversations table
            // Each row represents a conversation from one user's perspective
            // currentUserId is the user who sees this conversation
            // userId is the other user in the conversation
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    currentUserId INTEGER NOT NULL,
                    userId INTEGER NOT NULL,
                    userName TEXT,
                    userFirstName TEXT,
                    userLastName TEXT,
                    lastMessage TEXT,
                    lastMessageTime TEXT,
                    unread INTEGER DEFAULT 0,
                    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            // Create messages table
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversationId INTEGER NOT NULL,
                    senderId INTEGER NOT NULL,
                    senderName TEXT,
                    content TEXT NOT NULL,
                    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conversationId) REFERENCES conversations(id)
                )
            ");
            
            // Create push_subscriptions table
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh TEXT NOT NULL,
                    auth TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ");
            
            // Create notifications table
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type TEXT NOT NULL DEFAULT 'general',
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    link TEXT,
                    read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ");
            
            // Create sessions table
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    data TEXT DEFAULT '{}',
                    created TEXT DEFAULT (datetime('now')),
                    modified TEXT DEFAULT (datetime('now'))
                )
            ");
            
            // Create likes/reactions table for social media interactions
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    post_id INTEGER NOT NULL,
                    created_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(user_id, post_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
                )
            ");
            
            // Create followers/following table for social connections
            await QueryAsync(@"
                CREATE TABLE IF NOT EXISTS follows (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    follower_id INTEGER NOT NULL,
                    following_id INTEGER NOT NULL,
                    created_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(follower_id, following_id),
                    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                    CHECK(follower_id != following_id)
                )
            ");
            
            // Create indexes for better performance
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)");
            await QueryAsync("CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)");
            
            _logger.LogInformation("Database tables initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing database tables");
        }
    }

    public async Task<List<Dictionary<string, object?>>> QueryAsync(string sql, Dictionary<string, object?>? parameters = null)
    {
        var results = new List<Dictionary<string, object?>>();
        
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqliteCommand(sql, connection);
        
        if (parameters != null)
        {
            foreach (var param in parameters)
            {
                command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            }
        }
        
        try
        {
            if (sql.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object?>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var name = reader.GetName(i);
                        var value = reader.GetValue(i);
                        row[name] = value == DBNull.Value ? null : value;
                    }
                    results.Add(row);
                }
            }
            else
            {
                var rowsAffected = await command.ExecuteNonQueryAsync();
                results.Add(new Dictionary<string, object?>
                {
                    ["rowsAffected"] = rowsAffected
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database query error: {Sql}", sql);
            results.Add(new Dictionary<string, object?>
            {
                ["error"] = ex.Message
            });
        }
        
        return results;
    }

    public async Task<Dictionary<string, object?>> QueryOneAsync(string sql, Dictionary<string, object?>? parameters = null)
    {
        var results = await QueryAsync(sql, parameters);
        return results.FirstOrDefault() ?? new Dictionary<string, object?>();
    }
}

