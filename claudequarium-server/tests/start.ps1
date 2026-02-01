# Claudequarium Server Startup Script (PowerShell)
# Configuration is loaded from config.env file

# Navigate to server root (parent of tests folder)
Push-Location (Join-Path $PSScriptRoot "..")

Write-Host "Starting Claudequarium Server..." -ForegroundColor Cyan
Write-Host "Configuration loaded from config.env" -ForegroundColor Gray
npm start

Pop-Location
