$ErrorActionPreference = "Stop"

$inputPath = "src/styles/index.css"
$moduleDir = "src/styles/modules"

if (-not (Test-Path -LiteralPath $inputPath)) {
  throw "Missing $inputPath"
}

New-Item -ItemType Directory -Force -Path $moduleDir | Out-Null

$css = Get-Content -LiteralPath $inputPath -Raw
$matches = [regex]::Matches($css, "(?ms)/\*\s*Source:\s*([^*]+?)\s*\*/.*?(?=(?:/\*\s*Source:\s*[^*]+?\s*\*/)|\z)")

if ($matches.Count -eq 0) {
  throw "No Source markers found in $inputPath"
}

$groups = [ordered]@{
  "core.css" = @("accessibility patch", "main.css")
  "layout.css" = @("layout.css", "divider.css")
  "typography.css" = @("typography.css", "heading.css", "button.css")
  "media.css" = @("canvas.css", "media.css", "media-grid.css", "media-caption.css", "media-effects.css", "random-gallery.css", "marquee.css", "slider.css", "skeleton.css", "lightbox.css", "proximity.css")
  "components.css" = @("site-header.css", "footer.css", "hero.css", "hero-skill-marquee.css", "awfulface.css", "project.css", "project-responsibilities.css", "resume.css", "artifact-reader.css")
  "cases-jestei.css" = @("cleanup stage 03 - Jestei chapter system")
  "cases-generic.css" = @("case chapter frames")
  "policy-book.css" = @("policy-book.css")
}

$bucket = @{}
foreach ($key in $groups.Keys) {
  $bucket[$key] = New-Object System.Collections.Generic.List[string]
}

$unknown = New-Object System.Collections.Generic.List[string]

foreach ($match in $matches) {
  $name = $match.Groups[1].Value.Trim()
  $block = $match.Value.Trim()

  $target = $null
  foreach ($file in $groups.Keys) {
    if ($groups[$file] -contains $name) {
      $target = $file
      break
    }
  }

  if ($null -eq $target) {
    $unknown.Add($block)
  } else {
    $bucket[$target].Add($block)
  }
}

foreach ($file in $groups.Keys) {
  $content = ($bucket[$file] -join "`n`n").Trim() + "`n"
  Set-Content -LiteralPath (Join-Path $moduleDir $file) -Value $content -Encoding utf8
}

if ($unknown.Count -gt 0) {
  Set-Content -LiteralPath (Join-Path $moduleDir "unassigned.css") -Value (($unknown -join "`n`n").Trim() + "`n") -Encoding utf8
}

$imports = New-Object System.Collections.Generic.List[string]
foreach ($file in $groups.Keys) {
  $imports.Add('@import "./modules/' + $file + '";')
}
if ($unknown.Count -gt 0) {
  $imports.Add('@import "./modules/unassigned.css";')
}

Set-Content -LiteralPath $inputPath -Value (($imports -join "`n") + "`n") -Encoding utf8

Write-Host "stage 40 complete"
git status --short
