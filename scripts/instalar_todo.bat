@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title AvilaPOS - Instalador

cd /d "%~dp0.."
set ROOT=%CD%

echo.
echo ================================================================
echo   AVILAPOS - INSTALACION AUTOMATICA
echo   Avila Moto Repuestos y Accesorios
echo ================================================================
echo.
echo   Carpeta del proyecto: %ROOT%
echo.

:: ================================================================
:: PASO 1 - Verificar Python
:: ================================================================
echo [1/7] Verificando Python...

set PY_CMD=
where py    >nul 2>&1 && py -3 --version >nul 2>&1 && set PY_CMD=py -3
if "!PY_CMD!"=="" where python >nul 2>&1 && set PY_CMD=python
if "!PY_CMD!"=="" where python3 >nul 2>&1 && set PY_CMD=python3

if "!PY_CMD!"=="" (
    echo.
    echo  [X] Python no encontrado.
    echo.
    echo  Descargalo e instalalo desde:
    echo      https://www.python.org/downloads/
    echo.
    echo  IMPORTANTE al instalar:
    echo    - Marca la opcion "Add Python to PATH"
    echo    - Reinicia esta ventana despues de instalar
    echo    - Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('!PY_CMD! --version 2^>^&1') do set PY_VER=%%v
echo  [OK] !PY_VER!
echo.

:: ================================================================
:: PASO 2 - Crear entorno virtual
:: ================================================================
echo [2/7] Configurando entorno virtual Python...

if not exist "%ROOT%\backend\venv\Scripts\python.exe" (
    echo  Creando entorno virtual...
    !PY_CMD! -m venv "%ROOT%\backend\venv"
    if errorlevel 1 (
        echo  [X] No se pudo crear el entorno virtual.
        echo  Intentalo manualmente: python -m venv backend\venv
        pause
        exit /b 1
    )
    echo  [OK] Entorno virtual creado.
) else (
    echo  [OK] Entorno virtual ya existe.
)
echo.

:: ================================================================
:: PASO 3 - Instalar dependencias Python
:: ================================================================
echo [3/7] Instalando dependencias del backend...
echo  (esto puede tardar unos minutos la primera vez)
echo.

"%ROOT%\backend\venv\Scripts\python.exe" -m pip install --upgrade pip --quiet 2>nul

"%ROOT%\backend\venv\Scripts\pip.exe" install -r "%ROOT%\backend\requirements.txt"
if errorlevel 1 (
    echo.
    echo  [X] Error al instalar dependencias Python.
    echo  Verificar conexion a internet e intentar de nuevo.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencias backend instaladas.
echo.

:: Instalar pystray y pillow para el launcher (VBS fallback)
echo  Instalando dependencias del launcher (pystray, pillow)...
"%ROOT%\backend\venv\Scripts\pip.exe" install pystray==0.19.5 pillow==11.1.0 --quiet
echo  [OK] Listo.
echo.

:: ================================================================
:: PASO 4 - Verificar Node.js
:: ================================================================
echo [4/7] Verificando Node.js...

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [X] Node.js no encontrado.
    echo.
    echo  Descargalo e instalalo desde:
    echo      https://nodejs.org/
    echo  Elegir la version LTS (recomendada).
    echo.
    echo  Despues de instalar:
    echo    - Reinicia esta ventana
    echo    - Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm --version 2^>^&1') do set NPM_VER=%%v
echo  [OK] Node.js !NODE_VER! / npm !NPM_VER!
echo.

:: ================================================================
:: PASO 5 - Instalar dependencias frontend
:: ================================================================
echo [5/7] Instalando dependencias del frontend...
echo  (esto puede tardar varios minutos la primera vez)
echo.

cd /d "%ROOT%\frontend"
call npm install
if errorlevel 1 (
    echo.
    echo  [X] Error en npm install.
    echo  Verificar conexion a internet e intentar de nuevo.
    cd /d "%ROOT%"
    pause
    exit /b 1
)
cd /d "%ROOT%"
echo.
echo  [OK] Dependencias frontend instaladas.
echo.

:: ================================================================
:: PASO 6 - Base de datos
:: ================================================================
echo [6/7] Configurando base de datos...

set USE_SQLITE=True
cd /d "%ROOT%\backend"

venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 (
    echo.
    echo  [X] Error al configurar la base de datos.
    cd /d "%ROOT%"
    pause
    exit /b 1
)
echo  [OK] Base de datos lista.
echo.

:: ================================================================
:: PASO 7 - Crear usuario administrador
:: ================================================================
echo [7/7] Verificando usuario administrador...

if exist "verificar_admin.py" (
    venv\Scripts\python.exe verificar_admin.py
) else (
    :: Crear admin directamente si no existe el script
    venv\Scripts\python.exe -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ['USE_SQLITE'] = 'True'
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    u = User.objects.create_superuser('admin', 'admin@local.com', 'admin123')
    u.is_superuser = True
    u.is_staff = True
    u.save()
    print('[OK] Usuario admin creado (contrasena: admin123)')
else:
    print('[OK] Usuario admin ya existe')
"
)

cd /d "%ROOT%"

:: ================================================================
:: CREAR CARPETA DE LOGS
:: ================================================================
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs"

:: ================================================================
:: FIN
:: ================================================================
echo.
echo ================================================================
echo   INSTALACION COMPLETADA EXITOSAMENTE
echo ================================================================
echo.
echo   Credenciales de acceso:
echo     Usuario:    admin
echo     Contrasena: admin123
echo.
echo   Para iniciar el sistema:
echo     - Doble clic en "AvilaPOS.exe"
echo     - O ejecutar "iniciar_sistema.bat"
echo.
echo   Se recomienda cambiar la contrasena luego del primer acceso.
echo.
echo   Si aparecen iconos en el Escritorio ejecuta:
echo     scripts\crear_accesos_directos.bat
echo.
pause
