# Claudequarium Server Startup Script (PowerShell)

$env:HOST = "0.0.0.0"
$env:PORT = "4000"

Write-Host "Starting Claudequarium Server..." -ForegroundColor Cyan
npm start
