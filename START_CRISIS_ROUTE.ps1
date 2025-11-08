# Start CrisisRoute Web App (lifeline-ui from CrisisRoute branch)

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   🏠 STARTING CRISISROUTE SHELTER FINDER" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$lifelinePath = Join-Path $PSScriptRoot "lifeline-ui"

if (-not (Test-Path $lifelinePath)) {
    Write-Host "  ❌ lifeline-ui directory not found" -ForegroundColor Red
    Write-Host "  Please ensure CrisisRoute branch files are checked out" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
Set-Location $lifelinePath

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host "`nStep 2: Starting CrisisRoute web app..." -ForegroundColor Yellow
Write-Host "  🌐 App will run on: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$lifelinePath'; Write-Host '[CrisisRoute Shelter Finder]' -ForegroundColor Green; Write-Host 'Starting on http://localhost:5173...' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host "  ✅ CrisisRoute web app starting in new window" -ForegroundColor Green
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   ✅ CRISISROUTE APP STARTED!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now click the 'Find Shelter' button in the dashboard" -ForegroundColor Yellow
Write-Host "to open this app in a new tab." -ForegroundColor Yellow
Write-Host ""

