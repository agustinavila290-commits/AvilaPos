"""
API pública de la tienda web (avila-web).
Endpoints sin autenticación para catálogo y pedidos.
Endpoints con auth para administrador.
"""
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models as db_models
from django.core.paginator import Paginator

from apps.productos.models import VarianteProducto, Marca, Categoria, ProductoBase
from apps.inventario.models import Deposito, Stock
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock
from apps.ventas.models import Venta, DetalleVenta
from apps.usuarios.models import Usuario
from .models import PuntoRetiro
from .mercadopago import crear_preferencia_para_venta


def _get_deposito_principal():
    """Depósito principal para stock web."""
    return Deposito.objects.filter(es_principal=True, activo=True).first()


def _get_usuario_venta_web():
    """Usuario para registrar ventas web (primer admin)."""
    return Usuario.objects.filter(is_active=True).filter(
        db_models.Q(is_superuser=True) | db_models.Q(rol=Usuario.Rol.ADMINISTRADOR)
    ).order_by('id').first()


def _variante_a_dict(v, stock_cantidad=0, incluir_marca_cat=True):
    """Convierte variante a dict para API tienda."""
    data = {
        'id': v.id,
        'codigo': v.codigo,
        'nombre_completo': v.nombre_completo,
        'precio_web': str(v.precio_web),
        'stock': stock_cantidad,
    }
    if incluir_marca_cat:
        data['marca'] = v.producto_base.marca.nombre if v.producto_base else ''
        data['categoria'] = v.producto_base.categoria.nombre if v.producto_base else ''
        data['descripcion'] = (v.producto_base.descripcion or '')[:300]
        if v.producto_base.imagen:
            data['imagen_url'] = v.producto_base.imagen.url
        else:
            data['imagen_url'] = None
    return data


