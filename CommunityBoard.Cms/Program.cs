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

// Register services
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<SessionService>();

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

builder.Services
    .AddOrchardCms()
    // // Orchard Specific Pipeline
    // .ConfigureServices( services => {
    // })
    // .Configure( (app, routes, services) => {
    // })
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

// Map fallback to index.html for SPA routing - after Orchard Core
app.MapFallbackToFile("index.html", staticFileOptions);

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application starting...");
logger.LogInformation("Frontend path: {FrontendPath}", frontendPath);
logger.LogInformation("Database path: {DbPath}", dbPath);

app.Run();
