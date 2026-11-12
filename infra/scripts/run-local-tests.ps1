param(
    [string]$TestCommand
)

$ErrorActionPreference = 'Stop'
$projectId = 'demo-gau-sevak'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    throw 'Firebase CLI is not on PATH.'
}

$firebaseRc = Get-Content '.firebaserc' -Raw | ConvertFrom-Json
if ($firebaseRc.projects.default -ne $projectId) {
    throw "Refusing to run tests: expected demo project $projectId."
}

if ([string]::IsNullOrWhiteSpace($TestCommand)) {
    $TestCommand = 'node infra/scripts/check-emulator-ports.js'
    Write-Output 'Running emulator connectivity smoke checks only; provide -TestCommand to run application or rules tests.'
}

$androidStudioJavaHome = 'C:\Program Files\Android\Android Studio\jbr'
$javaHomeBefore = $env:JAVA_HOME
$pathBefore = $env:PATH
$firebaseTokenBefore = $env:FIREBASE_TOKEN
$gcloudProjectBefore = $env:GCLOUD_PROJECT
$exitCode = 0

try {
    $nodeToolsRoot = Join-Path $env:LOCALAPPDATA 'GauSevak\tools'
    $node22 = Get-ChildItem -Path $nodeToolsRoot -Directory -Filter 'node-v22.*-win-x64' -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Name -match '^node-v(22\.\d+\.\d+)-win-x64$') {
            [pscustomobject]@{ Version = [version]$Matches[1]; Path = $_.FullName }
        }
    } | Sort-Object Version -Descending | Select-Object -First 1
    if ($node22 -and (Test-Path (Join-Path $node22.Path 'node.exe'))) {
        $env:PATH = $node22.Path + ';' + $env:PATH
    } else {
        Write-Warning 'No user-local Node 22 runtime was found. Functions emulator will use the PATH runtime.'
    }

    if (-not (Get-Command java -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $androidStudioJavaHome 'bin\java.exe'))) {
        $env:JAVA_HOME = $androidStudioJavaHome
        $env:PATH = (Join-Path $androidStudioJavaHome 'bin') + ';' + $env:PATH
    }
    Remove-Item Env:FIREBASE_TOKEN -ErrorAction SilentlyContinue
    $env:GCLOUD_PROJECT = $projectId

    & firebase emulators:exec --project $projectId --only auth,firestore,functions,storage --ui $TestCommand
    $exitCode = $LASTEXITCODE
}
finally {
    $env:JAVA_HOME = $javaHomeBefore
    $env:PATH = $pathBefore
    $env:FIREBASE_TOKEN = $firebaseTokenBefore
    $env:GCLOUD_PROJECT = $gcloudProjectBefore
}

exit $exitCode
