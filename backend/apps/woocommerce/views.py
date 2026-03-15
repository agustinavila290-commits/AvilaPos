"""
Endpoints para integración WooCommerce.
- GET productos-stock: lista productos (variantes) con stock para sincronizar a la web.
- POST pedido-recibido: recibe un pedido de la tienda web, crea la venta en el POS y descuenta stock.
Autenticación: header X-API-Key (valor en Configuración WOOCOMMERCE_API_KEY).
"""
from decimal import Decimal
from django.db import transaction, models as db_models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .auth import WooCommerceAPIKeyPermission
from apps.configuracion.models import ConfiguracionManager
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito, Stock
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock
from apps.ventas.models import Venta, DetalleVenta
from apps.usuarios.models import Usuario


def _get_deposito_principal():
    """Depósito principal para ventas web."""
    return Deposito.objects.filter(es_principal=True, activo=True).first()


def _get_usuario_venta_web():
    """Usuario del sistema para registrar ventas web (primer admin/superuser)."""
    return Usuario.objects.filter(is_active=True).filter(
        db_models.Q(is_superuser=True) | db_models.Q(rol=Usuario.Rol.ADMINISTRADOR)
    ).order_by('id').first()


@api_view(['GET'])
@permission_classes([WooCommerceAPIKeyPermission])
def productos_stock(request):
    """
    Lista variantes con stock para sincronizar a WooCommerce.
    Query params: deposito_id (opcional; si no se envía, usa depósito principal).
    Response: [{ "id", "codigo", "nombre_completo", "precio_web", "stock" }, ...]
    """
    deposito_id = request.query_params.get('deposito_id')
    if deposito_id:
        try:
            deposito = Deposito.objects.get(pk=deposito_id, activo=True)
        except (Deposito.DoesNotExist, ValueError):
            return Response(
                {'error': 'Depósito no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        deposito = _get_deposito_principal()
        if not deposito:
            return Response(
                {'error': 'No hay depósito principal configurado'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    variantes = VarianteProducto.objects.filter(
        activo=True,
        producto_base__activo=True
    ).select_related('producto_base', 'producto_base__marca').prefetch_related(
        db_models.Prefetch(
            'stocks',
            queryset=Stock.objects.filter(deposito=deposito)
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

    return Response(resultado, status=status.HTTP_200_OK)


def _procesar_pedido_web(line_items, observaciones='Venta tienda web'):
    """
    Lógica compartida: valida line_items, crea venta y descuenta stock.
    line_items: list of { codigo|variante_id, cantidad, precio_unitario? }
    Returns: Response (201 con venta o 4xx/5xx con error)
    """
    if not line_items:
        return Response(
            {'error': 'line_items es obligatorio y no puede estar vacío'},
            status=status.HTTP_400_BAD_REQUEST
        )

    deposito = _get_deposito_principal()
    if not deposito:
        return Response(
            {'error': 'No hay depósito principal configurado'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    usuario = _get_usuario_venta_web()
    if not usuario:
        return Response(
            {'error': 'No hay usuario administrador para registrar ventas web'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    items_para_venta = []
    errores = []

    for idx, item in enumerate(line_items):
        cantidad = item.get('cantidad')
        if not cantidad or int(cantidad) < 1:
            errores.append(f'Item {idx + 1}: cantidad inválida')
            continue

        variante = None
        if 'variante_id' in item:
            try:
                variante = VarianteProducto.objects.get(pk=item['variante_id'], activo=True)
            except (VarianteProducto.DoesNotExist, ValueError):
                errores.append(f'Item {idx + 1}: variante_id {item["variante_id"]} no encontrada')
                continue
        elif 'codigo' in item:
            try:
                variante = VarianteProducto.objects.get(codigo=item['codigo'].strip(), activo=True)
            except VarianteProducto.DoesNotExist:
                errores.append(f'Item {idx + 1}: código "{item["codigo"]}" no encontrado')
                continue
        else:
            errores.append(f'Item {idx + 1}: se requiere variante_id o codigo')
            continue

        precio = variante.precio_web
        if 'precio_unitario' in item:
            try:
                precio = Decimal(str(item['precio_unitario']))
            except Exception:
                pass

        stock_actual = InventarioService.obtener_stock_actual(variante, deposito)
        if stock_actual < int(cantidad):
            errores.append(
                f'Item {idx + 1} ({variante.codigo}): stock insuficiente (hay {stock_actual}, se piden {cantidad})'
            )
            continue

        items_para_venta.append({
            'variante': variante,
            'cantidad': int(cantidad),
            'precio_unitario': precio,
            'descuento_unitario': Decimal('0'),
        })

    if errores:
        return Response(
            {'error': 'Errores de validación', 'detalle': errores},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not items_para_venta:
        return Response(
            {'error': 'No hay ítems válidos para procesar'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            subtotal = sum(
                (it['precio_unitario'] - it['descuento_unitario']) * it['cantidad']
                for it in items_para_venta
            )
            venta = Venta.objects.create(
                cliente=None,
                usuario=usuario,
                deposito=deposito,
                subtotal=subtotal,
                descuento_porcentaje=0,
                descuento_monto=0,
                total=subtotal,
                metodo_pago=Venta.MetodoPago.TRANSFERENCIA,
                estado=Venta.EstadoVenta.COMPLETADA,
            )

            for it in items_para_venta:
                subtotal_item = (it['precio_unitario'] - it['descuento_unitario']) * it['cantidad']
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=it['variante'],
                    cantidad=it['cantidad'],
                    precio_unitario=it['precio_unitario'],
                    descuento_unitario=it['descuento_unitario'],
                    subtotal=subtotal_item,
                    costo_unitario=it['variante'].costo,
                )
                InventarioService.registrar_movimiento(
                    variante=it['variante'],
                    deposito=deposito,
                    tipo_movimiento=MovimientoStock.TipoMovimiento.VENTA_WEB,
                    cantidad=-it['cantidad'],
                    usuario=usuario,
                    referencia_tipo='venta',
                    referencia_id=venta.id,
                    observaciones=f'Venta web #{venta.numero}. {observaciones}',
                )

        return Response({
            'ok': True,
            'venta_id': venta.id,
            'venta_numero': venta.numero,
            'total': format(venta.total, '.2f'),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': 'Error al crear la venta', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([WooCommerceAPIKeyPermission])
def pedido_recibido(request):
    """
    Recibe un pedido de la tienda web (webhook o script).
    Body: {
      "line_items": [
        { "codigo": "SKU123", "cantidad": 2 }
        o
        { "variante_id": 123, "cantidad": 2 }
      ],
      "observaciones": "opcional"
    }
    Crea la venta en el POS y descuenta stock (tipo VENTA_WEB).
    """
    data = request.data or {}
    line_items = data.get('line_items') or []
    observaciones = data.get('observaciones', 'Venta tienda web')
    return _procesar_pedido_web(line_items, observaciones)


def _woo_order_to_line_items(order):
    """Convierte payload de pedido WooCommerce a nuestro formato line_items."""
    if not order or not isinstance(order, dict):
        return []
    line_items = order.get('line_items') or []
    result = []
    for li in line_items:
        if not isinstance(li, dict):
            continue
        sku = (li.get('sku') or '').strip()
        qty = int(li.get('quantity') or 0)
        if not sku or qty < 1:
            continue
        price = li.get('price') or '0'
        try:
            Decimal(str(price))
        except Exception:
            price = '0'
        result.append({
            'codigo': sku,
            'cantidad': qty,
            'precio_unitario': str(price),
        })
    return result


@api_view(['POST'])
@permission_classes([WooCommerceAPIKeyPermission])
def webhook_pedido_woocommerce(request):
    """
    Webhook: recibe el payload de WooCommerce (Order created).
    Body: { "id": 123, "number": "456", "line_items": [ { "sku": "CODE", "quantity": 2, "price": "110" }, ... ] }
    Convierte a formato interno y crea la venta en el POS (misma lógica que pedido-recibido).
    """
    order = request.data or {}
    line_items = _woo_order_to_line_items(order)
    order_id = order.get('number') or order.get('id') or ''
    observaciones = f'Pedido WooCommerce #{order_id}'
    return _procesar_pedido_web(line_items, observaciones)
