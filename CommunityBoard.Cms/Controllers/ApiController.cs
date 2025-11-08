using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<ApiController> _logger;

    public ApiController(DatabaseService databaseService, ILogger<ApiController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    [HttpGet("{table}")]
    public async Task<IActionResult> Get(string table)
    {
        var sql = $"SELECT * FROM {SanitizeTableName(table)}";
        var query = ParseQuery(Request.Query);
        sql += query.sql;
        
        var results = await _databaseService.QueryAsync(sql, query.parameters);
        
        if (results.Count > 0 && results[0].ContainsKey("error"))
        {
            return BadRequest(results[0]);
        }
        
        return Ok(results);
    }

    [HttpGet("{table}/{id}")]
    public async Task<IActionResult> GetById(string table, string id)
    {
        var result = await _databaseService.QueryOneAsync(
            $"SELECT * FROM {SanitizeTableName(table)} WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = id }
        );
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        if (result.Count == 0)
        {
            return NotFound();
        }
        
        return Ok(result);
    }

    [HttpPost("{table}")]
    public async Task<IActionResult> Post(string table, [FromBody] JsonElement body)
    {
        var bodyDict = ParseJsonElement(body);
        bodyDict.Remove("id");
        
        var parsed = ParseRequestBody(table, bodyDict);
        var columns = string.Join(",", parsed.Keys);
        var values = string.Join(",", parsed.Keys.Select(k => $"${k}"));
        var sql = $"INSERT INTO {SanitizeTableName(table)}({columns}) VALUES({values})";
        
        var result = await _databaseService.QueryOneAsync(sql, parsed);
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        // Get the insert id
        var insertIdResult = await _databaseService.QueryOneAsync(
            $"SELECT id AS __insertId FROM {SanitizeTableName(table)} ORDER BY id DESC LIMIT 1"
        );
        
        result["insertId"] = insertIdResult.GetValueOrDefault("__insertId");
        
        return Ok(result);
    }

    [HttpPut("{table}/{id}")]
    public async Task<IActionResult> Put(string table, string id, [FromBody] JsonElement body)
    {
        var bodyDict = ParseJsonElement(body);
        bodyDict["id"] = id;
        
        var parsed = ParseRequestBody(table, bodyDict);
        parsed.Remove("id");
        
        var updates = string.Join(",", parsed.Keys.Select(k => $"{k}=${k}"));
        var sql = $"UPDATE {SanitizeTableName(table)} SET {updates} WHERE id = $id";
        
        parsed["id"] = id;
        var result = await _databaseService.QueryOneAsync(sql, parsed);
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    [HttpDelete("{table}/{id}")]
    public async Task<IActionResult> Delete(string table, string id)
    {
        var result = await _databaseService.QueryOneAsync(
            $"DELETE FROM {SanitizeTableName(table)} WHERE id = $id",
            new Dictionary<string, object?> { ["id"] = id }
        );
        
        if (result.ContainsKey("error"))
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    private string SanitizeTableName(string table)
    {
        // Only allow alphanumeric and underscore
        return Regex.Replace(table, @"[^a-zA-Z0-9_]", "");
    }

    private Dictionary<string, object?> ParseJsonElement(JsonElement element)
    {
        var dict = new Dictionary<string, object?>();
        
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in element.EnumerateObject())
            {
                dict[prop.Name] = prop.Value.ValueKind switch
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
        
        return dict;
    }

    private Dictionary<string, object?> ParseRequestBody(string table, Dictionary<string, object?> body)
    {
        var cleaned = new Dictionary<string, object?>();
        
        foreach (var kvp in body)
        {
            // Skip role for users table
            if (table == "users" && kvp.Key == "role")
            {
                continue;
            }
            
            // Encrypt password fields
            if (kvp.Key == "password" && kvp.Value is string password)
            {
                cleaned[kvp.Key] = BCrypt.Net.BCrypt.EnhancedHashPassword(password, 13);
                continue;
            }
            
            // Convert to number if possible
            if (kvp.Value is string strValue && double.TryParse(strValue, out var numValue))
            {
                cleaned[kvp.Key] = numValue;
            }
            else
            {
                cleaned[kvp.Key] = kvp.Value;
            }
        }
        
        return cleaned;
    }

    private (string sql, Dictionary<string, object?> parameters) ParseQuery(IQueryCollection query)
    {
        var sql = "";
        var parameters = new Dictionary<string, object?>();
        var whereConditions = new List<string>();
        
        // Handle simple query parameters as WHERE conditions
        foreach (var kvp in query)
        {
            var key = kvp.Key.ToLower();
            var value = kvp.Value.ToString();
            
            // Skip special query parameters
            if (key == "where" || key == "orderby" || key == "limit" || key == "offset")
            {
                continue;
            }
            
            // Sanitize column name (only alphanumeric and underscore)
            var columnName = Regex.Replace(kvp.Key, @"[^a-zA-Z0-9_]", "");
            if (string.IsNullOrEmpty(columnName))
            {
                continue;
            }
            
            // Add WHERE condition
            var paramName = $"param_{parameters.Count}";
            whereConditions.Add($"{columnName} = ${paramName}");
            parameters[paramName] = value;
        }
        
        // Handle explicit where clause
        if (query.TryGetValue("where", out var whereValue))
        {
            whereConditions.Add(whereValue.ToString());
        }
        
        if (whereConditions.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", whereConditions);
        }
        
        if (query.TryGetValue("orderby", out var orderByValue))
        {
            var orderBy = Regex.Replace(orderByValue.ToString(), @"[^a-zA-Z0-9_\-,]", "");
            sql += " ORDER BY " + orderBy;
        }
        
        if (query.TryGetValue("limit", out var limitValue) && int.TryParse(limitValue, out var limit))
        {
            sql += " LIMIT " + limit;
            
            if (query.TryGetValue("offset", out var offsetValue) && int.TryParse(offsetValue, out var offset))
            {
                sql += " OFFSET " + offset;
            }
        }
        
        return (sql, parameters);
    }
}

