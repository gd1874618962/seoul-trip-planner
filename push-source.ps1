$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$git = 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'

function Check-LastExit([string]$step) {
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $step (exit $LASTEXITCODE)" }
}

Push-Location $root
if (-not (Test-Path -LiteralPath (Join-Path $root '.git'))) {
  & $git init -b source 2>$null
  Check-LastExit 'init'
}
if (-not (& $git remote | Select-String '^origin$')) {
  & $git remote add origin https://github.com/gd1874618962/seoul-trip-planner.git 2>$null
  Check-LastExit 'remote add'
}
& $git add -A 2>$null
Check-LastExit 'add'
& $git -c user.name='Codex Deploy' -c user.email='gd1874618962@users.noreply.github.com' commit -m "Update source $(Get-Date -Format 'yyyyMMdd-HHmm')" 2>$null
$commitExit = $LASTEXITCODE
if ($commitExit -eq 0) {
  & $git push -u origin source 2>$null
  Check-LastExit 'push'
} else {
  Write-Host 'No source changes, skipping push'
}
Pop-Location
