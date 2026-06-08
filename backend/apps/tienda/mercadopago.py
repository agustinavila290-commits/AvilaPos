"""
Utilidades de integración con Mercado Pago para la tienda web.

Implementación actual: NO llama a la API real de MP. Construye la estructura
de la preferencia y devuelve un init_point simulado.

Para activar MP real:
  1. Obtener ACCESS_TOKEN desde mercadopago.com/developers
  2. Configurar MERCADOPAGO_ACCESS_TOKEN en settings.py o variable de entorno
  3. Reemplazar `crear_preferencia_para_venta` con la llamada al SDK oficial:
       import mercadopago
       sdk = mercadopago.SDK(get_mp_access_token())
       response = sdk.preference().create(preference_data)
       return response["response"]
"""

from decimal import Decimal
from django.conf import settings


def get_mp_access_token() -> str:
    return getattr(settings, 'MERCADOPAGO_ACCESS_TOKEN', '') or ''


def crear_preferencia_para_venta(venta, back_urls=None, auto_return=None):
    """
    Construye y devuelve una preferencia de pago de Mercado Pago.

    Args:
        venta: instancia de Venta con detalles precargados.
        back_urls: dict con claves 'success', 'pending', 'failure' (URLs de retorno).
        auto_return: 'approved' para redirigir automáticamente al pagar.

    Returns:
        dict con la respuesta de MP (real o simulada).
    """
    items = []
    for det in venta.detalles.all():
        unit_price = float(det.precio_unitario or Decimal('0'))
        items.append({
            'title': getattr(det.variante, 'nombre_completo', str(det.variante)),
            'quantity': det.cantidad,
            'unit_price': unit_price,
            'currency_id': 'ARS',
        })

    preference_data = {
        'items': items,
        'external_reference': str(venta.id),
        'payer': {
            'name': '',
            'email': '',
        },
    }

    if back_urls:
        preference_data['back_urls'] = {
            'success': back_urls.get('success', ''),
            'pending': back_urls.get('pending', ''),
            'failure': back_urls.get('failure', ''),
        }

    if auto_return == 'approved':
        preference_data['auto_return'] = 'approved'

    # --- Integración real (descomentar cuando haya ACCESS_TOKEN) ---
    # token = get_mp_access_token()
    # if token:
    #     import mercadopago
    #     sdk = mercadopago.SDK(token)
    #     response = sdk.preference().create(preference_data)
    #     return response["response"]

    # Simulado: devuelve estructura compatible con la respuesta real de MP
    preference_id = f"TEST-PREF-{venta.numero}"
    return {
        'id': preference_id,
        'init_point': f"https://www.mercadopago.com/checkout/v1/redirect?pref_id={preference_id}",
        'sandbox_init_point': f"https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id={preference_id}",
        'items': items,
        'external_reference': str(venta.id),
        'back_urls': preference_data.get('back_urls', {}),
        'auto_return': preference_data.get('auto_return', ''),
    }
