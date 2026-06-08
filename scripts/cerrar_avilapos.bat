@echo off
chcp 65001 >nul
echo Cerrando AvilaPOS...

:: Matar proceso en puerto 8000 (Django)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 "') do (
    if "%%a" NEQ "0" (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

:: Matar proceso en puerto 5173 (Vite)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 "') do (
    if "%%a" NEQ "0" (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

:: Limpiar archivo de PIDs si existe
if exist "%~dp0..\launcher\running.pids" del /f /q "%~dp0..\launcher\running.pids" >nul 2>&1

echo AvilaPOS cerrado.
timeout /t 2 /nobreak >nul
