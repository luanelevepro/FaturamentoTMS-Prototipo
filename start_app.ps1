# Helper script to start the Transportes Tomazi Application (API + Frontend)
# This workaround sets the correct Node.js PATH before running commands.

$NodePath = "C:\Program Files\nodejs"
$env:Path = "$NodePath;" + $env:Path

Write-Host "Starting Transportes Tomazi App..." -ForegroundColor Green
Write-Host "Ensuring dependencies installed..." -ForegroundColor Gray
& "$NodePath\npm.cmd" install

Write-Host "Starting Backend (Port 3001)..." -ForegroundColor Cyan
# Start backend in background job
Start-Job -ScriptBlock {
    $env:Path = $using:env:Path
    Set-Location $using:PWD
    & "node" server/index.js
} | Out-Null

Write-Host "Waiting for backend..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Starting Frontend (Port 3000)..." -ForegroundColor Cyan
& "$pwd\node_modules\.bin\vite.cmd"
