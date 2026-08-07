$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$git = 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
$node = 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$env:PATH = 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$dist = Join-Path $root 'dist'
$deploy = Join-Path $root 'deploy'

function Check-LastExit([string]$step) {
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $step (exit $LASTEXITCODE)" }
}

Push-Location $root
Write-Host '[1/4] Build'
& $node .\node_modules\vite\bin\vite.js build
Check-LastExit 'build'

Write-Host '[2/4] Smoke test'
& $node .\scripts\verify3.mjs
Check-LastExit 'smoke test'

Write-Host '[3/4] Sync deploy repo'
if (-not (Test-Path -LiteralPath $deploy)) {
  & $git clone https://github.com/gd1874618962/seoul-trip-planner.git $deploy
  Check-LastExit 'clone'
}
Push-Location $deploy
& $git fetch origin 2>$null
Check-LastExit 'fetch'
& $git reset --hard origin/main 2>$null
Check-LastExit 'reset'
Copy-Item -Path (Join-Path $dist '*') -Destination $deploy -Recurse -Force
& $git add -A 2>$null
Check-LastExit 'add'
& $git -c user.name='Codex Deploy' -c user.email='gd1874618962@users.noreply.github.com' commit -m "Deploy $(Get-Date -Format 'yyyyMMdd-HHmm')" 2>$null
$commitExit = $LASTEXITCODE
if ($commitExit -eq 0) {
  Write-Host '[4/4] Push GitHub Pages'
  & $git push origin main 2>$null
  Check-LastExit 'push'
} else {
  Write-Host 'No content changes, skipping push'
}
Pop-Location

Write-Host 'Waiting for Pages deployment'
$localHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $dist 'index.html')).Hash
$url = 'https://gd1874618962.github.io/seoul-trip-planner/index.html'
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 10
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    $tmp = Join-Path $env:TEMP ('pages-' + [guid]::NewGuid().ToString() + '.html')
    [System.IO.File]::WriteAllText($tmp, $resp.Content, [System.Text.Encoding]::UTF8)
    $remoteHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $tmp).Hash
    Remove-Item -LiteralPath $tmp -Force
    if ($remoteHash -eq $localHash) { $ok = $true; break }
  } catch {}
}
if ($ok) { Write-Host "DEPLOY_OK $url" } else { Write-Host "DEPLOY_PENDING $url" }
Pop-Location
