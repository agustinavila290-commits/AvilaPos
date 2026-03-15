@echo off
chcp 65001 >nul
cd /d "%~dp0.."

set "REPO_URL=https://github.com/agustinavila290-commits/AvilaPos.git"

echo.
echo  Subir proyecto Avila a GitHub (AvilaPos)
echo  ----------------------------------------
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Git no esta en el PATH. Instala Git desde https://git-scm.com/download/win
  echo  y vuelve a ejecutar este script.
  pause
  exit /b 1
)

git remote remove origin 2>nul
git remote add origin "%REPO_URL%"
echo  Remote configurado: %REPO_URL%
echo.

git add .
git status
echo.
set /p MSG="Mensaje del commit (Enter = 'Subir proyecto Avila'): "
if "%MSG%"=="" set "MSG=Subir proyecto Avila"
git commit -m "%MSG%"
if errorlevel 1 (
  echo  No hay cambios para commitear, o ya esta todo subido.
  pause
  exit /b 0
)

git branch -M main
echo.
echo  Subiendo a origin main...
git push -u origin main
if errorlevel 1 (
  echo.
  echo  Si te pide usuario/contraseña: usa tu usuario de GitHub y como contraseña
  echo  un Personal Access Token (GitHub - Settings - Developer settings - PAT).
  echo.
)
pause
