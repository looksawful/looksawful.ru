param(
  [switch]$SkipDeploy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$configPath = Join-Path $PSScriptRoot "wrangler.jsonc"

function Convert-SecureToPlain {
  param([Parameter(Mandatory = $true)][Security.SecureString]$Value)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Get-Sha256Hex {
  param([Parameter(Mandatory = $true)][string]$Value)

  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [Text.Encoding]::UTF8.GetBytes($Value)
    return ([Convert]::ToHexString($sha.ComputeHash($bytes))).ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is required."
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  throw "npx is required."
}

Push-Location $repoRoot
try {
  Write-Host "Checking Cloudflare authentication..."
  & npx --yes wrangler@4 whoami --config $configPath | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler is not authenticated. Run 'npx wrangler login' or set CLOUDFLARE_API_TOKEN and rerun this script."
  }

  $passwordSecure = Read-Host "Media Desk password (16+ characters recommended)" -AsSecureString
  $password = Convert-SecureToPlain $passwordSecure
  try {
    if ($password.Length -lt 12) {
      throw "Media Desk password must contain at least 12 characters."
    }
    $passwordHash = Get-Sha256Hex $password
  } finally {
    $password = $null
  }

  $githubSecure = Read-Host "GitHub fine-grained token for looksawful/looksawful.ru (Contents: read/write)" -AsSecureString
  $githubToken = Convert-SecureToPlain $githubSecure
  if (-not $githubToken) {
    throw "GitHub token is required."
  }

  $sessionBytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Fill($sessionBytes)
  $sessionSecret = [Convert]::ToBase64String($sessionBytes)

  $tempSecrets = Join-Path ([IO.Path]::GetTempPath()) ("looksawful-media-desk-{0}.env" -f [Guid]::NewGuid().ToString("N"))
  try {
    @(
      "MEDIA_DESK_PASSWORD_SHA256=$passwordHash"
      "MEDIA_DESK_SESSION_SECRET=$sessionSecret"
      "MEDIA_DESK_GITHUB_TOKEN=$githubToken"
    ) | Set-Content -LiteralPath $tempSecrets -Encoding utf8NoBOM

    if ($IsWindows) {
      & icacls $tempSecrets /inheritance:r /grant:r "${env:USERNAME}:(R,W)" | Out-Null
    }

    Write-Host "Building isolated Media Desk..."
    & npm run desk:cloudflare:build
    if ($LASTEXITCODE -ne 0) { throw "Media Desk build failed." }

    if (-not $SkipDeploy) {
      Write-Host "Deploying Media Desk Worker and secrets..."
      & npx --yes wrangler@4 deploy --config $configPath --secrets-file $tempSecrets
      if ($LASTEXITCODE -ne 0) { throw "Cloudflare Worker deployment failed." }
    }
  } finally {
    $githubToken = $null
    $sessionSecret = $null
    $passwordHash = $null
    if (Test-Path -LiteralPath $tempSecrets) {
      Remove-Item -LiteralPath $tempSecrets -Force
    }
  }

  if (-not $SkipDeploy) {
    Write-Host "Media Desk deployment command completed."
    Write-Host "Open: https://media.looksawful.ru/tools/media-desk/"
  }
} finally {
  Pop-Location
}
