# Script de inicio para Electron
# Inicia backend + frontend en ventana de escritorio

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CASA DE REPUESTOS - VERSION ELECTRON" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar directorios
if (-not (Test-Path "backend")) {
    Write-Host "[ERROR] No se encuentra la carpeta backend" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "[ERROR] No se encuentra la carpeta frontend" -ForegroundColor Red
    pause
    exit 1
}

# Iniciar Backend
Write-Host "[1/2] Iniciando Backend Django..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\activate; python manage.py runserver" -WindowStyle Normal

# Esperar a que el backend inicie
Write-Host "Esperando 5 segundos a que el backend inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Iniciar Electron
Write-Host "[2/2] Iniciando Aplicacion de Escritorio..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
cd $frontendPath

try {
    npm run electron
} catch {
    Write-Host ""
    Write-Host "[ERROR] Hubo un problema al iniciar Electron" -ForegroundColor Red
    Write-Host "Verifica que todas las dependencias esten instaladas." -ForegroundColor Yellow
    Write-Host ""
    pause
}
