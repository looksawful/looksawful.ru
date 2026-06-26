param(
  [switch]$ArchiveUnreferenced
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = "_reports"
$archiveRoot = "_archive\duplicate-public-assets-$stamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$assetExtensions = @(".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".mp4", ".webm")
$sourceExtensions = @(".html", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md")
$skipPattern = "\\(\.git|node_modules|dist|build|\.next|\.vite|coverage|tmp|temp|_archive|src\\_lab)\\"

$sourceText = New-Object System.Text.StringBuilder
Get-ChildItem -Recurse -File | Where-Object {
  $sourceExtensions -contains $_.Extension.ToLowerInvariant() -and
  $_.FullName -notmatch $skipPattern
} | ForEach-Object {
  [void]$sourceText.AppendLine((Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue))
}
$haystack = $sourceText.ToString().ToLowerInvariant()

function Get-RelativePath {
  param([Parameter(Mandatory = $true)][System.IO.FileInfo]$File)
  return $File.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
}

function Test-AssetReference {
  param([Parameter(Mandatory = $true)][string]$RelativePath)

  $withoutPublic = $RelativePath -replace "^public/", ""
  $variants = @($RelativePath, "/" + $withoutPublic, $withoutPublic) | Select-Object -Unique

  foreach ($variant in $variants) {
    if ($haystack.Contains($variant.ToLowerInvariant())) {
      return $true
    }
  }

  return $false
}

$assets = Get-ChildItem "public" -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
  $assetExtensions -contains $_.Extension.ToLowerInvariant()
}

$groups = $assets | Group-Object {
  (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
} | Where-Object { $_.Count -gt 1 }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# exact duplicate public assets")
$lines.Add("")
$lines.Add("generated: $stamp")
$lines.Add("archive mode: $ArchiveUnreferenced")
$lines.Add("")

if ($ArchiveUnreferenced) {
  New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null
}

foreach ($group in $groups) {
  $lines.Add("## sha256 " + $group.Name)
  $files = $group.Group | Sort-Object Length, FullName
  $keeper = $files[0]
  $keeperRel = Get-RelativePath -File $keeper
  $lines.Add("keep candidate: $keeperRel")
  foreach ($file in $files) {
    $rel = Get-RelativePath -File $file
    $isReferenced = Test-AssetReference -RelativePath $rel
    $lines.Add("- " + $rel + " | " + $file.Length + " bytes | referenced=" + $isReferenced)

    if ($ArchiveUnreferenced -and -not $isReferenced -and $rel -ne $keeperRel) {
      $dst = Join-Path $archiveRoot $rel
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
      git ls-files --error-unmatch -- $rel *> $null
      if ($LASTEXITCODE -eq 0) {
        git mv $rel $dst
      } else {
        Move-Item -LiteralPath $rel -Destination $dst -Force
        git add $dst
      }
      $lines.Add("  archived unreferenced duplicate -> $dst")
    }
  }
  $lines.Add("")
}

$reportPath = Join-Path $reportDir "stage39-exact-duplicates-$stamp.md"
$lines | Set-Content -LiteralPath $reportPath -Encoding utf8
git add $reportPath

Write-Host "stage 39 complete"
Write-Host "report: $reportPath"
git status --short
