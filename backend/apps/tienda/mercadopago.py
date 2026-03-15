"""
Utilidades de integración con Mercado Pago para la tienda web.

Por ahora se implementa una integración mínima que NO llama a la API real,
pero estructura los datos y devuelve un init_point simulando el flujo.
Más adelante se puede reemplazar la función `crear_preferencia_para_venta`
para usar el SDK oficial o requests contra la API de Mercado Pago.
"""

from decimal import Decimal
from django.conf import settings


def get_mp_access_token() -> str:
    """
    Devuelve el access token configurado para Mercado Pago.
    """
    return getattr(settings, 'MERCADOPAGO_ACCESS_TOKEN', '') or ''


def crear_preferencia_para_venta(venta):
    """
    Crea una 'preferencia' de pago para una Venta.

    Implementación actual: NO llama a la API real, solo construye un
    diccionario con datos básicos e inventa un init_point.
    """
    items = []
    for det in venta.detalles.all():
        # Precio unitario como float para compatibilidad con APIs JSON
        unit_price = float(det.precio_unitario or Decimal('0'))
        items.append(
            {
                'title': getattr(det.variante, 'nombre_completo', str(det.variante)),
                'quantity': det.cantidad,
                'unit_price': unit_price,
                'currency_id': 'ARS',
            }
        )

    preference_id = f"TEST-PREF-{venta.numero}"
    init_point = f"https://www.mercadopago.com/checkout/v1/redirect?pref_id={preference_id}"

    return {
        'id': preference_id,
        'init_point': init_point,
        'items': items,
        'external_reference': str(venta.id),
    }

