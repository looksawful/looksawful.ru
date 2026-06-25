$ErrorActionPreference = 'Stop'
$branch = (git branch --show-current).Trim()
if ($branch -eq "prod") { throw "Do not run cleanup lab move on prod. Switch to dev or a work branch first." }

function Move-LabPath {
  param(
    [Parameter(Mandatory = $true)][string]$From,
    [Parameter(Mandatory = $true)][string]$To
  )

  if (-not (Test-Path -LiteralPath $From)) {
    Write-Host "skip missing: $From"
    return
  }

  $parent = Split-Path -Parent $To
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  Write-Host "move: $From -> $To"
  git mv $From $To
}

Move-LabPath -From "src/visuals/dom/showcase-scroll-row.js" -To "src/_lab/inactive-visuals/src/visuals/dom/showcase-scroll-row.js"
Move-LabPath -From "src/visuals/dom/showcase-media-scenes.js" -To "src/_lab/inactive-visuals/src/visuals/dom/showcase-media-scenes.js"
Move-LabPath -From "src/visuals/canvas/photo-loop" -To "src/_lab/inactive-visuals/src/visuals/canvas/photo-loop"
Move-LabPath -From "src/visuals/canvas/showcase-carousel" -To "src/_lab/inactive-visuals/src/visuals/canvas/showcase-carousel"
Move-LabPath -From "src/visuals/canvas/diagonal-loop" -To "src/_lab/inactive-visuals/src/visuals/canvas/diagonal-loop"
Move-LabPath -From "src/visuals/canvas/masonry" -To "src/_lab/inactive-visuals/src/visuals/canvas/masonry"
Move-LabPath -From "src/components/showcase-task-previews/newsletter-canvas.js" -To "src/_lab/inactive-visuals/src/components/showcase-task-previews/newsletter-canvas.js"
Move-LabPath -From "src/components/showcase-toc.js" -To "src/_lab/retired-runtime/src/components/showcase-toc.js"
Move-LabPath -From "src/components/media-slider-dots-proximity.js" -To "src/_lab/retired-runtime/src/components/media-slider-dots-proximity.js"
Move-LabPath -From "src/visuals/dom/showcase-toc.js" -To "src/_lab/retired-runtime/src/visuals/dom/showcase-toc.js"
Move-LabPath -From "src/visuals/shared/observer.js" -To "src/_lab/retired-runtime/src/visuals/shared/observer.js"
Move-LabPath -From "src/visuals/dom/demo-shell.js" -To "src/_lab/retired-runtime/src/visuals/dom/demo-shell.js"
Move-LabPath -From "src/components/showcase-sync-side-card-height.js" -To "src/_lab/retired-runtime/src/components/showcase-sync-side-card-height.js"
Move-LabPath -From "src/components/showcase-sync-graphic-side-layouts.js" -To "src/_lab/retired-runtime/src/components/showcase-sync-graphic-side-layouts.js"
Move-LabPath -From "src/components/showcase-gallery-aspect-fit.js" -To "src/_lab/retired-runtime/src/components/showcase-gallery-aspect-fit.js"

git status --short
Write-Host ""
Write-Host "Review the move, then run:"
Write-Host "git add -A && git commit -m \"chore: move inactive modules to lab archive\""
