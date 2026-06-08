"""
Helpers de autenticación para ClienteWeb.
Usa PyJWT para tokens propios, separados del JWT de DRF simplejwt para usuarios POS.
"""
import hashlib
import os
import requests as http_requests
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings

from .models import ClienteWeb

SECRET = getattr(settings, 'SECRET_KEY', 'dev-secret')
ALGORITHM = 'HS256'
TOKEN_LIFETIME_DAYS = 30


# --------------------------------------------------------------------------- #
# Password                                                                      #
# --------------------------------------------------------------------------- #

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(':', 1)
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h
    except Exception:
        return False


# --------------------------------------------------------------------------- #
# JWT                                                                           #
# --------------------------------------------------------------------------- #

def generate_token(cliente: ClienteWeb) -> str:
    payload = {
        'sub': cliente.id,
        'email': cliente.email,
        'nombre': cliente.nombre,
        'exp': datetime.now(tz=timezone.utc) + timedelta(days=TOKEN_LIFETIME_DAYS),
        'iat': datetime.now(tz=timezone.utc),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    """Devuelve el payload si el token es válido, None si no."""
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_cliente_from_request(request) -> ClienteWeb | None:
    """Extrae y verifica el token del header Authorization: Bearer <token>."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:]
    payload = verify_token(token)
    if not payload:
        return None
    try:
        return ClienteWeb.objects.get(id=payload['sub'], activo=True)
    except ClienteWeb.DoesNotExist:
        return None


# --------------------------------------------------------------------------- #
# Google OAuth                                                                  #
# --------------------------------------------------------------------------- #

def verify_google_token(id_token: str) -> dict | None:
    """
    Verifica un Google ID token llamando al endpoint público de Google.
    Devuelve el payload (sub, email, name, picture) o None si es inválido.
    """
    try:
        resp = http_requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': id_token},
            timeout=5,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        # Validar que el token es para nuestra app
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if google_client_id and data.get('aud') != google_client_id:
            return None
        return data
    except Exception:
        return None
