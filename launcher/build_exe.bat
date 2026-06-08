@echo off
chcp 65001 >nul
title AvilaPOS - Compilar ejecutable
cd /d "%~dp0"

echo.
echo  ====================================================
echo   Compilando AvilaPOS.exe con PyInstaller
echo  ====================================================
echo.

set VENV_PIP=..\backend\venv\Scripts\pip.exe
set VENV_PYINSTALLER=..\backend\venv\Scripts\pyinstaller.exe

echo [1/3] Instalando dependencias del launcher...
%VENV_PIP% install pystray==0.19.5 pillow==11.1.0 pyinstaller==6.11.1 --quiet
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

echo [2/3] Compilando ejecutable...
%VENV_PYINSTALLER% ^
    --noconsole ^
    --onefile ^
    --name=AvilaPOS ^
    --icon=icon.ico ^
    --add-data "icon.ico;." ^
    --clean ^
    launcher.py

if errorlevel 1 (
    echo ERROR: PyInstaller fallo. Revisá el output de arriba.
    pause
    exit /b 1
)

echo [3/3] Copiando AvilaPOS.exe a la raiz del proyecto...
copy /Y dist\AvilaPOS.exe ..\AvilaPOS.exe >nul

echo.
echo  ====================================================
echo   Listo: AvilaPOS.exe creado en la raiz del proyecto
echo   Ahora corré scripts\crear_accesos_directos.bat
echo  ====================================================
echo.
pause
