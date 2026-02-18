@echo off
chcp 65001 >nul
title Casa de Repuestos - Backend + Frontend
cd /d "%~dp0"

echo.
echo   Backend (API):  http://127.0.0.1:8000
echo   Frontend (web): http://localhost:5173
echo.
echo   Cierra las ventanas que se abran para detener el sistema.
echo.

start "Backend Django" cmd /k "cd /d "%~dp0backend" && set USE_SQLITE=True && venv\Scripts\activate && python manage.py runserver"
timeout /t 4 /nobreak >nul
start "Frontend Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

exit
