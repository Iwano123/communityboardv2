# PowerShell script to seed test data using the API
$baseUrl = "http://localhost:5100"

Write-Host "Seeding test data..." -ForegroundColor Cyan

# Create categories
$categories = @(
    @{ name = "For Sale"; color = "#10b981" },
    @{ name = "Services"; color = "#3b82f6" },
    @{ name = "Events"; color = "#8b5cf6" },
    @{ name = "Housing"; color = "#f59e0b" },
    @{ name = "Jobs"; color = "#ef4444" },
    @{ name = "Community"; color = "#1d9bf0" }
)

Write-Host "Creating categories..." -ForegroundColor Yellow
foreach ($cat in $categories) {
    try {
        $body = $cat | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
        Write-Host "  ✓ $($cat.name)" -ForegroundColor Green
    } catch {
        Write-Host "  - $($cat.name) (may already exist)" -ForegroundColor Gray
    }
}

# Create test users
$users = @(
    @{ firstName = "Sarah"; lastName = "Johnson"; email = "sarah.johnson@example.com"; password = "password123" },
    @{ firstName = "Mike"; lastName = "Chen"; email = "mike.chen@example.com"; password = "password123" },
    @{ firstName = "Emma"; lastName = "Wilson"; email = "emma.wilson@example.com"; password = "password123" },
    @{ firstName = "David"; lastName = "Martinez"; email = "david.martinez@example.com"; password = "password123" },
    @{ firstName = "Lisa"; lastName = "Anderson"; email = "lisa.anderson@example.com"; password = "password123" }
)

Write-Host "`nCreating users..." -ForegroundColor Yellow
foreach ($user in $users) {
    try {
        $body = $user | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
        Write-Host "  ✓ $($user.firstName) $($user.lastName)" -ForegroundColor Green
    } catch {
        Write-Host "  - $($user.firstName) $($user.lastName) (may already exist)" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Test data seeding complete!" -ForegroundColor Green
Write-Host "Note: You may need to manually create posts through the UI or wait for the server to restart to use the /api/test-data/seed endpoint." -ForegroundColor Yellow

