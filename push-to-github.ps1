# Automated GitHub Push Script for SafeLink
# This script will attempt to push your code to GitHub

param(
    [string]$RepoUrl = "https://github.com/BE-Hackathon-2025/GRAM-TEAMB.git"
)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Pushing SafeLink to GitHub" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify commits
Write-Host "[1/4] Verifying local commits..." -ForegroundColor Yellow
$commitCount = (git log --oneline | Measure-Object -Line).Lines
Write-Host "   Found $commitCount commits ready to push" -ForegroundColor Green
Write-Host ""

# Step 2: Check remote
Write-Host "[2/4] Checking remote repository..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>&1
Write-Host "   Current remote: $currentRemote" -ForegroundColor Gray

# Step 3: Try to push
Write-Host "[3/4] Attempting to push to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Try push
$pushOutput = git push -u origin main 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Code pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: https://github.com/BE-Hackathon-2025/GRAM-TEAMB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next: Deploy to Render using RENDER_DEPLOYMENT.md" -ForegroundColor Yellow
    exit 0
}

# If push failed, analyze the error
Write-Host "Push failed. Analyzing error..." -ForegroundColor Yellow
Write-Host ""

if ($pushOutput -match "Repository not found") {
    Write-Host "ERROR: Repository does not exist on GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Create the repository first" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open: https://github.com/organizations/BE-Hackathon-2025/repositories/new" -ForegroundColor White
    Write-Host "   2. Name: GRAM-TEAMB" -ForegroundColor White
    Write-Host "   3. DO NOT initialize (no README, no .gitignore)" -ForegroundColor White
    Write-Host "   4. Click 'Create repository'" -ForegroundColor White
    Write-Host "   5. Run this script again: .\push-to-github.ps1" -ForegroundColor White
    Write-Host ""
} elseif ($pushOutput -match "Authentication" -or $pushOutput -match "denied" -or $pushOutput -match "credentials") {
    Write-Host "ERROR: Authentication required" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Authenticate with GitHub" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use Personal Access Token" -ForegroundColor Cyan
    Write-Host "   1. Create token: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   2. Permissions: repo (all)" -ForegroundColor White
    Write-Host "   3. Git will prompt for credentials" -ForegroundColor White
    Write-Host "   4. Username: your GitHub username" -ForegroundColor White
    Write-Host "   5. Password: paste your token" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use SSH" -ForegroundColor Cyan
    Write-Host "   Run: git remote set-url origin git@github.com:BE-Hackathon-2025/GRAM-TEAMB.git" -ForegroundColor White
    Write-Host "   Then: git push -u origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERROR: Unknown error occurred" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $pushOutput -ForegroundColor Red
    Write-Host ""
}

Write-Host "For detailed instructions, see: GIT_PUSH_INSTRUCTIONS.md" -ForegroundColor Gray
exit 1

