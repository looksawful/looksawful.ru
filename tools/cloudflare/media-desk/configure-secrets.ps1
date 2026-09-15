param(
  [switch]$SkipDeploy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$configPath = Join-Path $PSScriptRoot "wrangler.jsonc"

function Set-WorkerSecret {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  $Value | & npx --yes wrangler@4 secret put $Name --config $configPath | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Failed to set Cloudflare secret $Name." }
}

Push-Location $repoRoot
try {
  & npx --yes wrangler@4 whoami --config $configPath | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler authentication is required before Media Desk setup."
  }

  $hashOutput = & node tools/media-desk/hash-password.mjs
  if ($LASTEXITCODE -ne 0) { throw "Media Desk password hashing failed." }
  $passwordHash = @($hashOutput | Where-Object { $_ -match '^pbkdf2-sha256\$' })[-1]
  if (-not $passwordHash) { throw "Media Desk PBKDF2 hash was not produced." }

  $githubSecure = Read-Host "GitHub fine-grained token for looksawful/looksawful.ru (Contents: read/write)" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($githubSecure)
  try {
    $githubToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
  if (-not $githubToken) { throw "GitHub token is required." }

  $sessionBytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Fill($sessionBytes)
  $sessionSecret = [Convert]::ToBase64String($sessionBytes)

  try {
    Set-WorkerSecret -Name "MEDIA_DESK_PASSWORD_HASH" -Value $passwordHash
    Set-WorkerSecret -Name "MEDIA_DESK_SESSION_SECRET" -Value $sessionSecret
    Set-WorkerSecret -Name "MEDIA_DESK_GITHUB_TOKEN" -Value $githubToken
  } finally {
    $passwordHash = $null
    $sessionSecret = $null
    $githubToken = $null
  }

  & npm run media-desk:build
  if ($LASTEXITCODE -ne 0) { throw "Media Desk build failed." }

  if (-not $SkipDeploy) {
    & npx --yes wrangler@4 deploy --config $configPath | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Media Desk deployment failed." }
    Write-Host "Media Desk: https://media.looksawful.ru/tools/media-desk/"
  }
} finally {
  Pop-Location
}
