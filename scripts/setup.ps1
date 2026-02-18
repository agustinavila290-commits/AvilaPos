# Script de configuracion inicial para Windows PowerShell
# Casa de Repuestos - Sistema de Gestion

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup - Casa de Repuestos" -ForegroundColor Cyan
Write-Host "  Sistema de Gestion Integral" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Python
Write-Host "[1/8] Verificando Python..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] $pythonVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Python no esta instalado." -ForegroundColor Red
    Write-Host "        Descarga Python 3.11+ desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar Node.js
Write-Host "[2/8] Verificando Node.js..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js $nodeVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js no esta instalado." -ForegroundColor Red
    Write-Host "        Descarga Node.js 18+ desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2b. Verificar npm
Write-Host "[2b/8] Verificando npm..." -ForegroundColor Yellow
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) {
    $npmVersion = npm --version 2>&1
    Write-Host "[OK] npm $npmVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] npm no esta disponible." -ForegroundColor Red
    Write-Host "        Intenta reinstalar Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar PostgreSQL
Write-Host "[3/8] Verificando PostgreSQL..." -ForegroundColor Yellow
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlCmd) {
    Write-Host "[OK] PostgreSQL encontrado" -ForegroundColor Green
} else {
    Write-Host "[INFO] PostgreSQL no encontrado." -ForegroundColor Yellow
    Write-Host "       Puedes usar Docker: docker-compose up -d db" -ForegroundColor Yellow
}

# 4. Crear entorno virtual Python
Write-Host "[4/8] Creando entorno virtual..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Set-Location backend
    
    if (Test-Path "venv") {
        Write-Host "[INFO] Entorno virtual ya existe, saltando..." -ForegroundColor Yellow
    } else {
        python -m venv venv
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Entorno virtual creado" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] No se pudo crear el entorno virtual" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }
} else {
    Write-Host "[ERROR] Carpeta backend no encontrada" -ForegroundColor Red
    exit 1
}

# 5. Instalar dependencias de Python
Write-Host "[5/8] Instalando dependencias de Python..." -ForegroundColor Yellow
Write-Host "       (Esto puede tardar varios minutos...)" -ForegroundColor Gray

# Activar entorno virtual y instalar
if (Test-Path "venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
    python -m pip install --upgrade pip --quiet
    pip install -r requirements.txt --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencias de Python instaladas" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Error al instalar dependencias de Python" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    # Desactivar entorno virtual
    deactivate
} else {
    Write-Host "[ERROR] No se encontro el script de activacion del entorno virtual" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# 6. Copiar .env.example a .env
Write-Host "[6/8] Configurando variables de entorno..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "[OK] Archivo .env creado" -ForegroundColor Green
    Write-Host "       IMPORTANTE: Edita .env con tus credenciales" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] .env ya existe, no se sobrescribio" -ForegroundColor Yellow
}

# 7. Instalar dependencias de Node
Write-Host "[7/8] Instalando dependencias de Node.js..." -ForegroundColor Yellow
Write-Host "       (Esto puede tardar varios minutos...)" -ForegroundColor Gray

if (Test-Path "frontend") {
    Set-Location frontend
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencias de Node.js instaladas" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Error al instalar dependencias de Node.js" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
} else {
    Write-Host "[ERROR] Carpeta frontend no encontrada" -ForegroundColor Red
    exit 1
}

# 8. Instrucciones finales
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar PostgreSQL (si usas Docker):" -ForegroundColor White
Write-Host "   docker-compose up -d db" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Aplicar migraciones:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python manage.py migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Crear superusuario:" -ForegroundColor White
Write-Host "   python manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Iniciar backend (en una terminal):" -ForegroundColor White
Write-Host "   python manage.py runserver" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Iniciar frontend (en OTRA terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Acceder a:" -ForegroundColor White
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "   Backend API: http://localhost:8000/api" -ForegroundColor Gray
Write-Host "   Admin:       http://localhost:8000/admin" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
