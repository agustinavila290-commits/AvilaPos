# Script de Diagnóstico Rápido
# Para solucionar pantalla en blanco

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           DIAGNOSTICO DE PANTALLA EN BLANCO             ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Verificar archivos
Write-Host "[1/5] Verificando archivos..." -ForegroundColor Yellow
$archivos = @(
    "C:\Users\Agustin\Avila\frontend\src\App.jsx",
    "C:\Users\Agustin\Avila\frontend\src\main.jsx",
    "C:\Users\Agustin\Avila\frontend\index.html",
    "C:\Users\Agustin\Avila\backend\manage.py"
)

foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "  ✓ $($archivo.Split('\')[-1])" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($archivo.Split('\')[-1]) NO ENCONTRADO" -ForegroundColor Red
    }
}

# 2. Verificar procesos
Write-Host "`n[2/5] Verificando procesos..." -ForegroundColor Yellow
$pythonProcs = Get-Process python -ErrorAction SilentlyContinue
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue

Write-Host "  Python: $($pythonProcs.Count) procesos" -ForegroundColor $(if ($pythonProcs.Count -gt 0) {"Green"} else {"Red"})
Write-Host "  Node:   $($nodeProcs.Count) procesos" -ForegroundColor $(if ($nodeProcs.Count -gt 0) {"Green"} else {"Red"})

# 3. Verificar puertos
Write-Host "`n[3/5] Verificando puertos..." -ForegroundColor Yellow

try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/admin" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✓ Backend (8000): Funcionando" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend (8000): No responde" -ForegroundColor Red
}

$frontendPuerto = 0
foreach ($puerto in 5173, 5174, 5175, 5176) {
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:$puerto" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  ✓ Frontend ($puerto): Funcionando" -ForegroundColor Green
        $frontendPuerto = $puerto
        break
    } catch {
        Write-Host "  ✗ Frontend ($puerto): No responde" -ForegroundColor Gray
    }
}

# 4. Diagnóstico
Write-Host "`n[4/5] Diagnóstico..." -ForegroundColor Yellow

if ($pythonProcs.Count -eq 0) {
    Write-Host "  ⚠ Backend no está corriendo" -ForegroundColor Red
    Write-Host "    Solución: Ejecutar 'iniciar_sistema.bat'" -ForegroundColor Yellow
}

if ($nodeProcs.Count -eq 0) {
    Write-Host "  ⚠ Frontend no está corriendo" -ForegroundColor Red
    Write-Host "    Solución: Ejecutar 'iniciar_sistema.bat'" -ForegroundColor Yellow
}

if ($frontendPuerto -eq 0) {
    Write-Host "  ⚠ Frontend no responde en ningún puerto" -ForegroundColor Red
    Write-Host "    Solución: Reiniciar sistema" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Frontend disponible en http://localhost:$frontendPuerto" -ForegroundColor Green
}

# 5. Acciones recomendadas
Write-Host "`n[5/5] Acciones recomendadas:" -ForegroundColor Yellow

if ($pythonProcs.Count -eq 0 -or $nodeProcs.Count -eq 0) {
    Write-Host "  1. Cerrar todas las ventanas" -ForegroundColor White
    Write-Host "  2. Ejecutar 'iniciar_sistema.bat'" -ForegroundColor White
    Write-Host "  3. Esperar 15 segundos" -ForegroundColor White
} elseif ($frontendPuerto -gt 0) {
    Write-Host "  1. Abrir navegador en: http://localhost:$frontendPuerto" -ForegroundColor White
    Write-Host "  2. Presionar F12 para ver consola" -ForegroundColor White
    Write-Host "  3. Buscar errores en rojo" -ForegroundColor White
    Write-Host "`n  ¿Deseas abrir el navegador ahora? [S/N]" -ForegroundColor Cyan
    $respuesta = Read-Host
    if ($respuesta -eq 'S' -or $respuesta -eq 's') {
        Start-Process "http://localhost:$frontendPuerto"
        Write-Host "`n  ✓ Navegador abierto" -ForegroundColor Green
    }
} else {
    Write-Host "  1. Ejecutar: cd frontend && npm install" -ForegroundColor White
    Write-Host "  2. Reiniciar sistema" -ForegroundColor White
}

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              DIAGNOSTICO COMPLETADO                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Si necesitas más ayuda, revisa: SOLUCION_PANTALLA_BLANCA.md`n" -ForegroundColor Gray
