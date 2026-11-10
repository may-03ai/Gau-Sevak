$ErrorActionPreference = 'Stop'

$projectId = 'demo-gau-sevak'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$stateDirectory = Join-Path $repoRoot '.firebase-local'
$pidFile = Join-Path $stateDirectory 'emulators.pid'
$config = Get-Content (Join-Path $repoRoot 'firebase.json') -Raw | ConvertFrom-Json
$firebaseRc = Get-Content (Join-Path $repoRoot '.firebaserc') -Raw | ConvertFrom-Json

if ($firebaseRc.projects.default -ne $projectId) {
    throw "Refusing to start: .firebaserc default must be $projectId."
}

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    throw 'Firebase CLI is not on PATH. Install it with npm install -g firebase-tools.'
}

$nodeToolsRoot = Join-Path $env:LOCALAPPDATA 'GauSevak\tools'
$node22 = Get-ChildItem -Path $nodeToolsRoot -Directory -Filter 'node-v22.*-win-x64' -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -match '^node-v(22\.\d+\.\d+)-win-x64$') {
        [pscustomobject]@{ Version = [version]$Matches[1]; Path = $_.FullName }
    }
} | Sort-Object Version -Descending | Select-Object -First 1
if ($node22 -and (Test-Path (Join-Path $node22.Path 'node.exe'))) {
    $env:PATH = $node22.Path + ';' + $env:PATH
} else {
    Write-Warning 'No user-local Node 22 runtime was found. Install one under %LOCALAPPDATA%\GauSevak\tools before using the Functions emulator.'
}

$nodeVersion = (& node --version).Trim()
if ($nodeVersion -notmatch '^v22\.') {
    Write-Warning "Functions target Node 22, but PATH currently resolves $nodeVersion. Install/use Node 22 before relying on Functions emulator behavior."
}

if (-not $config.functions -or $config.functions[0].runtime -ne 'nodejs22') {
    throw 'Refusing to start: firebase.json must target nodejs22.'
}

if (Test-Path $pidFile) {
    $previousPid = [int](Get-Content $pidFile -Raw)
    $previousProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $previousPid" -ErrorAction SilentlyContinue
    if ($previousProcess -and $previousProcess.CommandLine -match 'firebase emulators:start' -and $previousProcess.CommandLine -match $projectId) {
        throw "The demo emulator launcher is already running (PID $previousPid). Use stop-firebase-emulators.ps1."
    }
    Remove-Item $pidFile -Force
}

$androidStudioJavaHome = 'C:\Program Files\Android\Android Studio\jbr'
$javaHomeBefore = $env:JAVA_HOME
$pathBefore = $env:PATH
$firebaseTokenBefore = $env:FIREBASE_TOKEN
$gcloudProjectBefore = $env:GCLOUD_PROJECT
if (-not (Get-Command java -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $androidStudioJavaHome 'bin\java.exe'))) {
    $env:JAVA_HOME = $androidStudioJavaHome
    $env:PATH = (Join-Path $androidStudioJavaHome 'bin') + ';' + $env:PATH
}

try {
    Remove-Item Env:FIREBASE_TOKEN -ErrorAction SilentlyContinue
    $env:GCLOUD_PROJECT = $projectId

    New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
    $arguments = '/c firebase emulators:start --project ' + $projectId + ' --only auth,firestore,functions,storage,ui'
    $process = Start-Process -FilePath $env:ComSpec -ArgumentList $arguments -WorkingDirectory $repoRoot -PassThru
    $process.Id | Set-Content -LiteralPath $pidFile -NoNewline
}
finally {
    $env:JAVA_HOME = $javaHomeBefore
    $env:PATH = $pathBefore
    $env:FIREBASE_TOKEN = $firebaseTokenBefore
    $env:GCLOUD_PROJECT = $gcloudProjectBefore
}

Write-Output "Started the local-only Firebase emulator launcher (PID $($process.Id))."
Write-Output 'Emulator UI: http://127.0.0.1:4000'
Write-Output 'Stop with: .\infra\scripts\stop-firebase-emulators.ps1'
