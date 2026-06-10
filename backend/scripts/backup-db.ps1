$envFile = Join-Path $PSScriptRoot "..\.env"
$envLine = Select-String -Path $envFile -Pattern '^DATABASE_URL=' | Select-Object -First 1
$url = $envLine.Line -replace '^DATABASE_URL="?([^"]*)"?\s*$', '$1'

$dir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$file = Join-Path $dir "antre_db_$stamp.dump"

pg_dump $url -F c -f $file

if ($LASTEXITCODE -eq 0) {
  Write-Host "Sauvegarde OK -> $file"
} else {
  Write-Host "ECHEC de la sauvegarde" -ForegroundColor Red
  exit 1
}
