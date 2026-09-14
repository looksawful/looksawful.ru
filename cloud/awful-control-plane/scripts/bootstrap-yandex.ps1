param(
  [string]$GitHubOwner = "looksawful",
  [string]$GitHubRepository = "looksawful.ru",
  [string]$GitHubBranch = "dev"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-YcJson {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [switch]$AllowFailure
  )

  $output = & yc @Arguments --format json 2>$null
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    if ($AllowFailure) {
      return $null
    }
    throw "yc command failed: yc $($Arguments -join ' ')"
  }

  $text = ($output -join "`n").Trim()
  if (-not $text) {
    return $null
  }

  return $text | ConvertFrom-Json
}

function Invoke-Yc {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
  & yc @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "yc command failed: yc $($Arguments -join ' ')"
  }
}

function Get-OrCreateServiceAccount {
  param([Parameter(Mandatory = $true)][string]$Name)

  $existing = Invoke-YcJson -Arguments @(
    "iam", "service-account", "get", "--name", $Name, "--folder-id", $script:FolderId
  ) -AllowFailure

  if ($null -ne $existing) {
    Write-Host "[exists] service account $Name"
    return $existing
  }

  Write-Host "[create] service account $Name"
  return Invoke-YcJson -Arguments @(
    "iam", "service-account", "create",
    "--name", $Name,
    "--description", "AWFUL infrastructure account managed by looksawful.ru bootstrap",
    "--folder-id", $script:FolderId
  )
}

function Get-OrCreateRegistry {
  param([Parameter(Mandatory = $true)][string]$Name)

  $existing = Invoke-YcJson -Arguments @(
    "container", "registry", "get", "--name", $Name, "--folder-id", $script:FolderId
  ) -AllowFailure

  if ($null -ne $existing) {
    Write-Host "[exists] container registry $Name"
    return $existing
  }

  Write-Host "[create] container registry $Name"
  return Invoke-YcJson -Arguments @(
    "container", "registry", "create",
    "--name", $Name,
    "--folder-id", $script:FolderId
  )
}

function Get-OrCreateServerlessContainer {
  param([Parameter(Mandatory = $true)][string]$Name)

  $existing = Invoke-YcJson -Arguments @(
    "serverless", "container", "get", "--name", $Name, "--folder-id", $script:FolderId
  ) -AllowFailure

  if ($null -ne $existing) {
    Write-Host "[exists] serverless container $Name"
    return $existing
  }

  Write-Host "[create] serverless container $Name"
  return Invoke-YcJson -Arguments @(
    "serverless", "container", "create",
    "--name", $Name,
    "--description", "AWFUL API and MCP control plane",
    "--folder-id", $script:FolderId
  )
}

function Get-OrCreateSecret {
  param([Parameter(Mandatory = $true)][string]$Name)

  $existing = Invoke-YcJson -Arguments @(
    "lockbox", "secret", "get", "--name", $Name, "--folder-id", $script:FolderId
  ) -AllowFailure

  if ($null -ne $existing) {
    Write-Host "[exists] Lockbox secret $Name"
    return $existing
  }

  Write-Host "[create] Lockbox secret metadata $Name"
  return Invoke-YcJson -Arguments @(
    "lockbox", "secret", "create",
    "--name", $Name,
    "--description", "Secrets for AWFUL control plane. Payload is added separately.",
    "--folder-id", $script:FolderId
  )
}

function Get-OrCreateFederation {
  param([Parameter(Mandatory = $true)][string]$Name)

  $existing = Invoke-YcJson -Arguments @(
    "iam", "workload-identity", "oidc", "federation", "get", "--name", $Name,
    "--folder-id", $script:FolderId
  ) -AllowFailure

  if ($null -ne $existing) {
    Write-Host "[exists] workload identity federation $Name"
    return $existing
  }

  $audience = "https://github.com/$GitHubOwner"
  Write-Host "[create] workload identity federation $Name"
  return Invoke-YcJson -Arguments @(
    "iam", "workload-identity", "oidc", "federation", "create",
    "--name", $Name,
    "--description", "GitHub Actions OIDC for $GitHubOwner/$GitHubRepository",
    "--issuer", "https://token.actions.githubusercontent.com",
    "--audiences", $audience,
    "--jwks-url", "https://token.actions.githubusercontent.com/.well-known/jwks",
    "--folder-id", $script:FolderId
  )
}

function Add-FolderRole {
  param(
    [Parameter(Mandatory = $true)][string]$ServiceAccountId,
    [Parameter(Mandatory = $true)][string]$Role
  )

  Write-Host "[grant] $Role on folder -> $ServiceAccountId"
  Invoke-Yc -Arguments @(
    "resource-manager", "folder", "add-access-binding", $script:FolderId,
    "--role", $Role,
    "--service-account-id", $ServiceAccountId
  )
}

