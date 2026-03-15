"""
Servicios para sincronización POS → WooCommerce.
Obtiene productos con stock del POS y actualiza stock/precio en WooCommerce.
"""
import requests
from django.db import models as db_models

from apps.inventario.models import Deposito, Stock
from apps.productos.models import VarianteProducto
from .config import get_woocommerce_config


def get_productos_con_stock(deposito_id=None):
    """
    Lista de variantes con stock para sync (misma lógica que el endpoint productos-stock).
    Returns: list of dicts { id, codigo, nombre_completo, precio_web, stock }
    """
    if deposito_id:
        try:
            deposito = Deposito.objects.get(pk=deposito_id, activo=True)
        except (Deposito.DoesNotExist, ValueError):
            return []
    else:
        deposito = Deposito.objects.filter(es_principal=True, activo=True).first()
    if not deposito:
        return []

    variantes = VarianteProducto.objects.filter(
        activo=True,
        producto_base__activo=True,
    ).select_related('producto_base', 'producto_base__marca').prefetch_related(
        db_models.Prefetch(
            'stocks',
            queryset=Stock.objects.filter(deposito=deposito),
        )
    )

    resultado = []
    for v in variantes:
        stock_qs = v.stocks.filter(deposito=deposito)
        cantidad = stock_qs.first().cantidad if stock_qs.exists() else 0
        resultado.append({
            'id': v.id,
            'codigo': v.codigo,
            'nombre_completo': v.nombre_completo,
            'precio_web': str(v.precio_web),
            'stock': cantidad,
        })
    return resultado


def fetch_woo_products_map(base_url, consumer_key, consumer_secret, session=None):
    """
    Obtiene todos los productos de WooCommerce y devuelve un dict sku -> { id, ... }.
    Usa paginación (per_page=100).
    session: requests.Session opcional (para tests con mock).
    """
    session = session or requests.Session()
    base_url = base_url.rstrip('/')
    auth = (consumer_key, consumer_secret)
    api_base = f'{base_url}/wp-json/wc/v3'
    sku_map = {}
    page = 1
    while True:
        r = session.get(
            f'{api_base}/products',
            params={'per_page': 100, 'page': page},
            auth=auth,
            timeout=30,
        )
        if r.status_code != 200:
            raise RuntimeError(f'WooCommerce API error: {r.status_code} {r.text[:200]}')
        data = r.json()
        if not data:
            break
        for p in data:
            sku = (p.get('sku') or '').strip()
            if sku:
                sku_map[sku] = {'id': p['id'], 'name': p.get('name', '')}
        if len(data) < 100:
            break
        page += 1
    return sku_map


def update_woo_product_stock_price(base_url, consumer_key, consumer_secret, product_id, stock_quantity, regular_price, session=None):
    """
    Actualiza stock y precio de un producto en WooCommerce.
    session: requests.Session opcional (para tests).
    """
    session = session or requests.Session()
    base_url = base_url.rstrip('/')
    auth = (consumer_key, consumer_secret)
    api_base = f'{base_url}/wp-json/wc/v3'
    payload = {
        'stock_quantity': int(stock_quantity),
        'regular_price': str(regular_price),
    }
    r = session.put(
        f'{api_base}/products/{product_id}',
        json=payload,
        auth=auth,
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f'WooCommerce PUT error: {r.status_code} {r.text[:200]}')
    return r.json()


def run_sync(deposito_id=None, session=None):
    """
    Ejecuta la sincronización: productos del POS → WooCommerce.
    Returns: (updated_count, error_count, errors_list)
    """
    cfg = get_woocommerce_config()
    url = cfg['url']
    ck = cfg['consumer_key']
    cs = cfg['consumer_secret']
    if not url or not ck or not cs:
        raise ValueError('Faltan WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY o WOOCOMMERCE_CONSUMER_SECRET en Configuración.')

    productos = get_productos_con_stock(deposito_id)
    if not productos:
        return 0, 0, []

    sku_map = fetch_woo_products_map(url, ck, cs, session=session)
    session = session or requests.Session()
    updated = 0
    errors = []
    for p in productos:
        codigo = p['codigo']
        if codigo not in sku_map:
            continue
        woo_id = sku_map[codigo]['id']
        try:
            update_woo_product_stock_price(
                url, ck, cs, woo_id,
                stock_quantity=p['stock'],
                regular_price=p['precio_web'],
                session=session,
            )
            updated += 1
        except Exception as e:
            errors.append(f"{codigo}: {e}")
    return updated, len(errors), errors
