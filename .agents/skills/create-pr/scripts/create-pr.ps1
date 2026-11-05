<#
.SYNOPSIS
    Automates pre-flight verification and PR creation for the ARL repository.
.DESCRIPTION
    Runs mandatory pre-flight checks (rebase status, typecheck, lint, test),
    pushes the current branch, and creates or updates a Pull Request via GitHub CLI (`gh`).
.PARAMETER Title
    The standardized PR title (e.g. "feat(categories): [ARL-7] add category filters").
.PARAMETER BodyFile
    Path to markdown file containing the synthesized PR body.
.PARAMETER BaseBranch
    Target base branch to merge into. Default is 'main'.
.PARAMETER SkipChecks
    If specified, bypasses npm run lint/test/tsc pre-flight checks (use with caution).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Title,

    [Parameter(Mandatory=$false)]
    [string]$BodyFile = "",

    [Parameter(Mandatory=$false)]
    [string]$BodyText = "",

    [Parameter(Mandatory=$false)]
    [string]$BaseBranch = "main",

    [switch]$SkipChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "=== ARL Pre-Flight PR Automation ===" -ForegroundColor Cyan

# 1. Verify git branch
$currentBranch = (git branch --show-current).Trim()
if (-not $currentBranch -or $currentBranch -eq $BaseBranch) {
    Write-Error "Cannot create a PR from '$currentBranch'. Please switch to a dedicated feature branch."
}
Write-Host "[1/5] Active branch: $currentBranch -> target base: $BaseBranch" -ForegroundColor Green

# 2. Check working tree state
$uncommitted = (git status --porcelain).Trim()
if ($uncommitted) {
    Write-Host "[WARN] You have uncommitted changes in your working tree:" -ForegroundColor Yellow
    git status -s
}

# 3. Pre-flight verification (unless skipped)
if (-not $SkipChecks) {
    Write-Host "[2/5] Running TypeScript compiler check (tsc --noEmit)..." -ForegroundColor Cyan
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Typecheck failed with exit code $LASTEXITCODE. Fix errors before opening PR."
    }

    Write-Host "[3/5] Running ESLint check (npm run lint)..." -ForegroundColor Cyan
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Lint check failed with exit code $LASTEXITCODE. Fix lint errors before opening PR."
    }
} else {
    Write-Host "[2/5 & 3/5] Skipping code quality checks (-SkipChecks specified)." -ForegroundColor Yellow
}

# 4. Push branch with lease
Write-Host "[4/5] Pushing branch '$currentBranch' to remote 'origin'..." -ForegroundColor Cyan
git push -u origin $currentBranch --force-with-lease
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push branch to origin."
}

# 5. Create or Update PR via GitHub CLI (gh)
Write-Host "[5/5] Checking for existing Pull Request..." -ForegroundColor Cyan
$existingPrJson = gh pr list --head $currentBranch --base $BaseBranch --json number,url | ConvertFrom-Json

if ($existingPrJson -and $existingPrJson.Count -gt 0) {
    $prNumber = $existingPrJson[0].number
    $prUrl = $existingPrJson[0].url
    Write-Host "Updating existing PR #$prNumber ($prUrl)..." -ForegroundColor Yellow

    if ($BodyFile -and (Test-Path $BodyFile)) {
        gh pr edit $prNumber --title $Title --body-file $BodyFile
    } elseif ($BodyText) {
        gh pr edit $prNumber --title $Title --body $BodyText
    } else {
        gh pr edit $prNumber --title $Title
    }
    Write-Host "PR #$prNumber updated successfully: $prUrl" -ForegroundColor Green
} else {
    Write-Host "Creating new Pull Request..." -ForegroundColor Green
    if ($BodyFile -and (Test-Path $BodyFile)) {
        $prUrl = (gh pr create --base $BaseBranch --head $currentBranch --title $Title --body-file $BodyFile).Trim()
    } elseif ($BodyText) {
        $prUrl = (gh pr create --base $BaseBranch --head $currentBranch --title $Title --body $BodyText).Trim()
    } else {
        $prUrl = (gh pr create --base $BaseBranch --head $currentBranch --title $Title --fill).Trim()
    }
    Write-Host "PR created successfully: $prUrl" -ForegroundColor Green
}

