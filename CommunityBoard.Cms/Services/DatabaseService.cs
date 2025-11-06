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

