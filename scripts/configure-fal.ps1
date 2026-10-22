param([switch]$Status)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
  throw '.env not found. Copy .env.example to .env and configure the database first.'
}

$lines = [System.IO.File]::ReadAllLines($envPath)
$configured = @($lines | Where-Object { $_ -match '^FAL_KEY=\S+' }).Count -gt 0
$provider = @($lines | Where-Object { $_ -match '^ART_PROVIDER=' } | Select-Object -Last 1)
if ($Status) {
  $mode = if ($provider.Count) { $provider[0].Substring('ART_PROVIDER='.Length) } else { 'mock (default)' }
  Write-Output "fal key configured: $configured"
  Write-Output "art provider: $mode"
  exit 0
}

Write-Output 'Paste the fal API key below. Input is hidden and the key will only be written to the ignored local .env file.'
$secure = Read-Host 'FAL_KEY' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if (-not $key -or $key.Length -lt 10 -or $key -match '\s') {
    throw 'The API key looks invalid. Nothing was changed.'
  }
  $kept = @($lines | Where-Object { $_ -notmatch '^(ART_PROVIDER|FAL_KEY)=' })
  $updated = ($kept + @('ART_PROVIDER=fal', "FAL_KEY=$key")) -join [Environment]::NewLine
  [System.IO.File]::WriteAllText($envPath, $updated + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
  Write-Output 'fal is configured in .env. Restart the Next.js development server before testing.'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $key = $null
}
