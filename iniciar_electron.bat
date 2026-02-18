@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   CASA DE REPUESTOS - VERSION ELECTRON
echo ========================================
echo.

REM Verificar que exista el backend
if not exist "backend\" (
    echo [ERROR] No se encuentra la carpeta backend
    pause
    exit /b 1
)

REM Verificar que exista el frontend
if not exist "frontend\" (
    echo [ERROR] No se encuentra la carpeta frontend
    pause
    exit /b 1
)

echo [1/2] Iniciando Backend Django...
cd backend
start "Backend Django" cmd /k "venv\Scripts\activate && python manage.py runserver"

REM Esperar 5 segundos a que el backend inicie
timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Aplicacion de Escritorio...
cd ..\frontend

REM Ejecutar Electron
call npm run electron

REM Si electron falla, mostrar error
if errorlevel 1 (
    echo.
    echo [ERROR] Hubo un problema al iniciar Electron
    echo Verifica que todas las dependencias esten instaladas.
    echo.
    pause
)

exit
