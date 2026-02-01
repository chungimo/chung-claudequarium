# Claudequarium Server Stop Script (PowerShell)

Push-Location $PSScriptRoot

# Read port from config.env if it exists, otherwise default to 4000
$port = 4000
if (Test-Path config.env) {
    $envContent = Get-Content config.env
    $portLine = $envContent | Where-Object { $_ -match "^PORT=" }
    if ($portLine) {
        $port = [int]($portLine -replace "PORT=", "").Trim()
    }
}

$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    $procInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    Write-Host "Stopping Claudequarium Server (PID: $process, Name: $($procInfo.ProcessName)) on port $port" -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "Server stopped." -ForegroundColor Green
} else {
    Write-Host "No server running on port $port" -ForegroundColor Gray
}

Pop-Location
