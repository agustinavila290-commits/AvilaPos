@echo off
chcp 65001 >nul
title Avila POS - Inicio como servicio (red local)
cd /d "%~dp0"

echo.
echo   Iniciando Sistema POS para acceso en red...
echo.
echo   Backend (API):  http://0.0.0.0:8000 (accesible desde red)
echo   Frontend (POS): http://localhost:5173
echo.
echo   Cierra las ventanas que se abran para detener el sistema.
echo.

:: Iniciar backend escuchando en todas las interfaces (0.0.0.0) para acceso desde red
start "Avila Backend" cmd /k "cd /d "%~dp0backend" && set USE_SQLITE=True && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

:: Esperar a que el backend levante
timeout /t 6 /nobreak >nul

:: Iniciar frontend
start "Avila Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

exit