function Add-RegistryRole {
  param(
    [Parameter(Mandatory = $true)][string]$RegistryId,
    [Parameter(Mandatory = $true)][string]$ServiceAccountId,
    [Parameter(Mandatory = $true)][string]$Role
  )

  Write-Host "[grant] $Role on registry -> $ServiceAccountId"
  Invoke-Yc -Arguments @(
    "container", "registry", "add-access-binding", "--id", $RegistryId,
    "--role", $Role,
    "--service-account-id", $ServiceAccountId
  )
}

function Add-SecretRole {
  param(
    [Parameter(Mandatory = $true)][string]$SecretId,
    [Parameter(Mandatory = $true)][string]$ServiceAccountId,
    [Parameter(Mandatory = $true)][string]$Role
  )

  Write-Host "[grant] $Role on secret -> $ServiceAccountId"
  Invoke-Yc -Arguments @(
    "lockbox", "secret", "add-access-binding", "--id", $SecretId,
    "--role", $Role,
    "--service-account-id", $ServiceAccountId
  )
}

if (-not (Get-Command yc -ErrorAction SilentlyContinue)) {
  throw "Yandex Cloud CLI (yc) is not installed or is not in PATH."
}

$whoami = (& yc iam whoami 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $whoami) {
  throw "Yandex Cloud CLI is not authenticated. Run 'yc init' first."
}

$script:FolderId = (& yc config get folder-id 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $script:FolderId) {
  throw "No default Yandex Cloud folder is configured. Run 'yc init' and select the AWFUL folder."
}

$cloudId = (& yc config get cloud-id 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $cloudId) {
  throw "No default Yandex Cloud cloud is configured. Run 'yc init' first."
}

Write-Host "Authenticated as: $whoami"
Write-Host "Cloud: $cloudId"
Write-Host "Folder: $script:FolderId"
Write-Host ""

$runtime = Get-OrCreateServiceAccount -Name "awful-runtime"
$deployer = Get-OrCreateServiceAccount -Name "awful-deployer"
$registry = Get-OrCreateRegistry -Name "awful"
$container = Get-OrCreateServerlessContainer -Name "awful-control-plane"
$secret = Get-OrCreateSecret -Name "awful-control-plane"
$federation = Get-OrCreateFederation -Name "awful-github"

Add-FolderRole -ServiceAccountId $runtime.id -Role "ai.languageModels.user"
Add-SecretRole -SecretId $secret.id -ServiceAccountId $runtime.id -Role "lockbox.payloadViewer"
Add-RegistryRole -RegistryId $registry.id -ServiceAccountId $runtime.id -Role "container-registry.images.puller"

Add-FolderRole -ServiceAccountId $deployer.id -Role "iam.serviceAccounts.user"
Add-FolderRole -ServiceAccountId $deployer.id -Role "serverless-containers.editor"
Add-RegistryRole -RegistryId $registry.id -ServiceAccountId $deployer.id -Role "container-registry.images.pusher"

$externalSubject = "repo:$GitHubOwner/$GitHubRepository`:ref`:refs/heads/$GitHubBranch"
$credentials = Invoke-YcJson -Arguments @(
  "iam", "workload-identity", "federated-credential", "list",
  "--service-account-id", $deployer.id,
  "--folder-id", $script:FolderId
)

$credential = @($credentials) | Where-Object {
  $_.federation_id -eq $federation.id -and $_.external_subject_id -eq $externalSubject
} | Select-Object -First 1

if ($null -eq $credential) {
  Write-Host "[create] GitHub federated credential"
  $credential = Invoke-YcJson -Arguments @(
    "iam", "workload-identity", "federated-credential", "create",
    "--service-account-id", $deployer.id,
    "--federation-id", $federation.id,
    "--external-subject-id", $externalSubject,
    "--folder-id", $script:FolderId
  )
} else {
  Write-Host "[exists] GitHub federated credential"
}

$result = [ordered]@{
  cloudId = $cloudId
  folderId = $script:FolderId
  runtimeServiceAccountId = $runtime.id
  deployerServiceAccountId = $deployer.id
  registryId = $registry.id
  containerId = $container.id
  lockboxSecretId = $secret.id
  workloadIdentityFederationId = $federation.id
  federatedCredentialId = $credential.id
  githubAudience = "https://github.com/$GitHubOwner"
  githubSubject = $externalSubject
}

Write-Host ""
Write-Host "Bootstrap complete. No secret payloads or API keys were created."
Write-Host "Save the following JSON output and use it for the next deployment step:"
$result | ConvertTo-Json -Depth 4
