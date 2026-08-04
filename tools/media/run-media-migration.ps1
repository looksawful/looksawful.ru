[CmdletBinding()]
param(
  [string]$ProjectRoot = "",
  [string]$LyveRoot = $env:LYVE_MEDIA_ROOT,
  [switch]$Apply,
  [ValidateRange(1, 100)]
  [int]$Quality = 90
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

$MediaToolsRoot = Join-Path -Path $ProjectRoot -ChildPath "tools\media"
$TestsPath = Join-Path -Path $MediaToolsRoot -ChildPath "tests\media-core.test.mjs"
$MigrationScriptPath = Join-Path -Path $MediaToolsRoot -ChildPath "migrate-media.mjs"
$VerificationScriptPath = Join-Path -Path $MediaToolsRoot -ChildPath "verify-media.mjs"
$PackagePath = Join-Path -Path $ProjectRoot -ChildPath "package.json"

$RequiredPaths = @(
  $TestsPath,
  $MigrationScriptPath,
  $VerificationScriptPath,
  $PackagePath
)

foreach ($RequiredPath in $RequiredPaths) {
  if (-not (Test-Path -LiteralPath $RequiredPath)) {
    throw "Required migration file was not found: $RequiredPath"
  }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not available in PATH."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available in PATH."
}

if (
  [string]::IsNullOrWhiteSpace($LyveRoot) -and
  (Test-Path -LiteralPath "D:\inwork\LYVE\Layouts")
) {
  $LyveRoot = "D:\inwork\LYVE\Layouts"
}

if (
  -not [string]::IsNullOrWhiteSpace($LyveRoot) -and
  -not (Test-Path -LiteralPath $LyveRoot)
) {
  throw "Lyve media root was not found: $LyveRoot"
}

Write-Host "Project root: $ProjectRoot"

Push-Location $ProjectRoot

try {
  Write-Host "1/4 media tests"
  & node --test $TestsPath
  if ($LASTEXITCODE -ne 0) {
    throw "Media tests failed."
  }

  $CommonArguments = @(
    $MigrationScriptPath,
    "--root",
    $ProjectRoot,
    "--quality",
    [string]$Quality
  )

  if (-not [string]::IsNullOrWhiteSpace($LyveRoot)) {
    $CommonArguments += @(
      "--lyve-root",
      $LyveRoot
    )
  }

  Write-Host "2/4 dry run"
  & node @CommonArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Dry run failed. Nothing was changed."
  }

  if (-not $Apply) {
    Write-Host "Dry run complete. Run again with -Apply to copy and reconnect files."
    return
  }

  Write-Host "3/4 migration"
  & node @CommonArguments --apply
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed."
  }

  Write-Host "4/4 verification and build"
  & node $VerificationScriptPath --root $ProjectRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Media verification failed."
  }

  & npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Vite build failed."
  }

  Write-Host "Media migration completed successfully."
}
finally {
  Pop-Location
}
