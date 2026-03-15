@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Casa de Repuestos - Acceso desde Red Local
cd /d "%~dp0"

echo.
echo ============================================
echo   CASA DE REPUESTOS - Acceso desde Red Local
echo ============================================
echo.

:: Obtener IP local (primera IPv4 que no sea 127.0.0.1)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    if not "!IP!"=="127.0.0.1" (
        set LOCAL_IP=!IP!
        goto :found_ip
    )
)
:found_ip

if "!LOCAL_IP!"=="" (
    echo [X] No se pudo obtener la IP local.
    echo     Asegurate de estar conectado a WiFi.
    pause
    exit /b 1
)

echo [OK] IP local detectada: !LOCAL_IP!
echo.
echo   URLs para acceder desde otras PCs en la red:
echo     Frontend: http://!LOCAL_IP!:5173
echo     Backend:  http://!LOCAL_IP!:8000/api
echo.
echo   Desde esta PC puedes usar:
echo     Frontend: http://localhost:5173
echo     Backend:  http://localhost:8000/api
echo.
echo   [*] Abriendo puertos en el firewall (requiere permisos de admin)...
netsh advfirewall firewall add rule name="Casa Repuestos Frontend" dir=in action=allow protocol=TCP localport=5173 2>nul
netsh advfirewall firewall add rule name="Casa Repuestos Backend" dir=in action=allow protocol=TCP localport=8000 2>nul
if errorlevel 1 (
    echo     Si no tienes permisos de admin, abre manualmente los puertos 5173 y 8000
    echo     en el Firewall de Windows o ejecuta este .bat como Administrador.
) else (
    echo     [OK] Puertos abiertos en el firewall.
)
echo.
echo   Cierra las ventanas que se abran para detener el sistema.
echo.

:: Iniciar Django en 0.0.0.0 (todas las interfaces)
start "Backend Django" cmd /k "cd /d "%~dp0backend" && start_server.bat"

timeout /t 5 /nobreak >nul

:: Guardar IP en archivo temporal para que Vite la lea
echo !LOCAL_IP! > "%TEMP%\avila_ip.txt"

:: Iniciar Vite usando script auxiliar que lee la IP
start "Frontend Vite" cmd /k "cd /d "%~dp0frontend" && start_dev_con_ip.bat"

echo.
echo   Sistema iniciado. Abre http://!LOCAL_IP!:5173 desde otra PC.
echo   Presiona cualquier tecla para cerrar esta ventana (los servidores seguirán corriendo).
pause >nul

exit
