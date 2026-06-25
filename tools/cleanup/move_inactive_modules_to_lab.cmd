@echo off
setlocal
for /f "delims=" %%b in ('git branch --show-current') do set BRANCH=%%b
if "%BRANCH%"=="prod" (
  echo Do not run cleanup lab move on prod. Switch to dev or a work branch first.
  exit /b 1
)

if exist "src/visuals/dom/showcase-scroll-row.js" (
  mkdir "src/_lab/inactive-visuals/src/visuals/dom" 2>nul
  git mv "src/visuals/dom/showcase-scroll-row.js" "src/_lab/inactive-visuals/src/visuals/dom/showcase-scroll-row.js"
) else (
  echo skip missing: src/visuals/dom/showcase-scroll-row.js
)
if exist "src/visuals/dom/showcase-media-scenes.js" (
  mkdir "src/_lab/inactive-visuals/src/visuals/dom" 2>nul
  git mv "src/visuals/dom/showcase-media-scenes.js" "src/_lab/inactive-visuals/src/visuals/dom/showcase-media-scenes.js"
) else (
  echo skip missing: src/visuals/dom/showcase-media-scenes.js
)
if exist "src/visuals/canvas/photo-loop" (
  mkdir "src/_lab/inactive-visuals/src/visuals/canvas" 2>nul
  git mv "src/visuals/canvas/photo-loop" "src/_lab/inactive-visuals/src/visuals/canvas/photo-loop"
) else (
  echo skip missing: src/visuals/canvas/photo-loop
)
if exist "src/visuals/canvas/showcase-carousel" (
  mkdir "src/_lab/inactive-visuals/src/visuals/canvas" 2>nul
  git mv "src/visuals/canvas/showcase-carousel" "src/_lab/inactive-visuals/src/visuals/canvas/showcase-carousel"
) else (
  echo skip missing: src/visuals/canvas/showcase-carousel
)
if exist "src/visuals/canvas/diagonal-loop" (
  mkdir "src/_lab/inactive-visuals/src/visuals/canvas" 2>nul
  git mv "src/visuals/canvas/diagonal-loop" "src/_lab/inactive-visuals/src/visuals/canvas/diagonal-loop"
) else (
  echo skip missing: src/visuals/canvas/diagonal-loop
)
if exist "src/visuals/canvas/masonry" (
  mkdir "src/_lab/inactive-visuals/src/visuals/canvas" 2>nul
  git mv "src/visuals/canvas/masonry" "src/_lab/inactive-visuals/src/visuals/canvas/masonry"
) else (
  echo skip missing: src/visuals/canvas/masonry
)
if exist "src/components/showcase-task-previews/newsletter-canvas.js" (
  mkdir "src/_lab/inactive-visuals/src/components/showcase-task-previews" 2>nul
  git mv "src/components/showcase-task-previews/newsletter-canvas.js" "src/_lab/inactive-visuals/src/components/showcase-task-previews/newsletter-canvas.js"
) else (
  echo skip missing: src/components/showcase-task-previews/newsletter-canvas.js
)
if exist "src/components/showcase-toc.js" (
  mkdir "src/_lab/retired-runtime/src/components" 2>nul
  git mv "src/components/showcase-toc.js" "src/_lab/retired-runtime/src/components/showcase-toc.js"
) else (
  echo skip missing: src/components/showcase-toc.js
)
if exist "src/components/media-slider-dots-proximity.js" (
  mkdir "src/_lab/retired-runtime/src/components" 2>nul
  git mv "src/components/media-slider-dots-proximity.js" "src/_lab/retired-runtime/src/components/media-slider-dots-proximity.js"
) else (
  echo skip missing: src/components/media-slider-dots-proximity.js
)
if exist "src/visuals/dom/showcase-toc.js" (
  mkdir "src/_lab/retired-runtime/src/visuals/dom" 2>nul
  git mv "src/visuals/dom/showcase-toc.js" "src/_lab/retired-runtime/src/visuals/dom/showcase-toc.js"
) else (
  echo skip missing: src/visuals/dom/showcase-toc.js
)
if exist "src/visuals/shared/observer.js" (
  mkdir "src/_lab/retired-runtime/src/visuals/shared" 2>nul
  git mv "src/visuals/shared/observer.js" "src/_lab/retired-runtime/src/visuals/shared/observer.js"
) else (
  echo skip missing: src/visuals/shared/observer.js
)
if exist "src/visuals/dom/demo-shell.js" (
  mkdir "src/_lab/retired-runtime/src/visuals/dom" 2>nul
  git mv "src/visuals/dom/demo-shell.js" "src/_lab/retired-runtime/src/visuals/dom/demo-shell.js"
) else (
  echo skip missing: src/visuals/dom/demo-shell.js
)
if exist "src/components/showcase-sync-side-card-height.js" (
  mkdir "src/_lab/retired-runtime/src/components" 2>nul
  git mv "src/components/showcase-sync-side-card-height.js" "src/_lab/retired-runtime/src/components/showcase-sync-side-card-height.js"
) else (
  echo skip missing: src/components/showcase-sync-side-card-height.js
)
if exist "src/components/showcase-sync-graphic-side-layouts.js" (
  mkdir "src/_lab/retired-runtime/src/components" 2>nul
  git mv "src/components/showcase-sync-graphic-side-layouts.js" "src/_lab/retired-runtime/src/components/showcase-sync-graphic-side-layouts.js"
) else (
  echo skip missing: src/components/showcase-sync-graphic-side-layouts.js
)
if exist "src/components/showcase-gallery-aspect-fit.js" (
  mkdir "src/_lab/retired-runtime/src/components" 2>nul
  git mv "src/components/showcase-gallery-aspect-fit.js" "src/_lab/retired-runtime/src/components/showcase-gallery-aspect-fit.js"
) else (
  echo skip missing: src/components/showcase-gallery-aspect-fit.js
)

git status --short
echo.
echo Review the move, then run:
echo git add -A ^&^& git commit -m "chore: move inactive modules to lab archive"
