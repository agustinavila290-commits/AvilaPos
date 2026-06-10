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
    # Buscar .env en backend/ (servidor) o en el directorio padre (dev local)
    for _env_path in [BASE_DIR / '.env', BASE_DIR.parent / '.env']:
        if _env_path.exists():
            # override=False: las variables del sistema (systemd/bat) tienen prioridad
            load_dotenv(_env_path, override=False)
            break
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
    'jazzmin',              # debe ir ANTES de django.contrib.admin
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
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': False,  # desactivado para usar loaders explícito con orden correcto
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            # filesystem primero → DIRS tienen prioridad sobre jazzmin y otras apps
            'loaders': [
                ('django.template.loaders.cached.Loader', [
                    'django.template.loaders.filesystem.Loader',
                    'django.template.loaders.app_directories.Loader',
                ]),
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
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (uploads)
MEDIA_URL = '/media/'
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
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^http://192\.168\.\d+\.\d+:\d+$",
        r"^http://10\.\d+\.\d+\.\d+:\d+$",
        r"^http://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$",
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        "https://avilamotorepuesto.com.ar",
        "https://www.avilamotorepuesto.com.ar",
        "https://pos.avilamotorepuesto.com.ar",
    ]
    CORS_ALLOWED_ORIGIN_REGEXES = []
CORS_ALLOW_CREDENTIALS = True

# Security headers — solo en producción (Nginx termina SSL, pasa X-Forwarded-Proto)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Google OAuth — Client ID para verificar tokens de la tienda web
# Obtener en: https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

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

# Crear directorios necesarios si no existen
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
os.makedirs(BASE_DIR / 'media', exist_ok=True)

# Configuración básica de Mercado Pago (tokens opcionales)
MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', '')
MERCADOPAGO_PUBLIC_KEY = os.environ.get('MERCADOPAGO_PUBLIC_KEY', '')

# =============================================================================
# JAZZMIN — Tema moderno para Django Admin
# =============================================================================
JAZZMIN_SETTINGS = {
    # Título en la pestaña del navegador y header
    "site_title": "AvilaPOS Admin",
    "site_header": "AvilaPOS",
    "site_brand": "Avila Moto Repuestos",
    "welcome_sign": "Bienvenido al panel de administración",
    "copyright": "Avila Moto Repuestos y Accesorios",

    # Links de búsqueda en el header (permite buscar por modelo)
    "search_model": ["ventas.Venta", "productos.ProductoBase", "clientes.Cliente"],

    # Iconos por modelo (Font Awesome 5)
    "icons": {
        # Auth / usuarios
        "usuarios.Usuario":              "fas fa-user-cog",
        "auth.Group":                    "fas fa-users",

        # Ventas
        "ventas.Venta":                  "fas fa-cash-register",
        "ventas.DetalleVenta":           "fas fa-list-ol",

        # Facturación
        "facturacion.Factura":           "fas fa-file-invoice-dollar",
        "facturacion.ConfiguracionAFIP": "fas fa-landmark",
        "facturacion.PuntoVenta":        "fas fa-store",
        "facturacion.ItemFactura":       "fas fa-receipt",

        # Productos
        "productos.ProductoBase":        "fas fa-box",
        "productos.VarianteProducto":    "fas fa-tags",
        "productos.Marca":               "fas fa-trademark",
        "productos.Categoria":           "fas fa-th-large",

        # Inventario
        "inventario.Deposito":           "fas fa-warehouse",
        "inventario.Stock":              "fas fa-layer-group",
        "inventario.MovimientoStock":    "fas fa-exchange-alt",

        # Clientes
        "clientes.Cliente":              "fas fa-address-card",

        # Compras
        "compras.Proveedor":             "fas fa-truck",
        "compras.Compra":                "fas fa-shopping-cart",
        "compras.DetalleCompra":         "fas fa-clipboard-list",

        # Devoluciones
        "devoluciones.Devolucion":       "fas fa-undo-alt",

        # Cuenta corriente
        "cuenta_corriente.TicketCC":     "fas fa-file-alt",

        # Configuración
        "configuracion.Configuracion":   "fas fa-sliders-h",

        # Sistema
        "sistema.AuditLog":              "fas fa-history",
        "sistema.BackupLog":             "fas fa-database",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    # Mostrar/ocultar el buscador del sidebar
    "show_sidebar": True,
    "navigation_expanded": True,

    # Apps sin modelos en admin — ocultar del sidebar
    "hide_apps": ["auth", "token_blacklist"],

    # Modelos de "Detalle" — solo accesibles via inline, no necesitan entrada propia
    "hide_models": [
        "ventas.DetalleVenta",
        "compras.DetalleCompra",
        "devoluciones.DetalleDevolucion",
        "facturacion.ItemFactura",
    ],

    # Orden del menú lateral — apps primero, luego modelos dentro de cada app
    "order_with_respect_to": [
        # Ventas y cobro
        "ventas",
        "ventas.Venta",
        # Facturación AFIP
        "facturacion",
        "facturacion.Factura",
        "facturacion.ConfiguracionAFIP",
        "facturacion.PuntoVenta",
        # Catálogo
        "productos",
        "productos.ProductoBase",
        "productos.VarianteProducto",
        "productos.Marca",
        "productos.Categoria",
        # Stock
        "inventario",
        "inventario.Deposito",
        "inventario.Stock",
        "inventario.MovimientoStock",
        # Clientes y ventas relacionadas
        "clientes",
        "clientes.Cliente",
        # Compras a proveedores
        "compras",
        "compras.Compra",
        "compras.Proveedor",
        # Post-venta
        "devoluciones",
        "devoluciones.DevolucionVenta",
        "devoluciones.NotaCredito",
        # Crédito / tickets mecánicos
        "cuenta_corriente",
        "cuenta_corriente.TicketCuentaCorriente",
        # Administración
        "usuarios",
        "usuarios.Usuario",
        "configuracion",
        "configuracion.Configuracion",
        "sistema",
        "sistema.AuditLog",
        "sistema.BackupLog",
    ],

    # Links personalizados en el sidebar
    "custom_links": {
        "ventas": [{
            "name": "Ver Punto de Venta (POS)",
            "url": "http://localhost:5173",
            "icon": "fas fa-desktop",
            "new_window": True,
        }],
    },

    # Links en el top bar
    "topmenu_links": [
        {"name": "Inicio", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "POS", "url": "http://localhost:5173", "new_window": True},
        {"model": "ventas.Venta"},
        {"model": "facturacion.Factura"},
    ],

    # Links del menú de usuario (esquina superior derecha)
    "usermenu_links": [
        {"name": "Soporte", "url": "#", "icon": "fas fa-circle-notch"},
    ],

    # Mostrar foto de perfil
    "show_ui_builder": False,

    # Formularios: mostrar fieldsets con estilo card
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },

    # Idioma para el menú lateral
    "language_chooser": False,

    # Template personalizado del dashboard (override de jazzmin)
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": False,
}

JAZZMIN_UI_TWEAKS = {
    # Tema Bootstrap: minty | flatly | darkly | cosmo | litera | sandstone | united | lumen | pulse | slate
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,

    # Colores marca AvilaPOS
    "brand_colour": "navbar-dark",     # navbar lateral oscuro
    "accent": "accent-primary",        # acento azul

    # Navbar top
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,

    # Sidebar
    "sidebar": "sidebar-dark-primary", # sidebar oscuro con acento brand
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": True,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,

    # Tema general
    "theme": "default",
    "dark_mode_theme": None,

    # Botones
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },

    # Acciones en los formularios
    "actions_sticky_top": True,
}
