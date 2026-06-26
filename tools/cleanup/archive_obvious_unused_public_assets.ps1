$ErrorActionPreference = "Stop"

$branch = (git branch --show-current).Trim()
if ($branch -eq "prod") {
  throw "Do not run this cleanup on prod. Run it on dev."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = Join-Path "_archive\unused-public-assets" $stamp
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$report = Join-Path $archiveRoot "archive-report.txt"
"unused public assets archive" | Set-Content -LiteralPath $report -Encoding utf8
("branch: " + $branch) | Add-Content -LiteralPath $report -Encoding utf8
("created: " + $stamp) | Add-Content -LiteralPath $report -Encoding utf8
"" | Add-Content -LiteralPath $report -Encoding utf8

$codeFiles = Get-ChildItem -File -Recurse -Include *.html,*.css,*.js,*.mjs,*.cjs,*.ts,*.tsx,*.jsx,*.json,*.md | Where-Object {
  $_.FullName -notmatch "\\.git\\|\\node_modules\\|\\dist\\|\\build\\|\\.next\\|\\.vite\\|\\coverage\\|\\_archive\\"
}

function Test-ActiveReference {
  param(
    [Parameter(Mandatory = $true)][string]$WebPrefix
  )

  $hit = Select-String -Path $codeFiles.FullName -SimpleMatch -Pattern $WebPrefix -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $hit
}

function Test-GitTrackedPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $tracked = git ls-files -- $Path
  return -not [string]::IsNullOrWhiteSpace(($tracked | Out-String).Trim())
}

function Move-ToArchive {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$WebPrefix
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    ("skip missing: " + $Path) | Add-Content -LiteralPath $report -Encoding utf8
    return
  }

  if (Test-ActiveReference -WebPrefix $WebPrefix) {
    ("skip referenced: " + $Path + " | " + $WebPrefix) | Add-Content -LiteralPath $report -Encoding utf8
    return
  }

  $target = Join-Path $archiveRoot $Path
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null

  if (Test-GitTrackedPath -Path $Path) {
    git mv $Path $target
    ("git mv: " + $Path + " -> " + $target) | Add-Content -LiteralPath $report -Encoding utf8
  } else {
    Move-Item -LiteralPath $Path -Destination $target -Force
    git add $target
    ("move untracked: " + $Path + " -> " + $target) | Add-Content -LiteralPath $report -Encoding utf8
  }
}

$items = @(
  @{ Path = "public/assets/jestei/galleries"; Web = "/assets/jestei/galleries/" },
  @{ Path = "public/assets/lyve"; Web = "/assets/lyve/" },
  @{ Path = "public/assets/logo-primary.svg"; Web = "/assets/logo-primary.svg" },
  @{ Path = "public/assets/logo-secondary.svg"; Web = "/assets/logo-secondary.svg" },
  @{ Path = "public/Union.svg"; Web = "/Union.svg" },
  @{ Path = "public/Vector.svg"; Web = "/Vector.svg" }
)

foreach ($item in $items) {
  Move-ToArchive -Path $item.Path -WebPrefix $item.Web
}

git add $archiveRoot

"" | Add-Content -LiteralPath $report -Encoding utf8
"status after archive:" | Add-Content -LiteralPath $report -Encoding utf8
(git status --short | Out-String).TrimEnd() | Add-Content -LiteralPath $report -Encoding utf8

git status --short
Write-Host ""
Write-Host "Report: $report"
Write-Host "Then run:"
Write-Host 'git add -A && git commit -m "chore: archive obvious unused public assets"'
