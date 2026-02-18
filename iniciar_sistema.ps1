# Script PowerShell para iniciar Casa de Repuestos
# Version: 1.0.0

$Host.UI.RawUI.WindowTitle = "Casa de Repuestos - Sistema de Gestion"
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

function Write-Header {
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                          ║" -ForegroundColor Cyan
    Write-Host "║      CASA DE REPUESTOS - SISTEMA DE GESTION v1.0.0      ║" -ForegroundColor Green
    Write-Host "║                                                          ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Step {
    param($Number, $Text)
    Write-Host "[$Number/4] " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param($Text)
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-ErrorMsg {
    param($Text)
    Write-Host "✗ " -ForegroundColor Red -NoNewline
    Write-Host $Text -ForegroundColor Red
}

Write-Header
Write-Host "[INFO] Iniciando sistema...`n" -ForegroundColor Cyan

# Verificar directorio
Write-Step 1 "Verificando instalacion..."
if (-not (Test-Path "backend\manage.py")) {
    Write-ErrorMsg "Backend no encontrado"
    Write-Host "`nAsegurate de ejecutar desde la carpeta raiz del proyecto.`n" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-ErrorMsg "Frontend no encontrado"
    Write-Host "`nAsegurate de ejecutar desde la carpeta raiz del proyecto.`n" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python instalado: $pythonVersion"
} catch {
    Write-ErrorMsg "Python no esta instalado o no esta en el PATH"
    pause
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-ErrorMsg "Node.js no esta instalado o no esta en el PATH"
    pause
    exit 1
}

Write-Host ""

# Iniciar Backend
Write-Step 2 "Iniciando Backend (Django)..."
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\python.exe manage.py runserver" -WindowStyle Normal
Write-Success "Backend iniciado en http://localhost:8000"
Start-Sleep -Seconds 5

# Iniciar Frontend
Write-Step 3 "Iniciando Frontend (React)..."
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
Write-Success "Frontend iniciando..."
Start-Sleep -Seconds 8

# Abrir navegador
Write-Step 4 "Abriendo navegador..."
Start-Process "http://localhost:5173"
Write-Success "Navegador abierto"

Write-Host ""
Clear-Host
Write-Header

Write-Host "SISTEMA INICIADO CORRECTAMENTE`n" -ForegroundColor Green

Write-Host "ACCESO:" -ForegroundColor Yellow
Write-Host "  Frontend: " -ForegroundColor White -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:  " -ForegroundColor White -NoNewline
Write-Host "http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Admin:    " -ForegroundColor White -NoNewline
Write-Host "http://localhost:8000/admin" -ForegroundColor Cyan

Write-Host "`nCREDENCIALES:" -ForegroundColor Yellow
Write-Host "  Administrador: " -ForegroundColor White -NoNewline
Write-Host "admin / admin123" -ForegroundColor Cyan
Write-Host "  Cajero:        " -ForegroundColor White -NoNewline
Write-Host "cajero / cajero123" -ForegroundColor Cyan

Write-Host "`nMODULOS DISPONIBLES:" -ForegroundColor Yellow
Write-Host "  • Dashboard (metricas)" -ForegroundColor White
Write-Host "  • Punto de Venta (POS)" -ForegroundColor White
Write-Host "  • Ventas" -ForegroundColor White
Write-Host "  • Productos" -ForegroundColor White
Write-Host "  • Clientes" -ForegroundColor White
Write-Host "  • Inventario" -ForegroundColor White
Write-Host "  • Devoluciones" -ForegroundColor Green
Write-Host "  • Compras (admin)" -ForegroundColor White
Write-Host "  • Reportes (admin)" -ForegroundColor White
Write-Host "  • Configuracion (admin)" -ForegroundColor White

Write-Host "`n[INFO] El sistema esta corriendo." -ForegroundColor Cyan
Write-Host "[INFO] Los servidores estan en ventanas separadas." -ForegroundColor Gray
Write-Host "`nPresiona cualquier tecla para DETENER el sistema..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n[INFO] Deteniendo sistema..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.MainWindowTitle -like "*Django*" -or $_.MainWindowTitle -like "*npm*" -or $_.MainWindowTitle -like "*Vite*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Sistema detenido.`n" -ForegroundColor Green
Start-Sleep -Seconds 2
