$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$mysql = 'C:\xampp\mysql\bin\mysql.exe'
$database = 'sipat_portal'

if (-not (Test-Path -LiteralPath $mysql)) {
  throw 'MySQL do XAMPP não encontrado em C:\xampp\mysql\bin\mysql.exe.'
}

& $mysql --host=127.0.0.1 --port=3306 --user=root --execute='SELECT 1' | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Não foi possível conectar ao MySQL. Inicie o MySQL no painel do XAMPP.'
}

& $mysql --host=127.0.0.1 --port=3306 --user=root --execute="CREATE DATABASE IF NOT EXISTS ``$database`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o banco local.' }

$schemaPath = Join-Path $repositoryRoot 'database\schema.sql'
Get-Content -LiteralPath $schemaPath -Raw | & $mysql --host=127.0.0.1 --port=3306 --user=root --database=$database --default-character-set=utf8mb4
if ($LASTEXITCODE -ne 0) { throw 'Falha ao importar database\schema.sql.' }

Push-Location (Join-Path $repositoryRoot 'backend')
try {
  npm run db:bootstrap
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao executar o bootstrap do administrador.' }
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Ambiente local preparado com sucesso.' -ForegroundColor Green
Write-Host 'Inicie tudo com: npm run dev:full'
Write-Host 'Frontend: http://localhost:3000/login'
Write-Host 'Swagger:  http://localhost:3001/api/docs'
Write-Host 'Login:    admin.local'
Write-Host 'Senha:    AdminLocal2026'
