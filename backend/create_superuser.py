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

if not Usuario.objects.filter(username=username).exists():
    Usuario.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        rol=Usuario.Rol.ADMINISTRADOR,
        first_name='Administrador',
        last_name='Sistema'
    )
    print('[OK] Superusuario creado exitosamente!')
    print(f'  Username: {username}')
    print(f'  Password: {password}')
    print('  Rol: Administrador')
else:
    print(f'[INFO] El usuario "{username}" ya existe.')
