"""
Django settings for casa de repuestos de motos project.
"""

from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env si existe
# IMPORTANTE: Las variables del sistema (establecidas por scripts .bat) tienen prioridad sobre .env
try:
    from dotenv import load_dotenv
    env_path = BASE_DIR.parent.parent / '.env'  # Avila/.env
    if env_path.exists():
        # override=False: las variables del sistema NO se sobrescriben por .env
        # Esto permite que los scripts .bat establezcan ALLOWED_HOSTS=* y USE_SQLITE=True
        load_dotenv(env_path, override=False)
except ImportError:
    pass  # python-dotenv no instalado, usar solo variables de entorno del sistema
except Exception as e:
    print(f"[WARNING] Error al cargar .env: {e}")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# En desarrollo: permitir acceso desde cualquier host (red local, etc.)
# En producción cambiar esto a dominios específicos
if DEBUG:
    ALLOWED_HOSTS = ['*']  # Desarrollo: permitir cualquier IP/host
else:
    # Producción: solo hosts específicos
    allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1')
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
    # Fallback seguro: agregar dominios conocidos si no se configuró ALLOWED_HOSTS en el servidor
    for h in [
        'avilamotorepuesto.com.ar',
        'www.avilamotorepuesto.com.ar',
        'sistema.avilamotorepuesto.com.ar',
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
    ]:
        if h not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(h)

# En producción, confiar en el dominio para CSRF (admin y cookies)
# La API /api/ está eximida por DisableCSRFForAPIMiddleware
if not DEBUG and '*' not in ALLOWED_HOSTS:
    CSRF_TRUSTED_ORIGINS = [
        f'https://{h}' for h in ALLOWED_HOSTS
    ] + [
        f'http://{h}' for h in ALLOWED_HOSTS
    ]
else:
    CSRF_TRUSTED_ORIGINS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # requerido si BLACKLIST_AFTER_ROTATION=True
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.usuarios',
    'apps.clientes',
    'apps.productos',
    'apps.inventario',
    'apps.ventas',
    'apps.compras',
    'apps.reportes',
    'apps.configuracion',
    'apps.devoluciones',
    'apps.cuenta_corriente',
    'apps.sistema',
    'apps.facturacion',
    'apps.clover',
    'apps.woocommerce',
    'apps.tienda',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # Internacionalización (español)
    'corsheaders.middleware.CorsMiddleware',  # CORS debe estar antes de CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'backend.middleware.DisableCSRFForAPIMiddleware',  # API usa JWT, sin CSRF
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
# Para desarrollo: usa SQLite (simple, sin instalación)
# Para producción: cambia a PostgreSQL

# Leer USE_SQLITE de variables de entorno (puede venir del .env o del sistema)
# IMPORTANTE: Por defecto usar SQLite (True) a menos que se especifique explícitamente False
USE_SQLITE_ENV = os.environ.get('USE_SQLITE', 'True')
# Si viene como string vacío o None, usar True por defecto
if not USE_SQLITE_ENV or USE_SQLITE_ENV.strip() == '':
    USE_SQLITE_ENV = 'True'
# Convertir a booleano: acepta True, true, 1, yes, on (cualquier otro valor = False)
# Si explícitamente dice False, usar PostgreSQL; sino usar SQLite
USE_SQLITE_STR = str(USE_SQLITE_ENV).strip().lower()
USE_SQLITE = USE_SQLITE_STR not in ('false', '0', 'no', 'off')  # Invertido: True por defecto

# Debug: mostrar qué base de datos se está usando (solo en desarrollo)
if DEBUG:
    print(f"[DEBUG] USE_SQLITE_ENV={USE_SQLITE_ENV!r}, USE_SQLITE={USE_SQLITE}")
    print(f"[DEBUG] DATABASE será: {'SQLite' if USE_SQLITE else 'PostgreSQL'}")
    # Verificar que realmente se está usando SQLite
    if USE_SQLITE:
        print(f"[DEBUG] Forzando SQLite - verificando configuración...")

# FORZAR SQLite por defecto si no se especifica explícitamente False
# Esto evita problemas si la variable de entorno no se lee correctamente
if USE_SQLITE:
    # SQLite para desarrollo
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    if DEBUG:
        print(f"[OK] Usando SQLite: {BASE_DIR / 'db.sqlite3'}")
else:
    # PostgreSQL para producción
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'casa_repuestos'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                # Opciones específicas para psycopg3
            },
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (uploads)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'usuarios.Usuario'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),  # Token válido por 8 horas (jornada laboral)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",  # avila-web (tienda pública)
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
# Permitir acceso desde celular/tablet en la red local (ej. http://192.168.1.5:5173)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://192\.168\.\d+\.\d+:\d+$",
    r"^http://10\.\d+\.\d+\.\d+:\d+$",
    r"^http://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$",
]
CORS_ALLOW_CREDENTIALS = True

# Configuración de archivos
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Crear directorio de logs si no existe
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Configuración básica de Mercado Pago (tokens opcionales)
MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
MERCADOPAGO_PUBLIC_KEY = os.environ.get('MERCADOPAGO_PUBLIC_KEY', '')
