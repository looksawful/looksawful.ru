$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "_archive\source-visuals-$stamp"
$reportDir = "_reports"
New-Item -ItemType Directory -Force -Path $archiveRoot, $reportDir | Out-Null

$sourceExtensions = @(".html", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json")
$skipPattern = "\\(\.git|node_modules|dist|build|\.next|\.vite|coverage|tmp|temp|_archive|src\\_lab)\\"

function Get-SourceTextExcluding {
  param([Parameter(Mandatory = $true)][string]$Candidate)

  $candidateFull = ""
  if (Test-Path -LiteralPath $Candidate) {
    $candidateFull = (Resolve-Path -LiteralPath $Candidate).Path
  }

  $sb = New-Object System.Text.StringBuilder
  Get-ChildItem -Recurse -File | Where-Object {
    $sourceExtensions -contains $_.Extension.ToLowerInvariant() -and
    $_.FullName -notmatch $skipPattern -and
    ($candidateFull -eq "" -or -not $_.FullName.StartsWith($candidateFull, [System.StringComparison]::OrdinalIgnoreCase))
  } | ForEach-Object {
    [void]$sb.AppendLine((Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue))
  }

  return $sb.ToString().ToLowerInvariant()
}

function Test-SourceReference {
  param([Parameter(Mandatory = $true)][string]$Candidate)

  $slash = $Candidate.Replace("\", "/")
  $name = Split-Path -Leaf $Candidate
  $haystack = Get-SourceTextExcluding -Candidate $Candidate

  $variants = @(
    $slash,
    "./$name",
    "../$name",
    "/$slash"
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
  "src/visuals/canvas/photo-loop",
  "src/visuals/canvas/showcase-carousel",
  "src/visuals/canvas/diagonal-loop",
  "src/visuals/canvas/masonry",
  "src/components/showcase-task-previews/newsletter-canvas.js",
  "src/visuals/dom/showcase-scroll-row.js",
  "src/visuals/dom/showcase-media-scenes.js",
  "src/components/media-slider-dots-proximity.js",
  "src/visuals/dom/showcase-toc.js",
  "src/visuals/shared/observer.js",
  "src/visuals/dom/demo-shell.js"
)

$report = New-Object System.Collections.Generic.List[string]
$report.Add("# source visual archive report")
$report.Add("")
$report.Add("generated: $stamp")
$report.Add("")

foreach ($candidate in $candidates) {
  if (-not (Test-Path -LiteralPath $candidate)) {
    $report.Add("missing: $candidate")
    continue
  }

  if (Test-SourceReference -Candidate $candidate) {
    $report.Add("skip referenced: $candidate")
    continue
  }

  Move-ToArchive -Path $candidate
  $report.Add("archived: $candidate -> $archiveRoot\$candidate")
}

$reportPath = Join-Path $reportDir "stage38-source-visuals-$stamp.md"
$report | Set-Content -LiteralPath $reportPath -Encoding utf8
git add $reportPath

Write-Host "stage 38 complete"
Write-Host "report: $reportPath"
git status --short
