using OrchardCore.Logging;
using CommunityBoard.Cms.Services;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseNLogHost();

// Configure database path - use the SQLite database in App_Data
var dbPath = builder.Configuration.GetValue<string>("DatabasePath");
if (string.IsNullOrEmpty(dbPath))
{
    // Use App_Data directory
    dbPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "bulletin_board.db");
}
else if (!Path.IsPathRooted(dbPath))
{
    // If relative path, make it relative to ContentRootPath
    dbPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
}

builder.Configuration["DatabasePath"] = dbPath;

// Ensure App_Data directory exists for Orchard Core
var appDataPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
if (!Directory.Exists(appDataPath))
{
    Directory.CreateDirectory(appDataPath);
}

// Ensure Orchard Core database directory exists
var orchardDbPath = Path.Combine(appDataPath, "Sites", "Default");
if (!Directory.Exists(orchardDbPath))
{
    Directory.CreateDirectory(orchardDbPath);
}

// Update Orchard Core connection string to use absolute path
var orchardConnectionString = Path.Combine(orchardDbPath, "OrchardCore.db");
builder.Configuration["OrchardCore:ConnectionString"] = $"Data Source={orchardConnectionString}";

// Check if Orchard Core database is initialized
// If the database file exists but doesn't have the Document table, reset tenant state
var tenantsJsonPath = Path.Combine(appDataPath, "tenants.json");
if (File.Exists(orchardConnectionString) && File.Exists(tenantsJsonPath))
{
    try
    {
        using var connection = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={orchardConnectionString}");
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='Orchard__Document'";
        var tableExists = command.ExecuteScalar() != null;
        connection.Close();

        // If database exists but Document table doesn't, reset tenant to Uninitialized
        if (!tableExists)
        {
            var tenantsJsonText = File.ReadAllText(tenantsJsonPath);
            // Simple string replacement to set state to Uninitialized
            if (tenantsJsonText.Contains("\"State\": \"Running\""))
            {
                tenantsJsonText = tenantsJsonText.Replace("\"State\": \"Running\"", "\"State\": \"Uninitialized\"");
                File.WriteAllText(tenantsJsonPath, tenantsJsonText);
            }
        }
    }
    catch
    {
        // If we can't check, continue - Orchard Core will handle it
    }
}

// Register services
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<SessionService>();
// OrchardUserService will be registered after Orchard Core is configured

// Add controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:4173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Orchard Core CMS
builder.Services
    .AddOrchardCms()
    .ConfigureServices(services =>
    {
        // Register OrchardUserService after Orchard Core services are available
        services.AddScoped<OrchardUserService>();
    })
    .Configure((app, routes, services) =>
    {
        // Orchard Core middleware is configured via UseOrchardCore()
    })
;

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Use CORS before other middleware
app.UseCors("AllowFrontend");

// Only redirect HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Map API controllers early, before Orchard Core
app.MapControllers();

// Configure static files for React frontend
var frontendPath = Path.Combine(builder.Environment.ContentRootPath, "..", "dist");
if (!Directory.Exists(frontendPath))
{
    frontendPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
}

var staticFileOptions = new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendPath),
    RequestPath = ""
};

app.UseStaticFiles(staticFileOptions);

app.UseOrchardCore();

// Map fallback to index.html for SPA routing
// Orchard Core will handle /Admin routes before this fallback is reached
app.MapFallbackToFile("index.html", staticFileOptions);

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application starting...");
logger.LogInformation("Frontend path: {FrontendPath}", frontendPath);
logger.LogInformation("Database path: {DbPath}", dbPath);
logger.LogInformation("To initialize Orchard Core roles, call: POST /api/roles/initialize (requires admin login)");

app.Run();
