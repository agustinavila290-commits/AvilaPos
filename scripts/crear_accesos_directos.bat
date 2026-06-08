@echo off
chcp 65001 >nul
title AvilaPOS - Crear accesos directos

set DEST=%USERPROFILE%\Desktop
set ROOT=%~dp0..

:: Normalizar ruta (eliminar barra final)
if "%ROOT:~-1%"=="\" set ROOT=%ROOT:~0,-1%

echo Creando accesos directos en el Escritorio...

:: ─── Acceso directo "Abrir AvilaPOS" ─────────────────────────────────────────
:: Apunta a iniciar_avilapos.vbs (Fase 1) o a AvilaPOS.exe si existe

if exist "%ROOT%\AvilaPOS.exe" (
    set TARGET=%ROOT%\AvilaPOS.exe
    set TARGET_ARGS=
) else (
    set TARGET=wscript.exe
    set TARGET_ARGS=%ROOT%\iniciar_avilapos.vbs
)

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%DEST%\Abrir AvilaPOS.lnk'); ^
   $s.TargetPath = '%TARGET%'; ^
   $s.Arguments = '%TARGET_ARGS%'; ^
   $s.WorkingDirectory = '%ROOT%'; ^
   $s.Description = 'Iniciar sistema AvilaPOS'; ^
   if (Test-Path '%ROOT%\launcher\icon.ico') { $s.IconLocation = '%ROOT%\launcher\icon.ico' }; ^
   $s.Save()"

:: ─── Acceso directo "Cerrar AvilaPOS" ────────────────────────────────────────
powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%DEST%\Cerrar AvilaPOS.lnk'); ^
   $s.TargetPath = '%ROOT%\scripts\cerrar_avilapos.bat'; ^
   $s.WorkingDirectory = '%ROOT%'; ^
   $s.WindowStyle = 7; ^
   $s.Description = 'Detener sistema AvilaPOS'; ^
   $s.Save()"

echo.
echo Accesos directos creados en el Escritorio:
echo   - Abrir AvilaPOS
echo   - Cerrar AvilaPOS
echo.
pause
