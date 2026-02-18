# Script para reinstalar dependencias del backend

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Reinstalando Backend" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Ir a backend
Set-Location backend

# Eliminar entorno virtual anterior
Write-Host "[1/3] Eliminando entorno virtual anterior..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Remove-Item -Recurse -Force venv
    Write-Host "[OK] Entorno virtual eliminado" -ForegroundColor Green
} else {
    Write-Host "[INFO] No habia entorno virtual previo" -ForegroundColor Yellow
}

# Crear nuevo entorno virtual
Write-Host "[2/3] Creando nuevo entorno virtual..." -ForegroundColor Yellow
python -m venv venv
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Entorno virtual creado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se pudo crear el entorno virtual" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Instalar dependencias
Write-Host "[3/3] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "       (Esto puede tardar varios minutos...)" -ForegroundColor Gray
Write-Host ""

& ".\venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Error al instalar dependencias" -ForegroundColor Red
    Set-Location ..
    exit 1
}

deactivate
Set-Location ..

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  BACKEND LISTO" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "1. Iniciar PostgreSQL: docker-compose up -d db" -ForegroundColor Gray
Write-Host "2. Aplicar migraciones: cd backend && .\venv\Scripts\Activate.ps1 && python manage.py migrate" -ForegroundColor Gray
Write-Host ""
