@echo off
chcp 65001 >nul
title Resetear Contraseña Admin
cd /d "%~dp0backend"

echo.
echo ============================================
echo   RESETEAR CONTRASEÑA ADMIN
echo ============================================
echo.

set USE_SQLITE=True
call venv\Scripts\activate.bat

echo [*] Reseteando contraseña del usuario 'admin' a 'admin123'...
echo.

python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings'); django.setup(); from apps.usuarios.models import Usuario; from django.contrib.auth import authenticate; u = Usuario.objects.filter(username='admin').first(); print('Usuario encontrado:', u is not None); u.set_password('admin123') if u else None; u.is_active = True if u else None; u.is_staff = True if u else None; u.is_superuser = True if u else None; u.rol = 'ADMINISTRADOR' if u else None; u.save() if u else None; print('Contraseña reseteada' if u else 'Usuario no existe - ejecuta crear_admin.bat'); auth = authenticate(username='admin', password='admin123') if u else None; print('Autenticación OK' if auth else 'ERROR en autenticación')"

echo.
echo [OK] Proceso completado.
echo.
echo   Credenciales:
echo     Username: admin
echo     Password: admin123
echo.
pause
