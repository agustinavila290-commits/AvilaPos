@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Crear/Verificar Usuario Administrador
cd /d "%~dp0backend"

echo.
echo ============================================
echo   Crear/Verificar Usuario Administrador
echo ============================================
echo.

set USE_SQLITE=True
call venv\Scripts\activate.bat

echo [*] Verificando y creando/reseteando usuario admin...
echo     Username: admin
echo     Password: admin123
echo.
python verificar_admin.py

echo.
echo [*] Ejecutando create_superuser.py para asegurar...
python create_superuser.py

echo.
echo [*] Probando login directamente...
python probar_login.py

echo.
echo ============================================
echo   CREDENCIALES PARA LOGIN
echo ============================================
echo     Username: admin
echo     Password: admin123
echo.
echo   Si sigue sin funcionar, verifica:
echo     1. Que el backend esté corriendo
echo     2. Que puedas acceder a http://TU_IP:8000/api/auth/login/
echo     3. Revisa la consola del navegador (F12) para ver errores
echo.
pause
