namespace WebApp;
public static class Server
{
    public static void Start()
    {
        // Initialize database if it doesn't exist
        InitializeDatabase();
        
        var builder = WebApplication.CreateBuilder();
        
        // Add CORS services
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
        
        App = builder.Build();
        
        // Use CORS
        App.UseCors("AllowFrontend");
        
        Middleware();
        DebugLog.Start();
        Acl.Start();
        ErrorHandler.Start();
        FileServer.Start();
        LoginRoutes.Start();
        RestApi.Start();
        Session.Start();
        // Start the server on port 3001
        var runUrl = "http://localhost:" + Globals.port;
        Log("Server running on:", runUrl);
        Log("With these settings:", Globals);
        App.Run(runUrl);
    }

    // Middleware that changes the server response header,
    // initiates the debug logging for the request,
    // keep sessions alive, stops the route if not acl approved
    // and adds some info for debugging
    public static void Middleware()
    {
        App.Use(async (context, next) =>
        {
            context.Response.Headers.Append("Server", (string)Globals.serverName);
            DebugLog.Register(context);
            Session.Touch(context);
            if (!Acl.Allow(context))
            {
                // Acl says the route is not allowed
                context.Response.StatusCode = 405;
                var error = new { error = "Not allowed." };
                DebugLog.Add(context, error);
                await context.Response.WriteAsJsonAsync(error);
            }
            else { await next(context); }
            // Add some extra info for debugging
            var res = context.Response;
            var contentLength = res.ContentLength;
            contentLength = contentLength == null ? 0 : contentLength;
            var info = Obj(new
            {
                statusCode = res.StatusCode,
                contentType = res.ContentType,
                contentLengthKB =
                    Math.Round((double)contentLength / 10.24) / 100,
                RESPONSE_DONE = Now
            });
            if (info.contentLengthKB == null || info.contentLengthKB == 0)
            {
                info.Delete("contentLengthKB");
            }
            DebugLog.Add(context, info);
        });
    }

    // Initialize database by copying from template if it doesn't exist
    private static void InitializeDatabase()
    {
        var dbPath = Globals.dbPath;
        var dbTemplatePath = Path.Combine(Directory.GetCurrentDirectory(), "db_template", "_db.sqlite3");
        
        // Check if database file exists
        if (!System.IO.File.Exists(dbPath))
        {
            // Check if template database exists
            if (System.IO.File.Exists(dbTemplatePath))
            {
                try
                {
                    System.IO.File.Copy(dbTemplatePath, dbPath);
                    Log("Database initialized from template:", dbTemplatePath);
                }
                catch (Exception ex)
                {
                    Log("Error copying database template:", ex.Message);
                }
            }
            else
            {
                Log("Warning: Database template not found at:", dbTemplatePath);
                Log("Creating empty database. The database needs to be set up with proper tables.");
            }
        }
        else
        {
            Log("Database already exists:", dbPath);
        }
    }
}