"""
Autenticación por API Key para endpoints de integración WooCommerce.
El script de sincronización o el webhook envían el header X-API-Key.
"""
from rest_framework.permissions import BasePermission
from apps.configuracion.models import ConfiguracionManager


class WooCommerceAPIKeyPermission(BasePermission):
    """
    Permite el acceso si el request tiene header X-API-Key
    y coincide con el valor configurado en Configuracion (WOOCOMMERCE_API_KEY).
    """
    message = 'API Key inválida o no configurada. Configure WOOCOMMERCE_API_KEY en Configuración.'

    def has_permission(self, request, view):
        api_key = request.META.get('HTTP_X_API_KEY') or request.headers.get('X-API-Key')
        if not api_key:
            return False
        config_key = ConfiguracionManager.obtener('WOOCOMMERCE_API_KEY')
        if not config_key:
            return False
        return api_key.strip() == str(config_key).strip()
