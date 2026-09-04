param(
  [string]$Repo = "looksawful/looksawful.ru",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$apiVersion = "2026-03-10"

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install GitHub CLI first: winget install --id GitHub.cli"
  }
}

function Invoke-GhGet([string]$Endpoint) {
  $raw = & gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $apiVersion" $Endpoint
  if ($LASTEXITCODE -ne 0) { throw "gh api GET failed: $Endpoint" }
  if ([string]::IsNullOrWhiteSpace(($raw -join "`n"))) { return $null }
  return (($raw -join "`n") | ConvertFrom-Json)
}

function Invoke-GhJson([string]$Method, [string]$Endpoint, $Payload) {
  $json = $Payload | ConvertTo-Json -Depth 32 -Compress
  $raw = $json | & gh api --method $Method -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $apiVersion" $Endpoint --input -
  if ($LASTEXITCODE -ne 0) { throw "gh api $Method failed: $Endpoint" }
  if ([string]::IsNullOrWhiteSpace(($raw -join "`n"))) { return $null }
  return (($raw -join "`n") | ConvertFrom-Json)
}

function Upsert-Ruleset([string]$Name, $Payload) {
  $rulesets = @(Invoke-GhGet "repos/$Repo/rulesets?includes_parents=false")
  $existing = $rulesets | Where-Object { $_.name -eq $Name } | Select-Object -First 1

  if (-not $Apply) {
    if ($existing) {
      Write-Host "WOULD UPDATE ruleset '$Name' (id=$($existing.id))"
    } else {
      Write-Host "WOULD CREATE ruleset '$Name'"
    }
    return
  }

  if ($existing) {
    [void](Invoke-GhJson "PUT" "repos/$Repo/rulesets/$($existing.id)" $Payload)
    Write-Host "UPDATED ruleset '$Name'"
  } else {
    [void](Invoke-GhJson "POST" "repos/$Repo/rulesets" $Payload)
    Write-Host "CREATED ruleset '$Name'"
  }
}

Assert-Command "gh"
& gh auth status
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not authenticated. Run: gh auth login" }

$repoState = Invoke-GhGet "repos/$Repo"
if (-not $repoState.permissions.admin) {
  throw "The authenticated GitHub account does not have admin permission for $Repo."
}

$repoSettings = [ordered]@{
  default_branch         = "prod"
  delete_branch_on_merge = $false
  allow_merge_commit     = $true
  allow_squash_merge     = $true
  allow_rebase_merge     = $true
  allow_auto_merge       = $false
  allow_update_branch    = $false
}

$prodRuleset = [ordered]@{
  name        = "prod-minimal-protection"
  target      = "branch"
  enforcement = "active"
  bypass_actors = @()
  conditions = @{
    ref_name = @{
      include = @("refs/heads/prod")
      exclude = @()
    }
  }
  rules = @(
    @{ type = "deletion" },
    @{ type = "non_fast_forward" },
    @{
      type = "pull_request"
      parameters = @{
        allowed_merge_methods             = @("merge")
        dismiss_stale_reviews_on_push     = $false
        require_code_owner_review         = $false
        require_last_push_approval        = $false
        required_approving_review_count   = 0
        required_review_thread_resolution = $false
      }
    },
    @{
      type = "required_status_checks"
      parameters = @{
        do_not_enforce_on_create             = $false
        required_status_checks               = @(@{ context = "verify" })
        strict_required_status_checks_policy = $false
      }
    }
  )
}

$devRuleset = [ordered]@{
  name        = "dev-safety"
  target      = "branch"
  enforcement = "active"
  bypass_actors = @()
  conditions = @{
    ref_name = @{
      include = @("refs/heads/dev")
      exclude = @()
    }
  }
  rules = @(
    @{ type = "deletion" },
    @{ type = "non_fast_forward" }
  )
}

Write-Host "Repository: $Repo"
Write-Host "Current default branch: $($repoState.default_branch)"
Write-Host "Plan:"
Write-Host "  prod: PR-only, merge commits, required check 'verify', no approvals, no strict up-to-date, no force-push/delete"
Write-Host "  dev: direct fast-forward pushes allowed, no force-push/delete"
Write-Host "  global auto-delete merged head branches: OFF"
Write-Host "  CodeQL/Lighthouse/full E2E remain non-blocking"

if (-not $Apply) {
  Write-Host "DRY RUN ONLY. Re-run with -Apply to write repository settings."
} else {
  [void](Invoke-GhJson "PATCH" "repos/$Repo" $repoSettings)
  Write-Host "UPDATED repository merge/default-branch settings"
}

Upsert-Ruleset "prod-minimal-protection" $prodRuleset
Upsert-Ruleset "dev-safety" $devRuleset

if ($Apply) {
  $finalRepo = Invoke-GhGet "repos/$Repo"
  $finalRulesets = @(Invoke-GhGet "repos/$Repo/rulesets?includes_parents=false")
  $prodBranch = Invoke-GhGet "repos/$Repo/branches/prod"
  $devBranch = Invoke-GhGet "repos/$Repo/branches/dev"

  if ($finalRepo.default_branch -ne "prod") { throw "Verification failed: default branch is not prod." }
  if ($finalRepo.delete_branch_on_merge) { throw "Verification failed: automatic head-branch deletion is enabled." }
  if (-not $finalRepo.allow_merge_commit) { throw "Verification failed: merge commits are disabled." }
  if (-not ($finalRulesets | Where-Object { $_.name -eq "prod-minimal-protection" -and $_.enforcement -eq "active" })) {
    throw "Verification failed: prod-minimal-protection ruleset is not active."
  }
  if (-not ($finalRulesets | Where-Object { $_.name -eq "dev-safety" -and $_.enforcement -eq "active" })) {
    throw "Verification failed: dev-safety ruleset is not active."
  }

  Write-Host "VERIFIED"
  Write-Host "  default branch: $($finalRepo.default_branch)"
  Write-Host "  prod protected: $($prodBranch.protected)"
  Write-Host "  dev protected: $($devBranch.protected)"
  Write-Host "  active rulesets: $((($finalRulesets | Where-Object enforcement -eq 'active').name) -join ', ')"
}
