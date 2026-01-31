# Claudequarium Server Stop Script (PowerShell)

$port = 4000

$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    $procInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    Write-Host "Stopping Claudequarium Server (PID: $process, Name: $($procInfo.ProcessName))" -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "Server stopped." -ForegroundColor Green
} else {
    Write-Host "No server running on port $port" -ForegroundColor Gray
}
