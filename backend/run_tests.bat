@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Ejecutando tests (woocommerce, ventas, productos, inventario, configuracion)...
python manage.py test apps.tienda.tests apps.woocommerce.tests apps.ventas.tests apps.productos.tests apps.inventario.tests apps.configuracion.tests --verbosity=1
if errorlevel 1 exit /b 1
echo.
echo Todos los tests pasaron.
exit /b 0
