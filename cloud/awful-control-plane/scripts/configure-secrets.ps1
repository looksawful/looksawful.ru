param(
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

function Invoke-YcNoThrow {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & yc @Arguments
  return $LASTEXITCODE
}

function Normalize-YcList {
  param(
    $Value,
    [string[]]$CandidateProperties = @()
  )

  if ($null -eq $Value) {
    return @()
  }

  foreach ($property in $CandidateProperties) {
    if ($Value.PSObject.Properties.Name -contains $property) {
      return @($Value.$property)
    }
  }

  return @($Value)
}

function Get-CurrentSecretKeys {
  param(
    [Parameter(Mandatory = $true)]$Secret
  )

  $currentVersionId = $Secret.current_version.id
  if (-not $currentVersionId) {
    return @()
  }

  $inlineKeys = @($Secret.current_version.payload_entry_keys)
  if ($inlineKeys.Count -gt 0) {
    return $inlineKeys
  }

  $versionsRaw = Invoke-YcJson -Arguments @(
    "lockbox", "secret", "list-version",
    "--id", $Secret.id
  )
  $versions = Normalize-YcList -Value $versionsRaw -CandidateProperties @("versions")
  $current = $versions | Where-Object { $_.id -eq $currentVersionId } | Select-Object -First 1
  if ($null -eq $current) {
    return @()
  }

  return @($current.payload_entry_keys)
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

$existingApiKeysRaw = Invoke-YcJson -Arguments @(
  "iam", "api-key", "list", "--service-account-id", $runtime.id, "--folder-id", $folderId
)
$existingApiKeys = Normalize-YcList -Value $existingApiKeysRaw -CandidateProperties @("api_keys", "apiKeys")
$managedDescription = "AWFUL control plane Yandex AI Studio"
$managedApiKeys = @($existingApiKeys | Where-Object {
  $_.description -eq $managedDescription
})

$currentVersionId = $secret.current_version.id
$currentSecretKeys = Get-CurrentSecretKeys -Secret $secret
$hasInternalToken = $currentSecretKeys -contains "awful-internal-token"
$hasYandexAiKey = $currentSecretKeys -contains "yandex-ai-api-key"
$lockboxIsConfigured = $currentVersionId -and $hasInternalToken -and $hasYandexAiKey

if ($managedApiKeys.Count -gt 0 -and $lockboxIsConfigured -and -not $RotateYandexApiKey) {
  Write-Host "AWFUL runtime secrets are already configured. Nothing to change."
  Write-Host "Lockbox version ID: $currentVersionId"
  Write-Host "Managed Yandex AI API key count: $($managedApiKeys.Count)"
  Write-Host "Secret values were not read or printed."
  return
}

if ($managedApiKeys.Count -gt 0 -and -not $lockboxIsConfigured -and -not $RotateYandexApiKey) {
  throw "A managed Yandex AI API key exists, but the current Lockbox version is missing one or both required entries. The API key secret cannot be retrieved again. Re-run with -RotateYandexApiKey to create a replacement key, write a complete Lockbox version, and remove the old managed key."
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

$payload = ConvertTo-Json -InputObject $entries -Compress
$output = $payload | & yc lockbox secret add-version `
  --id $secret.id `
  --description "AWFUL control plane runtime secrets" `
  --payload - `
  --folder-id $folderId `
  --format json

if ($LASTEXITCODE -ne 0) {
  Write-Warning "Failed to write the Lockbox version. Delete the newly issued API key resource ID '$($yandexApiKey.id)' before retrying."
  throw "Failed to write the Lockbox secret version."
}

$newVersion = (($output -join "`n").Trim() | ConvertFrom-Json)

if ($managedApiKeys.Count -gt 0) {
  foreach ($oldKey in $managedApiKeys) {
    if ($oldKey.id -eq $yandexApiKey.id) {
      continue
    }

    Write-Host "Removing superseded managed Yandex AI API key $($oldKey.id)..."
    $deleteExitCode = Invoke-YcNoThrow -Arguments @(
      "iam", "api-key", "delete",
      "--id", $oldKey.id,
      "--folder-id", $folderId
    )
    if ($deleteExitCode -ne 0) {
      Write-Warning "The replacement key and Lockbox version are valid, but old API key '$($oldKey.id)' could not be removed automatically. Delete that old key manually."
    }
  }
}

Write-Host "Lockbox version created successfully."
Write-Host "Lockbox version ID: $($newVersion.id)"
Write-Host "Yandex AI API key expires at $expiresAt."
Write-Host "Secret values were not written to Git or printed to the terminal."
