# Script för att återskapa admin-användare
Write-Host "Återskapar admin-användare..." -ForegroundColor Yellow

$body = @{
    Username = "admin"
    Email = "admin@example.com"
    Password = "Admin123!"
    FirstName = "Admin"
    LastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5100/api/auth/recreate-admin" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Admin-användare återskapad!" -ForegroundColor Green
    Write-Host "Användarnamn: admin" -ForegroundColor Cyan
    Write-Host "Lösenord: Admin123!" -ForegroundColor Cyan
    Write-Host "Email: admin@example.com" -ForegroundColor Cyan
} catch {
    Write-Host "Fel: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Detaljer: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

