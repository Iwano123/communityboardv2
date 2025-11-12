# Automatiskt skapa admin-användare med standarduppgifter
# Kör detta script så skapas admin-användaren automatiskt

$body = @{
    Username = "admin"
    Email = "admin@example.com"
    Password = "Admin123!"
    FirstName = "Admin"
    LastName = "User"
} | ConvertTo-Json

Write-Host "Skapar admin-användare automatiskt..."
Write-Host "Användarnamn: admin"
Write-Host "Lösenord: Admin123!"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5100/api/auth/create-admin" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Admin-användare skapad!"
    Write-Host ""
    Write-Host "Du kan nu logga in med:"
    Write-Host "  Användarnamn: admin"
    Write-Host "  Lösenord: Admin123!"
    Write-Host ""
    Write-Host "Gå till: http://localhost:5100/Login"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "Admin-användare finns redan. Du kan logga in med:"
        Write-Host "  Användarnamn: admin"
        Write-Host "  Lösenord: Admin123!"
    } else {
        Write-Host "Fel: $($_.Exception.Message)"
        if ($_.ErrorDetails.Message) {
            Write-Host "Detaljer: $($_.ErrorDetails.Message)"
        }
    }
}

