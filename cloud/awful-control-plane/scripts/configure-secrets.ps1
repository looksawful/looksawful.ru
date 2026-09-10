param(
  [switch]$SkipOpenAI,
  [switch]$RotateYandexApiKey
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-YcJson {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $output = & yc @Arguments --format json
  if ($LASTEXITCODE -ne 0) {
    throw "yc command failed: yc $($Arguments -join ' ')"
  }

  $text = ($output -join "`n").Trim()
  if (-not $text) {
    return $null
  }
  return $text | ConvertFrom-Json
}

function Convert-SecureStringToPlainText {
  param([Parameter(Mandatory = $true)][Security.SecureString]$Value)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

if (-not (Get-Command yc -ErrorAction SilentlyContinue)) {
  throw "Yandex Cloud CLI (yc) is not installed or is not in PATH."
}

$folderId = (& yc config get folder-id 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $folderId) {
  throw "Run 'yc init' first and select the AWFUL folder."
}

$runtime = Invoke-YcJson -Arguments @(
  "iam", "service-account", "get", "--name", "awful-runtime", "--folder-id", $folderId
)
$secret = Invoke-YcJson -Arguments @(
  "lockbox", "secret", "get", "--name", "awful-control-plane", "--folder-id", $folderId
)

$existingApiKeys = Invoke-YcJson -Arguments @(
  "iam", "api-key", "list", "--service-account-id", $runtime.id, "--folder-id", $folderId
)
$managedDescription = "AWFUL control plane Yandex AI Studio"
$managedApiKey = @($existingApiKeys) | Where-Object {
  $_.description -eq $managedDescription
} | Select-Object -First 1

if ($null -ne $managedApiKey -and -not $RotateYandexApiKey) {
  throw "A managed Yandex AI API key already exists. Its secret cannot be retrieved again. Use -RotateYandexApiKey only when you intentionally want to issue a replacement key."
}

Write-Host "Creating a scoped Yandex AI Studio API key for awful-runtime..."
$expiresAt = [DateTime]::UtcNow.AddYears(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$yandexApiKey = Invoke-YcJson -Arguments @(
  "iam", "api-key", "create",
  "--service-account-id", $runtime.id,
  "--description", $managedDescription,
  "--scopes", "yc.ai.languageModels.execute",
  "--expires-at", $expiresAt,
  "--folder-id", $folderId
)

if (-not $yandexApiKey.secret) {
  throw "Yandex Cloud did not return the API key secret. No Lockbox version was written."
}

$entries = @(
  [ordered]@{
    key = "awful-internal-token"
    text_value = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
  },
  [ordered]@{
    key = "yandex-ai-api-key"
    text_value = $yandexApiKey.secret
  }
)

if (-not $SkipOpenAI) {
  Write-Host "Paste the OpenAI API key locally. It will not be printed or committed."
  $secureOpenAi = Read-Host "OpenAI API key (leave empty only if you want to configure OpenAI later)" -AsSecureString
  $openAi = Convert-SecureStringToPlainText -Value $secureOpenAi

  if ($openAi) {
    $entries += [ordered]@{
      key = "openai-api-key"
      text_value = $openAi
    }
  }
}

$payload = $entries | ConvertTo-Json -Compress
$payload | & yc lockbox secret add-version `
  --id $secret.id `
  --description "AWFUL control plane runtime secrets" `
  --payload - `
  --folder-id $folderId `
  --format json | Out-Null

if ($LASTEXITCODE -ne 0) {
  throw "Failed to write the Lockbox secret version. The newly issued Yandex API key should be revoked before retrying."
}

Write-Host "Lockbox version created successfully."
Write-Host "Yandex AI API key expires at $expiresAt."
Write-Host "Secret values were not written to Git or printed to the terminal."
