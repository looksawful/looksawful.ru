[CmdletBinding()]
param(
  [string]$ProjectRoot = "",
  [switch]$Apply,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDirectory = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = (
    Resolve-Path -LiteralPath (
      Join-Path -Path $ScriptDirectory -ChildPath "..\.."
    )
  ).Path
}
else {
  $ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
}

Push-Location $ProjectRoot

try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not available in PATH."
  }

  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is not available in PATH."
  }

  Write-Host "Project root: $ProjectRoot"
  Write-Host "1/6 install check"

  $InstallArguments = @(
    ".\tools\media\install-media-system.mjs",
    "--root",
    $ProjectRoot
  )

  if ($Apply) {
    $InstallArguments += "--apply"
  }

  & node @InstallArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Media System install check failed."
  }

  Write-Host "2/6 source bootstrap check"
  & node ".\tools\media\bootstrap-media-sources.mjs" "--root" $ProjectRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Media source bootstrap check failed."
  }

  if (-not $Apply) {
    Write-Host "Dry run complete. Run again with -Apply."
    return
  }

  Write-Host "3/6 tests"
  & node --test ".\tools\media\tests\media-system-core.test.mjs"
  if ($LASTEXITCODE -ne 0) {
    throw "Media System tests failed."
  }

  Write-Host "4/6 bootstrap and prepare"
  & node ".\tools\media\bootstrap-media-sources.mjs" "--root" $ProjectRoot "--apply"
  if ($LASTEXITCODE -ne 0) {
    throw "Canonical media bootstrap failed."
  }

  & node ".\tools\media\prepare-media.mjs" "--root" $ProjectRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Media preparation failed."
  }

  Write-Host "5/6 annotate and verify"
  & node ".\tools\media\annotate-media-items.mjs" "--root" $ProjectRoot "--apply"
  if ($LASTEXITCODE -ne 0) {
    throw "Media Item annotation failed."
  }

  & node ".\tools\media\verify-media-system.mjs" "--root" $ProjectRoot "--mode" "build"
  if ($LASTEXITCODE -ne 0) {
    throw "Media verification failed."
  }

  if (-not $SkipBuild) {
    Write-Host "6/6 build"
    & npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Build failed."
    }
  }
  else {
    Write-Host "6/6 build skipped"
  }

  Write-Host "Media System installed."
}
finally {
  Pop-Location
}
