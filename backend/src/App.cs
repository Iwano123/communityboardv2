// Global settings
Globals = Obj(new
{
    debugOn = true,
    detailedAclDebug = false,
    aclOn = true,
    isSpa = true,
    port = args.Length > 0 ? args[0] : "5002",
    serverName = "Minimal API Backend",
    frontendPath = args.Length > 1 ? args[1] : "../dist",
    dbPath = args.Length > 2 ? args[2] : "_db.sqlite3",
    sessionLifeTimeHours = 2
});

Server.Start();