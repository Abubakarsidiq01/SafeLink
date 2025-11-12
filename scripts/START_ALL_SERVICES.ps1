# SafeLink - Unified Startup Script
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SafeLink System Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Configuration - Consistent ports
$BACKEND_PORT = 4000
$DASHBOARD_PORT = 5173
$BACKEND_URL = "http://localhost:$BACKEND_PORT"
$DASHBOARD_URL = "http://localhost:$DASHBOARD_PORT"

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -ne $connection
    } catch {
        return $false
    }
}

# Function to stop process on port
function Stop-PortProcess {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        if ($processes) {
            foreach ($procId in $processes) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process on port $Port" -ForegroundColor Green
            }
            Start-Sleep -Seconds 2
        }
    } catch {
        # Ignore errors
    }
}

# Step 1: Clean up existing processes
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Stop-PortProcess -Port $BACKEND_PORT
Stop-PortProcess -Port $DASHBOARD_PORT
Start-Sleep -Seconds 1
Write-Host "  Ports cleared" -ForegroundColor Green
Write-Host ""

# Step 2: Start Backend Server
Write-Host "Step 2: Starting Backend Server (port $BACKEND_PORT)..." -ForegroundColor Yellow
$backendDir = Join-Path (Split-Path $PSScriptRoot -Parent) "server"
$backendCommand = "cd '$backendDir'; `$host.ui.RawUI.WindowTitle = 'SafeLink Backend - Port $BACKEND_PORT'; Write-Host '========================================' -ForegroundColor Green; Write-Host '   SafeLink Backend Server' -ForegroundColor Green; Write-Host '   Port: $BACKEND_PORT' -ForegroundColor Cyan; Write-Host '   URL: $BACKEND_URL' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; npm start"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Sleep -Seconds 3
Write-Host "  Backend server starting..." -ForegroundColor Green
Write-Host ""

# Step 3: Wait for backend to be ready
Write-Host "Step 3: Waiting for backend to be ready..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.status -eq "ok") {
            $backendReady = $true
            Write-Host "  Backend is ready!" -ForegroundColor Green
            Write-Host ""
            break
        }
    } catch {
        Write-Host "  Waiting for backend... ($($i + 1)/10)" -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host "  Backend may still be starting. Continuing anyway..." -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Start Dashboard
Write-Host "Step 4: Starting Dashboard (port $DASHBOARD_PORT)..." -ForegroundColor Yellow
$dashboardDir = Join-Path (Split-Path $PSScriptRoot -Parent) "safelink-dashboard"
$dashboardCommand = "cd '$dashboardDir'; `$host.ui.RawUI.WindowTitle = 'SafeLink Dashboard - Port $DASHBOARD_PORT'; Write-Host '========================================' -ForegroundColor Green; Write-Host '   SafeLink Dashboard' -ForegroundColor Green; Write-Host '   Port: $DASHBOARD_PORT' -ForegroundColor Cyan; Write-Host '   URL: $DASHBOARD_URL' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $dashboardCommand
Start-Sleep -Seconds 5
Write-Host "  Dashboard starting..." -ForegroundColor Green
Write-Host ""

# Step 5: Wait for dashboard to be ready
Write-Host "Step 5: Waiting for dashboard to be ready..." -ForegroundColor Yellow
$dashboardReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri $DASHBOARD_URL -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $dashboardReady = $true
            Write-Host "  Dashboard is ready!" -ForegroundColor Green
            Write-Host ""
            break
        }
    } catch {
        Write-Host "  Waiting for dashboard... ($($i + 1)/15)" -ForegroundColor Gray
    }
}

# Step 6: Open browser
Write-Host "Step 6: Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process $DASHBOARD_URL
Write-Host "  Browser opened" -ForegroundColor Green
Write-Host ""

# Final Status
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SYSTEM STARTED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Server:" -ForegroundColor Yellow
Write-Host "  URL: $BACKEND_URL" -ForegroundColor White
Write-Host "  Health: $BACKEND_URL/health" -ForegroundColor White
if ($backendReady) {
    Write-Host "  Status: Running" -ForegroundColor Green
} else {
    Write-Host "  Status: Starting..." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Dashboard:" -ForegroundColor Yellow
Write-Host "  URL: $DASHBOARD_URL" -ForegroundColor White
if ($dashboardReady) {
    Write-Host "  Status: Running" -ForegroundColor Green
} else {
    Write-Host "  Status: Starting (wait 10-15 seconds)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Both services are running in separate windows." -ForegroundColor Gray
Write-Host "Dashboard should open automatically in your browser!" -ForegroundColor Green
Write-Host ""
