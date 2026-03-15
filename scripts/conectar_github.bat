@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo  Conectar Avila con GitHub
echo  ------------------------
echo.

set "REPO_URL=https://github.com/agustinavila290-commits/AvilaPos.git"
echo  Repo configurado: AvilaPos (agustinavila290-commits)
echo  Para usar otro repo, pega la URL cuando te lo pida.
echo.

set /p REPO_URL="URL del repo (Enter = usar AvilaPos): "
if "%REPO_URL%"=="" set "REPO_URL=https://github.com/agustinavila290-commits/AvilaPos.git"

git remote remove origin 2>nul
git remote add origin "%REPO_URL%"
git remote -v
echo.
echo  Remote configurado. Para subir el codigo:
echo    git add .
echo    git commit -m "Subir proyecto"
echo    git branch -M main
echo    git push -u origin main
echo.
pause
