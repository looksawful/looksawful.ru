$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "_archive\public-assets-$stamp"
$reportDir = "_reports"
New-Item -ItemType Directory -Force -Path $archiveRoot, $reportDir | Out-Null

$sourceExtensions = @(".html", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md")
$skipPattern = "\\(\.git|node_modules|dist|build|\.next|\.vite|coverage|tmp|temp|_archive|src\\_lab)\\"

$sourceText = New-Object System.Text.StringBuilder
Get-ChildItem -Recurse -File | Where-Object {
  $sourceExtensions -contains $_.Extension.ToLowerInvariant() -and
  $_.FullName -notmatch $skipPattern
} | ForEach-Object {
  [void]$sourceText.AppendLine("FILE: " + $_.FullName)
  [void]$sourceText.AppendLine((Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue))
}

$haystack = $sourceText.ToString().ToLowerInvariant()

function Test-Reference {
  param([Parameter(Mandatory = $true)][string]$Path)

  $slash = $Path.Replace("\", "/")
  $withoutPublic = $slash -replace "^public/", ""
  $variants = @(
    $slash,
    "/" + $withoutPublic,
    $withoutPublic
  ) | Select-Object -Unique

  foreach ($variant in $variants) {
    if ($haystack.Contains($variant.ToLowerInvariant())) {
      return $true
    }
  }

  return $false
}

function Move-ToArchive {
  param([Parameter(Mandatory = $true)][string]$Path)

  $destination = Join-Path $archiveRoot $Path
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null

  git ls-files --error-unmatch -- $Path *> $null
  if ($LASTEXITCODE -eq 0) {
    git mv $Path $destination
  } else {
    Move-Item -LiteralPath $Path -Destination $destination -Force
    git add $destination
  }
}

$candidates = @(
  "public/assets/jestei/galleries",
  "public/assets/styx",
  "public/assets/lyve",
  "public/assets/logo-primary.svg",
  "public/assets/logo-secondary.svg",
  "public/Union.svg",
  "public/Vector.svg"
)

$report = New-Object System.Collections.Generic.List[string]
$report.Add("# public asset archive report")
$report.Add("")
$report.Add("generated: $stamp")
$report.Add("")

foreach ($candidate in $candidates) {
  if (-not (Test-Path -LiteralPath $candidate)) {
    $report.Add("missing: $candidate")
    continue
  }

  if (Test-Reference -Path $candidate) {
    $report.Add("skip referenced: $candidate")
    continue
  }

  Move-ToArchive -Path $candidate
  $report.Add("archived: $candidate -> $archiveRoot\$candidate")
}

$reportPath = Join-Path $reportDir "stage37-public-assets-$stamp.md"
$report | Set-Content -LiteralPath $reportPath -Encoding utf8
git add $reportPath

Write-Host "stage 37 complete"
Write-Host "report: $reportPath"
git status --short
