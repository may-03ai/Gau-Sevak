$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

$firebaseRc = Get-Content '.firebaserc' -Raw | ConvertFrom-Json
$config = Get-Content 'firebase.json' -Raw | ConvertFrom-Json
if ($firebaseRc.projects.default -ne 'demo-gau-sevak') {
    throw 'Refusing to display as safe local config: default project is not demo-gau-sevak.'
}

Write-Output "Project: $($firebaseRc.projects.default) (demo-only; no cloud project)"
Write-Output "Functions runtime: $($config.functions[0].runtime)"
Write-Output 'Rules:'
Write-Output "  Firestore: $($config.firestore.rules)"
Write-Output "  Indexes:   $($config.firestore.indexes)"
Write-Output "  Storage:   $($config.storage.rules)"
Write-Output 'Local emulator endpoints:'
foreach ($name in @('auth','firestore','functions','storage','ui','hub','logging')) {
    $emulator = $config.emulators.$name
    Write-Output ("  {0}: http://{1}:{2}" -f $name,$emulator.host,$emulator.port)
}
