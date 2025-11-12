# SafeLink Mesh AI - React Native App Startup Script

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   🚀 SAFELINK MESH AI - APP STARTUP" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
$appDir = Join-Path $rootDir "app"
if (-not (Test-Path $appDir)) {
    Write-Host "❌ Error: $appDir directory not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "$appDir\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location $appDir
    npm install
    Set-Location ..
}

# Start Metro Bundler
Write-Host "Starting Metro Bundler..." -ForegroundColor Yellow
Write-Host "  This starts the React Native development server" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$appDir'; Write-Host '`n[Metro Bundler]' -ForegroundColor Green; Write-Host 'Starting React Native Metro bundler...' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Gray; Write-Host ''; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "✅ Metro Bundler started in new window!" -ForegroundColor Green
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   📱 HOW TO RUN THE APP" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1: Android Emulator" -ForegroundColor Yellow
Write-Host "  1. Open Android Studio" -ForegroundColor White
Write-Host "  2. Start an Android emulator" -ForegroundColor White
Write-Host "  3. In Metro window, press 'a' or run:" -ForegroundColor White
Write-Host "     cd app && npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 2: iOS Simulator (Mac only)" -ForegroundColor Yellow
Write-Host "  1. Open Xcode" -ForegroundColor White
Write-Host "  2. Start iOS Simulator" -ForegroundColor White
Write-Host "  3. In Metro window, press 'i' or run:" -ForegroundColor White
Write-Host "     cd app && npm run ios" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3: Physical Device" -ForegroundColor Yellow
Write-Host "  1. Enable USB debugging (Android)" -ForegroundColor White
Write-Host "  2. Connect device via USB" -ForegroundColor White
Write-Host "  3. Run: cd app && npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 4: Web Preview (Development)" -ForegroundColor Yellow
Write-Host "  Note: Some features may not work on web" -ForegroundColor Gray
Write-Host "  BLE/WiFi mesh networking requires native device" -ForegroundColor Gray
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   ✅ READY!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Metro Bundler is running. Check the Metro window for status." -ForegroundColor Cyan
Write-Host ""

