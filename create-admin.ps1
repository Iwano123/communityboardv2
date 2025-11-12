# Script för att skapa en admin-användare i Orchard Core
# Kör detta script för att skapa en admin-användare

$username = Read-Host "Ange användarnamn"
$email = Read-Host "Ange email"
$password = Read-Host "Ange lösenord" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$body = @{
    Username = $username
    Email = $email
    Password = $passwordPlain
    FirstName = "Admin"
    LastName = "User"
} | ConvertTo-Json

Write-Host "Skapar admin-användare..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5100/api/auth/create-  admin" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Admin-användare skapad: $($response.username)"
    Write-Host "Du kan nu logga in med dessa uppgifter på http://localhost:5100/Login"
} catch {
    Write-Host "Fel: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Detaljer: $($_.ErrorDetails.Message)"
    }
}