@api_view(['GET'])
@permission_classes([AllowAny])
def productos_list(request):
    """
    Lista variantes con stock y precio_web (público).
    Query: page, page_size, categoria, marca, search
    """
    deposito = _get_deposito_principal()
    if not deposito:
        return Response(
            {'error': 'No hay depósito principal configurado'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    qs = VarianteProducto.objects.filter(
        activo=True,
        producto_base__activo=True,
        precio_web__gt=0,
    ).select_related('producto_base', 'producto_base__marca', 'producto_base__categoria').prefetch_related(
        db_models.Prefetch(
            'stocks',
            queryset=Stock.objects.filter(deposito=deposito)
        )
    )

    categoria = request.query_params.get('categoria')
    if categoria:
        qs = qs.filter(producto_base__categoria_id=categoria)

    marca = request.query_params.get('marca')
    if marca:
        qs = qs.filter(producto_base__marca_id=marca)

    search = request.query_params.get('search', '').strip()
    if search:
        from django.db.models import Q
        qs = qs.filter(
            Q(codigo__icontains=search) |
            Q(nombre_variante__icontains=search) |
            Q(producto_base__nombre__icontains=search) |
            Q(producto_base__marca__nombre__icontains=search)
        )

    qs = qs.order_by('producto_base__nombre', 'nombre_variante')

    page_size = min(int(request.query_params.get('page_size', 24)), 100)
    paginator = Paginator(qs, page_size)
    page_num = request.query_params.get('page', 1)
    page = paginator.get_page(page_num)

    items = []
    for v in page.object_list:
        stock_qs = v.stocks.filter(deposito=deposito)
        cantidad = stock_qs.first().cantidad if stock_qs.exists() else 0
        items.append(_variante_a_dict(v, cantidad))

    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page.number,
        'results': items,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def producto_detail(request, pk):
    """Detalle de una variante (público)."""
    deposito = _get_deposito_principal()
    try:
        v = VarianteProducto.objects.select_related(
            'producto_base', 'producto_base__marca', 'producto_base__categoria'
        ).prefetch_related(
            db_models.Prefetch(
                'stocks',
                queryset=Stock.objects.filter(deposito=deposito) if deposito else Stock.objects.none()
            )
        ).get(pk=pk, activo=True, producto_base__activo=True)
    except VarianteProducto.DoesNotExist:
        return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    stock_qs = v.stocks.filter(deposito=deposito)
    cantidad = stock_qs.first().cantidad if stock_qs.exists() else 0
    data = _variante_a_dict(v, cantidad)
    data['descripcion'] = v.producto_base.descripcion or ''
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def categorias_list(request):
    """Lista categorías activas (público)."""
    cats = Categoria.objects.filter(activo=True).order_by('nombre').values('id', 'nombre')
    return Response(list(cats))


@api_view(['GET'])
@permission_classes([AllowAny])
def marcas_list(request):
    """Lista marcas activas (público)."""
    marcas = Marca.objects.filter(activo=True).order_by('nombre').values('id', 'nombre')
    return Response(list(marcas))


@api_view(['GET'])
@permission_classes([AllowAny])
def puntos_retiro_list(request):
    """Lista puntos de retiro activos para la tienda web."""
    puntos = PuntoRetiro.objects.filter(activo=True).order_by('nombre')
    data = [
        {
            'id': p.id,
            'nombre': p.nombre,
            'direccion_texto': p.direccion_texto or '',
            'lat': p.lat,
            'lng': p.lng,
            'telefono': p.telefono or '',
            'horarios': p.horarios or '',
        }
        for p in puntos
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def mercadopago_crear_preferencia(request):
    """
    Crea una preferencia de pago de Mercado Pago para una venta web existente.
    Body: { venta_id: number }
    """
    data = request.data or {}
    venta_id = data.get('venta_id')
    if not venta_id:
        return Response({'error': 'venta_id es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        venta = Venta.objects.get(pk=venta_id)
    except Venta.DoesNotExist:
        return Response({'error': 'Venta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    # Verificar que la venta tenga movimientos de tipo VENTA_WEB (pedido web)
    es_web = MovimientoStock.objects.filter(
        referencia_tipo='venta',
        referencia_id=venta.id,
        tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
    ).exists()
    if not es_web:
        return Response({'error': 'La venta no corresponde a un pedido web'}, status=status.HTTP_400_BAD_REQUEST)

    pref = crear_preferencia_para_venta(venta)
    return Response(pref, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def mercadopago_webhook(request):
    """
    Webhook de Mercado Pago (versión simplificada).

    Por ahora solo acepta el payload y devuelve 200 OK para pruebas.
    Más adelante se puede usar payment_id / topic para consultar el pago
    real y actualizar el estado de la venta.
    """
    # En entorno real se deberían validar tokens / firma y actualizar la venta.
    return Response({'ok': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def pedido_create(request):
    """
    Crea un pedido (venta web).
    Body: { line_items: [{ variante_id, cantidad }], datos_cliente?: {}, observaciones?: "" }
    """
    from django.db import transaction

    data = request.data or {}
    line_items = data.get('line_items') or []
    datos_cliente = data.get('datos_cliente') or {}
    observaciones = data.get('observaciones') or 'Pedido tienda web'

    # Información de entrega
    tipo_entrega = (data.get('tipo_entrega') or '').strip().lower()  # 'retiro' | 'envio' | ''
    punto_retiro = (data.get('punto_retiro') or '').strip()
    punto_retiro_id = data.get('punto_retiro_id')
    # Datos de envío simples (fase 2)
    direccion_envio = (datos_cliente.get('direccion') or '').strip()
    localidad_envio = (datos_cliente.get('localidad') or '').strip()
    cp_envio = (datos_cliente.get('cp') or '').strip()
    provincia_envio = (datos_cliente.get('provincia') or '').strip()
    # Coordenadas opcionales de entrega (mapa)
    lat_entrega = data.get('lat_entrega')
    lng_entrega = data.get('lng_entrega')
    # Costo de envío base simple (se puede mejorar luego)
    costo_envio = Decimal('0')

    if datos_cliente:
        cliente_str = datos_cliente.get('nombre', '') or ''
        if datos_cliente.get('email'):
            cliente_str += f" - {datos_cliente['email']}"
        if datos_cliente.get('telefono'):
            cliente_str += f" - Tel: {datos_cliente['telefono']}"
        if cliente_str.strip():
            observaciones = f"{observaciones} | Cliente: {cliente_str.strip()}"

    # Descripción de entrega en observaciones
    if tipo_entrega:
        if tipo_entrega not in ('retiro', 'envio'):
            return Response(
                {'error': "tipo_entrega inválido. Debe ser 'retiro' o 'envio'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if tipo_entrega == 'retiro':
            punto_retiro_obj = None
            if punto_retiro_id:
                try:
                    punto_retiro_obj = PuntoRetiro.objects.get(id=punto_retiro_id, activo=True)
                except PuntoRetiro.DoesNotExist:
                    return Response(
                        {'error': 'Punto de retiro inválido o inactivo.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif punto_retiro:
                # Compatibilidad hacia atrás: texto libre
                observaciones = f"{observaciones} | Entrega: RETIRO EN LOCAL - {punto_retiro}"
            else:
                return Response(
                    {'error': 'Para retiro en local debe especificar punto_retiro_id.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if punto_retiro_obj:
                desc = f"{punto_retiro_obj.nombre}"
                if punto_retiro_obj.direccion_texto:
                    desc += f" - {punto_retiro_obj.direccion_texto}"
                observaciones = f"{observaciones} | Entrega: RETIRO EN LOCAL - {desc}"
        elif tipo_entrega == 'envio':
            # Validaciones mínimas de dirección para envío
            if not direccion_envio or not localidad_envio:
                return Response(
                    {'error': 'Para envío a domicilio debe indicar al menos dirección y localidad.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Cálculo simple de costo de envío (ejemplo fijo)
            costo_envio = Decimal('0')
            if provincia_envio:
                # Ejemplo: si provincia distinta de vacío, costo base
                costo_envio = Decimal('1500')
            else:
                costo_envio = Decimal('1000')
            observaciones = (
                f"{observaciones} | Entrega: ENVÍO A DOMICILIO"
                f" - Dirección: {direccion_envio}, {localidad_envio}"
                f"{f' (CP {cp_envio})' if cp_envio else ''}"
                f"{f', {provincia_envio}' if provincia_envio else ''}"
                f" | Costo envío estimado: ${costo_envio}"
            )
            # Agregar coordenadas si se recibieron
            if lat_entrega is not None and lng_entrega is not None:
                try:
                    lat_f = float(lat_entrega)
                    lng_f = float(lng_entrega)
                    observaciones = f"{observaciones} | Ubicación mapa: lat={lat_f:.6f}, lng={lng_f:.6f}"
                except (TypeError, ValueError):
                    # Si vienen mal formateadas, simplemente las ignoramos
                    pass

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
            {'error': 'No hay usuario para registrar ventas web'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    items_para_venta = []
    errores = []

    for idx, item in enumerate(line_items):
        cantidad = item.get('cantidad')
        if not cantidad or int(cantidad) < 1:
            errores.append(f'Item {idx + 1}: cantidad inválida')
            continue

        variante_id = item.get('variante_id')
        if not variante_id:
            errores.append(f'Item {idx + 1}: variante_id requerido')
            continue

        try:
            variante = VarianteProducto.objects.get(pk=variante_id, activo=True)
        except (VarianteProducto.DoesNotExist, ValueError):
            errores.append(f'Item {idx + 1}: producto no encontrado')
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
                f'{variante.nombre_completo}: stock insuficiente (hay {stock_actual}, pediste {cantidad})'
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
            # Aplicar costo de envío simple si corresponde
            total = subtotal + costo_envio
            venta = Venta.objects.create(
                cliente=None,
                usuario=usuario,
                deposito=deposito,
                subtotal=subtotal,
                descuento_porcentaje=0,
                descuento_monto=0,
                total=total,
                metodo_pago=Venta.MetodoPago.TRANSFERENCIA,
                estado=Venta.EstadoVenta.COMPLETADA,
            )

            for it in items_para_venta:
                st = (it['precio_unitario'] - it['descuento_unitario']) * it['cantidad']
                DetalleVenta.objects.create(
                    venta=venta,
                    variante=it['variante'],
                    cantidad=it['cantidad'],
                    precio_unitario=it['precio_unitario'],
                    descuento_unitario=it['descuento_unitario'],
                    subtotal=st,
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
            {'error': 'Error al crear el pedido', 'detalle': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- Admin (requiere autenticación) ---


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pedidos_list(request):
    """
    Lista pedidos de la tienda web (ventas con movimiento VENTA_WEB).
    Requiere login.
    """
    from apps.ventas.serializers import VentaListSerializer

    ids_web = MovimientoStock.objects.filter(
        tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        referencia_tipo='venta',
    ).values_list('referencia_id', flat=True).distinct()

    qs = Venta.objects.filter(
        id__in=ids_web,
    ).select_related('cliente', 'usuario', 'deposito').prefetch_related('detalles__variante').order_by('-fecha')

    page_size = min(int(request.query_params.get('page_size', 20)), 100)
    paginator = Paginator(qs, page_size)
    page_num = request.query_params.get('page', 1)
    page = paginator.get_page(page_num)

    serializer = VentaListSerializer(page.object_list, many=True)
    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page.number,
        'results': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pedido_detail(request, pk):
    """Detalle de pedido web. Requiere login."""
    from apps.ventas.serializers import VentaSerializer

    venta = Venta.objects.select_related(
        'cliente', 'usuario', 'deposito'
    ).prefetch_related('detalles__variante', 'detalles__variante__producto_base').filter(pk=pk).first()

    if not venta:
        return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # Verificar que es pedido web
    if not MovimientoStock.objects.filter(
        referencia_id=pk,
        tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        referencia_tipo='venta',
    ).exists():
        return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    serializer = VentaSerializer(venta)
    return Response(serializer.data)
