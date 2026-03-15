"""
Helpers para leer configuración de integración WooCommerce.
Usado por el script de sync y por los endpoints.
"""
from apps.configuracion.models import ConfiguracionManager


def get_woocommerce_config():
    """
    Devuelve un dict con la configuración necesaria para conectar con WooCommerce.
    Keys: api_key, url, consumer_key, consumer_secret.
    Los valores vacíos se devuelven como string vacío.
    """
    return {
        'api_key': ConfiguracionManager.obtener('WOOCOMMERCE_API_KEY') or '',
        'url': (ConfiguracionManager.obtener('WOOCOMMERCE_URL') or '').rstrip('/'),
        'consumer_key': ConfiguracionManager.obtener('WOOCOMMERCE_CONSUMER_KEY') or '',
        'consumer_secret': ConfiguracionManager.obtener('WOOCOMMERCE_CONSUMER_SECRET') or '',
    }


def woocommerce_sync_configured():
    """True si hay URL y credenciales para llamar a la API de WooCommerce (sync POS → web)."""
    cfg = get_woocommerce_config()
    return bool(cfg['url'] and cfg['consumer_key'] and cfg['consumer_secret'])
