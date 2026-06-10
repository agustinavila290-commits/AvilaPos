#!/usr/bin/env python
"""Script para crear superusuario automáticamente"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.usuarios.models import Usuario

# Crear superusuario si no existe
username = 'admin'
email = 'admin@casarepuestos.com'
password = 'admin123'

usuario, created = Usuario.objects.get_or_create(
    username=username,
    defaults={
        'email': email,
        'rol': Usuario.Rol.ADMINISTRADOR,
        'first_name': 'Administrador',
        'last_name': 'Sistema',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
    }
)

# Resetear contraseña siempre a admin123 (por si cambió)
usuario.set_password(password)
usuario.is_active = True
usuario.is_staff = True
usuario.is_superuser = True
usuario.rol = Usuario.Rol.ADMINISTRADOR
usuario.save()

if created:
    print('[OK] Superusuario creado exitosamente!')
else:
    print('[OK] Usuario existente - contraseña reseteada a admin123')
print(f'  Username: {username}')
print(f'  Password: {password}')
print('  Rol: Administrador')
print('  Estado: Activo')
