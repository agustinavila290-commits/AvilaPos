@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Ver IP Local para Acceso desde Red
cd /d "%~dp0"

echo.
echo ============================================
echo   IP LOCAL - Acceso desde otras PCs
echo ============================================
echo.

:: Obtener IP local (primera IPv4 que no sea 127.0.0.1)
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    if not "!IP!"=="127.0.0.1" (
        if "!LOCAL_IP!"=="" set LOCAL_IP=!IP!
    )
)

if "!LOCAL_IP!"=="" (
    echo [X] No se pudo obtener la IP local.
    echo     Asegurate de estar conectado a WiFi.
    pause
    exit /b 1
)

echo [OK] IP local: !LOCAL_IP!
echo.
echo   Para acceder desde otra PC en la misma red WiFi:
echo.
echo     1. Ejecuta: iniciar_sistema_red.bat
echo     2. Desde la otra PC, abre el navegador en:
echo.
echo        http://!LOCAL_IP!:5173
echo.
echo   O desde esta PC:
echo        http://localhost:5173
echo.
echo   Asegurate de que el firewall permita conexiones en:
echo     - Puerto 5173 (Frontend)
echo     - Puerto 8000 (Backend)
echo.
pause
