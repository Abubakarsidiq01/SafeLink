# SafeLink - Stop All Services
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Stopping SafeLink Services" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Backend (port 4000)
Write-Host "Stopping Backend Server (port 4000)..." -ForegroundColor Yellow
try {
    $backendProcesses = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($backendProcesses) {
        foreach ($pid in $backendProcesses) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped Backend Server (PID: $pid)" -ForegroundColor Green
        }
    } else {
        Write-Host "  Backend Server is not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Could not stop Backend Server" -ForegroundColor Yellow
}
Start-Sleep -Seconds 1

# Stop Dashboard (port 5173)
Write-Host "Stopping Dashboard (port 5173)..." -ForegroundColor Yellow
try {
    $dashboardProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($dashboardProcesses) {
        foreach ($pid in $dashboardProcesses) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped Dashboard (PID: $pid)" -ForegroundColor Green
        }
    } else {
        Write-Host "  Dashboard is not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Could not stop Dashboard" -ForegroundColor Yellow
}
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""

