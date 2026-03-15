#!/usr/bin/env python
"""Script para verificar y crear/resetear usuario admin"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.usuarios.models import Usuario
from django.contrib.auth import authenticate

username = 'admin'
password = 'admin123'

print("=" * 50)
print("VERIFICACIÓN DE USUARIO ADMIN")
print("=" * 50)
print()

# Verificar si existe
usuario = Usuario.objects.filter(username=username).first()

if usuario:
    print(f"[OK] Usuario '{username}' existe")
    print(f"  ID: {usuario.id}")
    print(f"  Email: {usuario.email}")
    print(f"  Rol: {usuario.rol}")
    print(f"  Activo: {usuario.is_active}")
    print(f"  Staff: {usuario.is_staff}")
    print(f"  Superuser: {usuario.is_superuser}")
    print()
    
    # Probar autenticación con la contraseña actual
    print("[*] Probando autenticación...")
    user_auth = authenticate(username=username, password=password)
    if user_auth:
        print("[OK] Autenticación exitosa con contraseña actual")
    else:
        print("[X] Autenticación FALLÓ - reseteando contraseña...")
        usuario.set_password(password)
        usuario.is_active = True
        usuario.is_staff = True
        usuario.is_superuser = True
        usuario.rol = Usuario.Rol.ADMINISTRADOR
        usuario.save()
        print("[OK] Contraseña reseteada a 'admin123'")
        
        # Probar de nuevo
        user_auth = authenticate(username=username, password=password)
        if user_auth:
            print("[OK] Autenticación exitosa después del reset")
        else:
            print("[X] ERROR: Autenticación sigue fallando después del reset")
else:
    print(f"[X] Usuario '{username}' NO existe - creándolo...")
    usuario = Usuario.objects.create_user(
        username=username,
        email='admin@casarepuestos.com',
        password=password,
        rol=Usuario.Rol.ADMINISTRADOR,
        first_name='Administrador',
        last_name='Sistema',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    print(f"[OK] Usuario '{username}' creado")
    
    # Probar autenticación
    user_auth = authenticate(username=username, password=password)
    if user_auth:
        print("[OK] Autenticación exitosa")
    else:
        print("[X] ERROR: Autenticación falló después de crear usuario")

print()
print("=" * 50)
print("RESUMEN")
print("=" * 50)
print(f"Username: {username}")
print(f"Password: {password}")
print(f"Estado: {'OK - Puedes hacer login' if user_auth else 'ERROR - Revisa los mensajes arriba'}")
print()
