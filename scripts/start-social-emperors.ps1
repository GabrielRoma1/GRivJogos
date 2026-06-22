$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$emuDir = Join-Path $root "services\social-emperors"
$exe = Join-Path $emuDir "social-emperors_0.04a.exe"

if (-not (Test-Path $exe)) {
    Write-Error "Executavel nao encontrado: $exe`nCopie o pacote para services/social-emperors/ antes de iniciar."
    exit 1
}

Write-Host "Iniciando Social Empires em http://127.0.0.1:5050 ..."
Set-Location $emuDir
Start-Process -FilePath $exe -WorkingDirectory $emuDir
