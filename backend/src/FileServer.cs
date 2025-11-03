namespace WebApp;
public static class FileServer
{
    private static string FPath;

    public static void Start()
    {
        // Convert frontendPath to an absolute path
        FPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            Globals.frontendPath
        );

        // Create dist directory if it doesn't exist
        if (!Directory.Exists(FPath))
        {
            Directory.CreateDirectory(FPath);
            Log("Created directory:", FPath);
            
            // Create a simple index.html if it doesn't exist
            var indexPath = Path.Combine(FPath, "index.html");
            if (!File.Exists(indexPath))
            {
                File.WriteAllText(indexPath, @"<!DOCTYPE html>
<html>
<head>
    <title>Community Board</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body>
    <h1>Welcome to Community Board</h1>
    <p>Run <b>npm run build</b> to compile your frontend, or <b>npm run dev</b> to use the Vite dev server.</p>
</body>
</html>");
                Log("Created default index.html");
            }
        }

        HandleStatusCodes();
        ServeFiles();
        ServeFileLists();
    }

    // Write status codes as response bodies
    // and if the app is an SPA serve index.html on non-file 404:s
    private static void HandleStatusCodes()
    {
        App.UseStatusCodePages(async statusCodeContext =>
        {
            var context = statusCodeContext.HttpContext;
            var request = context.Request;
            var response = context.Response;
            var statusCode = response.StatusCode;
            var isInApi = request.Path.StartsWithSegments("/api");
            var isFilePath = (request.Path + "").Contains('.');
            var type = isInApi || statusCode != 404 ?
                "application/json; charset=utf-8" : "text/html";
            var error = statusCode == 404 ?
                "404. Not found." : "Status code: " + statusCode;

            response.ContentType = type;
            if (Globals.isSpa && !isInApi && !isFilePath && statusCode == 404)
            {
                // For SPA:s server the index.html on routes not matching
                // any folders (thus handing the routing to the frontend)
                response.StatusCode = 200;
                await response.WriteAsync(
                    File.ReadAllText(Path.Combine(FPath, "index.html"))
                );
            }
            else
            {
                await response.WriteAsJsonAsync(new { error });
            }
        });
    }

    private static void ServeFiles()
    {
        // Serve static frontend files (middleware)
        App.UseFileServer(new FileServerOptions
        {
            FileProvider = new PhysicalFileProvider(FPath)
        });
    }

    private static void ServeFileLists()
    {
        // Get a list of files from a subfolder in the frontend
        App.MapGet("/api/files/{folder}", (HttpContext context, string folder) =>
        {
            object result = null;
            try
            {
                result = Arr(Directory.GetFiles(Path.Combine(FPath, folder)))
                    .Map(x => Arr(x.Split('/')).Pop())
                    .Filter(x => Acl.Allow(context, "GET", "/content/" + x));
            }
            catch (Exception) { }
            return RestResult.Parse(context, result);
        });
    }
}