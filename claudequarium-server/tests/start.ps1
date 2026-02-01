# Claudequarium Server Startup Script (PowerShell)
# Configuration is loaded from config.env file

Push-Location $PSScriptRoot

Write-Host "Starting Claudequarium Server..." -ForegroundColor Cyan
Write-Host "Configuration loaded from config.env" -ForegroundColor Gray
npm start

Pop-Location
