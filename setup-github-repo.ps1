# SafeLink Mesh AI - GitHub Repository Setup Script
# This script helps you create the repository and push your code

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SafeLink GitHub Repository Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check current git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "WARNING: You have uncommitted changes!" -ForegroundColor Red
    Write-Host "Please commit all changes first." -ForegroundColor Yellow
    exit 1
}

Write-Host "SUCCESS: All changes are committed" -ForegroundColor Green
Write-Host ""

# Check if repository exists
Write-Host "Checking repository access..." -ForegroundColor Yellow
$repoCheck = git ls-remote origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Repository not found or no access" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to create the repository on GitHub first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Create via GitHub Web Interface" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://github.com/organizations/BE-Hackathon-2025/repositories/new" -ForegroundColor White
    Write-Host "   2. Repository name: GRAM-TEAMB" -ForegroundColor White
    Write-Host "   3. Description: SafeLink Mesh AI - Offline mesh networking for disaster relief" -ForegroundColor White
    Write-Host "   4. Visibility: Private (or Public)" -ForegroundColor White
    Write-Host "   5. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
    Write-Host "   6. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Create via GitHub CLI (if installed)" -ForegroundColor Cyan
    Write-Host "   Run: gh repo create BE-Hackathon-2025/GRAM-TEAMB --private --source=. --remote=origin --push" -ForegroundColor White
    Write-Host ""
    Write-Host "Waiting for you to create the repository..." -ForegroundColor Yellow
    Write-Host "Press any key after you have created it on GitHub..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

# Try to push
Write-Host "Attempting to push to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Try push
Write-Host "Method 1: Standard push..." -ForegroundColor Cyan
$pushResult = git push -u origin main 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/BE-Hackathon-2025/GRAM-TEAMB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to Render: https://dashboard.render.com" -ForegroundColor White
    Write-Host "   2. Connect your GitHub repository" -ForegroundColor White
    Write-Host "   3. Follow the deployment guide: RENDER_DEPLOYMENT.md" -ForegroundColor White
    exit 0
} else {
    Write-Host "ERROR: Push failed" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    Write-Host ""
    
    # Check if it's an authentication issue
    if ($pushResult -match "Authentication" -or $pushResult -match "denied" -or $pushResult -match "credentials") {
        Write-Host "Authentication required!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You need to authenticate with GitHub:" -ForegroundColor Yellow
        Write-Host "   1. GitHub will prompt for credentials" -ForegroundColor White
        Write-Host "   2. Use Personal Access Token (not password)" -ForegroundColor White
        Write-Host "   3. Create token at: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host ""
        Write-Host "   Token permissions needed: repo (all)" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "Alternative: Use SSH instead of HTTPS" -ForegroundColor Cyan
    Write-Host "   Run: git remote set-url origin git@github.com:BE-Hackathon-2025/GRAM-TEAMB.git" -ForegroundColor White
    Write-Host "   Then: git push -u origin main" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
