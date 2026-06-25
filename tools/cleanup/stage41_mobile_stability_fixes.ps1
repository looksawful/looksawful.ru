$ErrorActionPreference = "Stop"

$moduleDir = "src/styles/modules"
$indexPath = "src/styles/index.css"
$mobilePath = Join-Path $moduleDir "mobile-fixes.css"

if (-not (Test-Path -LiteralPath $moduleDir)) {
  New-Item -ItemType Directory -Force -Path $moduleDir | Out-Null
}

$css = @'
/* mobile stability fixes */

@media (max-width: 48rem) {
  #project-styx > .project__header,
  #project-shootings > .project__header {
    padding: var(--component-gap);
    border: var(--line);
    border-radius: var(--r);
    background: var(--white);
    overflow: hidden;
  }

  .case-chapter-frame,
  .jestei-chapter-frame {
    border: var(--line);
    border-radius: var(--r);
    background: var(--white);
    overflow: hidden;
  }

  .case-chapter-frame + .case-chapter-frame,
  .jestei-chapter-frame + .jestei-chapter-frame {
    margin-block-start: var(--gap);
  }

  .case-chapter-hero {
    padding: var(--component-gap) 0 var(--component-gap);
  }

  .case-chapter-hero__title {
    padding-inline: var(--component-gap);
    white-space: normal;
  }

  .case-chapter-hero__subtitle {
    max-inline-size: min(100%, 32rem);
    padding-inline: var(--component-gap);
    text-align: left;
  }

  .case-chapter-frame__body,
  .case-chapter-panel {
    padding: var(--component-gap);
  }

  .case-chapter-frame__control {
    padding: 0 var(--component-gap) var(--component-gap);
  }

  .case-chapter-hero__media--scanography-videos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(0.75rem, 3vw, 1.25rem);
  }

  .media-row > .media-slider,
  .media-row > .media,
  .media-row > .media-two,
  .media-row > .media-three,
  .media-row > .media-quad,
  .media-row > .media-six,
  .media-row > .media-eight,
  .media-row > .media-banner {
    min-inline-size: 0;
  }
}

@media (max-width: 30rem) {
  .case-chapter-hero__media--scanography-videos {
    grid-template-columns: minmax(0, 1fr);
  }

  .case-photo-orbit {
    min-block-size: clamp(14rem, 72vw, 21rem);
  }
}
'@

Set-Content -LiteralPath $mobilePath -Value $css -Encoding utf8

if (-not (Test-Path -LiteralPath $indexPath)) {
  Set-Content -LiteralPath $indexPath -Value '@import "./modules/mobile-fixes.css";' -Encoding utf8
} else {
  $index = Get-Content -LiteralPath $indexPath -Raw
  if ($index -notmatch [regex]::Escape('@import "./modules/mobile-fixes.css";')) {
    Add-Content -LiteralPath $indexPath -Value '@import "./modules/mobile-fixes.css";'
  }
}

Write-Host "stage 41 complete"
git status --short
