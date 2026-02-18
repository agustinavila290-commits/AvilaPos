@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Casa de Repuestos - Instalador automático

cd /d "%~dp0"

echo.
echo ============================================
echo   CASA DE REPUESTOS - Instalación automática
echo ============================================
echo.

:: ----- 1. Python (probar py -3 primero, luego python) -----
set PY_CMD=
where py >nul 2>&1 && set PY_CMD=py -3
if "%PY_CMD%"=="" where python >nul 2>&1 && set PY_CMD=python
if "%PY_CMD%"=="" (
    echo [X] Python no encontrado en el PATH.
    echo.
    echo     Intentando instalar con winget...
    winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements 2>nul
    if errorlevel 1 (
        echo     winget no disponible o fallo.
        echo.
        echo     Instala Python manualmente:
        echo       https://www.python.org/downloads/
        echo     Marca "Add Python to PATH" y reinicia la PC o esta ventana.
        echo     Luego vuelve a ejecutar instalar_todo.bat
    ) else (
        echo     Python instalado. Cierra esta ventana, abre una nueva y ejecuta de nuevo instalar_todo.bat
    )
    echo.
    pause
    exit /b 1
)
echo [OK] Python:
%PY_CMD% --version
echo.

:: ----- 2. Entorno virtual backend -----
if not exist "backend\venv" (
    echo [*] Creando entorno virtual (backend\venv)...
    %PY_CMD% -m venv backend\venv
    if errorlevel 1 (
        echo [X] Error al crear venv.
        pause
        exit /b 1
    )
    echo [OK] Listo.
) else (
    echo [OK] Entorno virtual ya existe.
)
echo.

:: ----- 3. Dependencias Python -----
echo [*] Instalando dependencias del backend...
backend\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
backend\venv\Scripts\pip.exe install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo [X] Error. Reintentando mostrando salida:
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
    pause
    exit /b 1
)
echo [OK] Dependencias Python instaladas.
echo.

:: ----- 4. Node.js -----
where node >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js no encontrado en el PATH.
    echo.
    echo     Intentando instalar con winget...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements 2>nul
    if errorlevel 1 (
        echo     winget no disponible o fallo.
        echo.
        echo     Instala Node.js manualmente:
        echo       https://nodejs.org/
        echo     Luego reinicia esta ventana y ejecuta de nuevo instalar_todo.bat
    ) else (
        echo     Node.js instalado. Cierra esta ventana, abre una nueva y ejecuta de nuevo instalar_todo.bat
    )
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js: 
node --version
npm --version
echo.

:: ----- 5. Dependencias frontend -----
echo [*] Instalando dependencias del frontend (npm)...
cd frontend
call npm install
if errorlevel 1 (
    echo [X] Error en npm install
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencias del frontend instaladas.
echo.

:: ----- 6. Migraciones Django (desde backend) -----
echo [*] Aplicando migraciones (base de datos SQLite)...
set USE_SQLITE=True
cd backend
venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 (
    echo [X] Error en migrate
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Base de datos lista.
echo.

:: ----- 7. Configuración inicial -----
if exist "backend\crear_configuracion_inicial.py" (
    echo [*] Configuración inicial del sistema...
    cd backend
    venv\Scripts\python.exe crear_configuracion_inicial.py 2>nul
    cd ..
    echo [OK] Hecho.
) else (
    echo [*] Para crear usuario administrador luego:
    echo     cd backend ^&^& venv\Scripts\activate ^&^& python manage.py createsuperuser
)
echo.

:: ----- Fin -----
echo ============================================
echo   INSTALACIÓN COMPLETADA
echo ============================================
echo.
echo Para iniciar el sistema ejecuta:   iniciar_sistema.bat
echo.
echo O manualmente:
echo   Backend:  cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo   Frontend: cd frontend ^&^& npm run dev
echo.
pause
