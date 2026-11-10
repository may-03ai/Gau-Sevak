$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$pidFile = Join-Path $repoRoot '.firebase-local\emulators.pid'
if (-not (Test-Path $pidFile)) {
    Write-Output 'No launcher PID is recorded. If started manually, stop Firebase Emulator Suite with Ctrl+C in that terminal.'
    exit 0
}

$processId = [int](Get-Content $pidFile -Raw)
$process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
if (-not $process) {
    Remove-Item $pidFile -Force
    Write-Output 'The recorded launcher was already stopped; cleared its stale PID file.'
    exit 0
}

if ($process.CommandLine -notmatch 'firebase emulators:start' -or $process.CommandLine -notmatch 'demo-gau-sevak') {
    throw "Refusing to stop PID $processId because it is not the recorded Gau-Sevak demo emulator launcher."
}

& (Join-Path $env:SystemRoot 'System32\taskkill.exe') /PID $processId /T /F | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Could not stop the demo emulator process tree (taskkill exit $LASTEXITCODE)."
}
Remove-Item $pidFile -Force
Write-Output 'Stopped the Gau-Sevak demo emulator process tree.'
