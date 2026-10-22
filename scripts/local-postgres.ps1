param(
  [Parameter(Position = 0)]
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$drive = 'P:'
$mount = "$drive\"

# PostgreSQL's Windows initdb cannot handle this checkout's Chinese path.
# A temporary ASCII drive mapping keeps the data in this project's ignored folder.
if (-not (Test-Path -LiteralPath $mount)) {
  & subst $drive $projectRoot
  if ($LASTEXITCODE -ne 0) { throw 'Could not map the project to P:.' }
}

$bin = Join-Path $mount '.local-postgres\pgsql\bin'
$data = Join-Path $mount '.local-postgres\data'
$ctl = Join-Path $bin 'pg_ctl.exe'
$log = Join-Path $mount '.local-postgres\postgres.log'

if (-not (Test-Path -LiteralPath $ctl) -or -not (Test-Path -LiteralPath $data)) {
  throw 'P: is in use by another folder, or local PostgreSQL has not been installed here.'
}

switch ($Action) {
  'start' {
    & $ctl -D $data status *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Output 'Local PostgreSQL is already running.'
      break
    }
    & $ctl -D $data -l $log -o '-h 127.0.0.1 -p 5432' -w start
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL failed to start. See $log" }
  }
  'stop' {
    & $ctl -D $data status *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Output 'Local PostgreSQL is already stopped.'
      break
    }
    & $ctl -D $data -m fast -w stop
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL failed to stop.' }
  }
  'status' {
    & $ctl -D $data status
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}
