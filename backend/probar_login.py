#!/usr/bin/env python
"""Script para probar el login directamente vía API"""
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.usuarios.models import Usuario
from django.contrib.auth import authenticate

username = 'admin'
password = 'admin123'

print("=" * 50)
print("PRUEBA DE LOGIN")
print("=" * 50)
print()

# 1. Verificar usuario en BD
print("[1] Verificando usuario en base de datos...")
usuario = Usuario.objects.filter(username=username).first()
if usuario:
    print(f"  [OK] Usuario existe: {usuario.username}")
    print(f"  Activo: {usuario.is_active}")
    print(f"  Rol: {usuario.rol}")
else:
    print(f"  [X] Usuario NO existe")
    print()
    exit(1)

print()

# 2. Probar autenticación Django
print("[2] Probando autenticación Django (authenticate)...")
user_auth = authenticate(username=username, password=password)
if user_auth:
    print(f"  [OK] Autenticación Django exitosa")
    print(f"  Usuario autenticado: {user_auth.username}")
else:
    print(f"  [X] Autenticación Django FALLÓ")
    print(f"  Reseteando contraseña...")
    usuario.set_password(password)
    usuario.is_active = True
    usuario.is_staff = True
    usuario.is_superuser = True
    usuario.rol = Usuario.Rol.ADMINISTRADOR
    usuario.save()
    print(f"  [OK] Contraseña reseteada")
    
    # Probar de nuevo
    user_auth = authenticate(username=username, password=password)
    if user_auth:
        print(f"  [OK] Autenticación exitosa después del reset")
    else:
        print(f"  [X] ERROR: Autenticación sigue fallando")

print()

# 3. Probar login vía API (si el servidor está corriendo)
print("[3] Probando login vía API (http://localhost:8000/api/auth/auth/login/)...")
try:
    response = requests.post(
        'http://localhost:8000/api/auth/auth/login/',
        json={'username': username, 'password': password},
        timeout=5
    )
    if response.status_code == 200:
        data = response.json()
        print(f"  [OK] Login API exitoso")
        print(f"  Token recibido: {data.get('access', 'N/A')[:50]}...")
        print(f"  Usuario: {data.get('user', {}).get('username', 'N/A')}")
    else:
        print(f"  [X] Login API falló: {response.status_code}")
        print(f"  Respuesta: {response.text[:200]}")
except requests.exceptions.ConnectionError:
    print(f"  [INFO] Servidor no está corriendo en localhost:8000")
    print(f"  Inicia el servidor con: python manage.py runserver")
except Exception as e:
    print(f"  [X] Error: {e}")

print()
print("=" * 50)
print("RESUMEN")
print("=" * 50)
print(f"Username: {username}")
print(f"Password: {password}")
print(f"Autenticación Django: {'OK' if user_auth else 'FALLO'}")
print()
