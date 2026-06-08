@echo off
chcp 65001 >nul
title AvilaPOS - Verificacion del sistema
cd /d "%~dp0.."

:: Intentar con el venv del proyecto primero, luego Python del sistema
if exist "backend\venv\Scripts\python.exe" (
    backend\venv\Scripts\python.exe scripts\verificar_sistema.py
) else (
    set PY_CMD=
    where py >nul 2>&1 && set PY_CMD=py -3
    if "!PY_CMD!"=="" where python >nul 2>&1 && set PY_CMD=python
    if "!PY_CMD!"=="" (
        echo.
        echo  Python no encontrado. Instalar desde https://www.python.org/downloads/
        echo  Marcar "Add Python to PATH" al instalar.
        echo.
        pause
        exit /b 1
    )
    !PY_CMD! scripts\verificar_sistema.py
)
pause
