# Script för att återställa Orchard Core setup
Write-Host "Återställer Orchard Core setup..." -ForegroundColor Yellow

$appDataPath = "CommunityBoard.Cms\App_Data"
$sitesPath = "$appDataPath\Sites\Default"
$tenantsFile = "$appDataPath\tenants.json"

# Ta bort tenants.json
if (Test-Path $tenantsFile) {
    Remove-Item $tenantsFile -Force
    Write-Host "✓ Tog bort tenants.json" -ForegroundColor Green
} else {
    Write-Host "tenants.json finns inte" -ForegroundColor Gray
}

# Ta bort databasfiler
$dbFiles = @(
    "$sitesPath\OrchardCore.db",
    "$sitesPath\yessql.db",
    "$sitesPath\OrchardCore.db-shm",
    "$sitesPath\OrchardCore.db-wal",
    "$sitesPath\yessql.db-shm",
    "$sitesPath\yessql.db-wal"
)

foreach ($dbFile in $dbFiles) {
    if (Test-Path $dbFile) {
        Remove-Item $dbFile -Force
        Write-Host "✓ Tog bort $dbFile" -ForegroundColor Green
    }
}

Write-Host "`n✓ Orchard Core setup återställd!" -ForegroundColor Green
Write-Host "Starta om servern och gå till http://localhost:5100 för att se setup-sidan" -ForegroundColor Cyan
