"""
Views para módulo de reportes.
Consultas y análisis de datos del sistema.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, F, Q, FloatField, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal

from apps.ventas.models import Venta, DetalleVenta
from apps.productos.models import VarianteProducto
from apps.inventario.models import Stock, MovimientoStock
from apps.clientes.models import Cliente
from apps.usuarios.permissions import IsAdministrador, IsCajero
from apps.sistema.excel_export import ExcelExporter


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCajero])
def resumen_dashboard(request):
    """
    Resumen general para el dashboard.
    Métricas principales del día y del mes.
    """
    hoy = timezone.now().date()
    inicio_mes = hoy.replace(day=1)
    
    # Ventas del día
    ventas_hoy = Venta.objects.filter(
        fecha__date=hoy,
        estado=Venta.EstadoVenta.COMPLETADA
    )
    
    # Ventas del mes
    ventas_mes = Venta.objects.filter(
        fecha__date__gte=inicio_mes,
        estado=Venta.EstadoVenta.COMPLETADA
    )
    
    # Métricas del día
    total_dia = ventas_hoy.aggregate(
        total=Coalesce(Sum('total'), Decimal('0')),
        cantidad=Count('id')
    )
    
    # Métricas del mes
    total_mes = ventas_mes.aggregate(
        total=Coalesce(Sum('total'), Decimal('0')),
        cantidad=Count('id')
    )
    
    # Stock crítico (umbral desde configuración)
    from apps.configuracion.models import ConfiguracionManager
    umbral_critico = ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2)
    stock_critico = Stock.objects.filter(
        cantidad__lte=umbral_critico,
        variante__activo=True
    ).count()
    
    # Productos sin stock
    sin_stock = Stock.objects.filter(
        cantidad__lte=0,
        variante__activo=True
    ).count()
    
    # Clientes activos
    clientes_activos = Cliente.objects.filter(activo=True).count()
    
    return Response({
        'hoy': {
            'fecha': hoy,
            'ventas_total': total_dia['total'],
            'ventas_cantidad': total_dia['cantidad'],
            'promedio_ticket': total_dia['total'] / total_dia['cantidad'] if total_dia['cantidad'] > 0 else 0
        },
        'mes': {
            'desde': inicio_mes,
            'ventas_total': total_mes['total'],
            'ventas_cantidad': total_mes['cantidad'],
            'promedio_ticket': total_mes['total'] / total_mes['cantidad'] if total_mes['cantidad'] > 0 else 0
        },
        'inventario': {
            'stock_critico': stock_critico,
            'sin_stock': sin_stock
        },
        'clientes': {
            'activos': clientes_activos
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrador])
def ventas_por_periodo(request):
    """
    Reporte de ventas por período.
    Parámetros: fecha_desde, fecha_hasta, usuario_id, metodo_pago
    """
    # Parámetros
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')
    usuario_id = request.query_params.get('usuario_id')
    metodo_pago = request.query_params.get('metodo_pago')
    
    # Validar fechas
    if not fecha_desde or not fecha_hasta:
        return Response(
            {'error': 'Se requieren fecha_desde y fecha_hasta'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
        fecha_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filtros
    ventas = Venta.objects.filter(
        fecha__date__gte=fecha_desde,
        fecha__date__lte=fecha_hasta,
        estado=Venta.EstadoVenta.COMPLETADA
    )
    
    if usuario_id:
        ventas = ventas.filter(usuario_id=usuario_id)
    
    if metodo_pago:
        ventas = ventas.filter(metodo_pago=metodo_pago)
    
    # Agregaciones
    resumen = ventas.aggregate(
        cantidad_ventas=Count('id'),
        total_ventas=Coalesce(Sum('total'), Decimal('0')),
        total_descuentos=Coalesce(Sum('descuento_monto'), Decimal('0')),
        promedio_ticket=Avg('total')
    )
    
    # Por método de pago
    por_metodo = ventas.values('metodo_pago').annotate(
        cantidad=Count('id'),
        total=Sum('total')
    ).order_by('-total')
    
    # Por día
    por_dia = ventas.extra(
        select={'fecha_venta': 'DATE(fecha)'}
    ).values('fecha_venta').annotate(
        cantidad=Count('id'),
        total=Sum('total')
    ).order_by('fecha_venta')
    
    # Detalle de ventas (solo las primeras 100)
    ventas_detalle = ventas.select_related('usuario', 'cliente').values(
        'id',
        'numero',
        'fecha',
        'total',
        'metodo_pago',
        'usuario__first_name',
        'usuario__last_name',
        'cliente__nombre'
    ).order_by('-fecha')[:100]
    
    return Response({
        'periodo': {
            'desde': fecha_desde,
            'hasta': fecha_hasta
        },
        'resumen': {
            'cantidad_ventas': resumen['cantidad_ventas'],
            'total_ventas': resumen['total_ventas'],
            'total_descuentos': resumen['total_descuentos'],
            'promedio_ticket': resumen['promedio_ticket'] or 0
        },
        'por_metodo_pago': list(por_metodo),
        'por_dia': list(por_dia),
        'ventas': list(ventas_detalle)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrador])
def productos_mas_vendidos(request):
    """
    Reporte de productos más vendidos.
    Parámetros: tipo (cantidad|facturacion), limite, fecha_desde, fecha_hasta
    """
    tipo = request.query_params.get('tipo', 'cantidad')  # cantidad o facturacion
    limite = int(request.query_params.get('limite', 20))
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')
    
    # Filtros base (excluir detalles sin variante por si acaso)
    detalles = DetalleVenta.objects.filter(
        venta__estado=Venta.EstadoVenta.COMPLETADA,
        variante__isnull=False
    )
    
    # Filtros de fecha
    if fecha_desde:
        try:
            fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__gte=fecha_desde)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__lte=fecha_hasta)
        except ValueError:
            pass
    
    # Agregación por variante (variante__codigo es el campo en BD; sku es propiedad)
    productos = detalles.values(
        'variante__id',
        'variante__codigo',
        'variante__nombre_variante',
        'variante__producto_base__nombre'
    ).annotate(
        cantidad_vendida=Sum('cantidad'),
        total_facturado=Sum(F('cantidad') * F('precio_unitario'))
    )
    
    # Ordenar según tipo
    if tipo == 'facturacion':
        productos = productos.order_by('-total_facturado')
    else:
        productos = productos.order_by('-cantidad_vendida')
    
    # Limitar resultados y exponer variante__sku para el frontend (alias de codigo)
    productos = list(productos[:limite])
    for p in productos:
        p['variante__sku'] = p.get('variante__codigo', '')
    
    return Response({
        'tipo': tipo,
        'limite': limite,
        'productos': productos
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCajero])
def stock_critico(request):
    """
    Reporte de productos con stock crítico o sin stock.
    Parámetros: umbral (opcional; si no se envía, usa UMBRAL_STOCK_CRITICO de configuración)
    """
    from apps.configuracion.models import ConfiguracionManager
    umbral_default = ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2)
    try:
        umbral = int(request.query_params.get('umbral', umbral_default))
    except (TypeError, ValueError):
        umbral = umbral_default
    deposito_id = request.query_params.get('deposito_id')
    
    # Filtros
    stocks = Stock.objects.filter(
        cantidad__lte=umbral,
        variante__activo=True
    ).select_related('variante', 'deposito')
    
    if deposito_id:
        stocks = stocks.filter(deposito_id=deposito_id)
    
    # Ordenar por cantidad (los más críticos primero)
    stocks = stocks.order_by('cantidad')
    
    # Serializar datos
    resultado = []
    for stock in stocks:
        resultado.append({
            'variante_id': stock.variante.id,
            'sku': stock.variante.sku,
            'nombre': stock.variante.nombre_completo,
            'deposito': stock.deposito.nombre,
            'cantidad': stock.cantidad,
            'costo': stock.variante.costo,
            'precio_venta': stock.variante.precio_venta,
            'estado': 'SIN_STOCK' if stock.cantidad <= 0 else 'CRITICO'
        })
    
    return Response({
        'umbral': umbral,
        'total': len(resultado),
        'productos': resultado
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCajero])
def historial_cliente(request, cliente_id):
    """
    Reporte del historial de compras de un cliente.
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
    except Cliente.DoesNotExist:
        return Response(
            {'error': 'Cliente no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Ventas del cliente
    ventas = Venta.objects.filter(
        cliente=cliente,
        estado=Venta.EstadoVenta.COMPLETADA
    ).order_by('-fecha')
    
    # Resumen
    resumen = ventas.aggregate(
        total_compras=Count('id'),
        total_gastado=Coalesce(Sum('total'), Decimal('0')),
        ticket_promedio=Avg('total')
    )
    
    # Primera y última compra
    primera_compra = ventas.last()
    ultima_compra = ventas.first()
    
    # Productos favoritos (los 5 más comprados)
    productos_favoritos = DetalleVenta.objects.filter(
        venta__cliente=cliente,
        venta__estado=Venta.EstadoVenta.COMPLETADA
    ).values(
        'variante__sku',
        'variante__nombre_variante'
    ).annotate(
        veces_comprado=Count('id'),
        cantidad_total=Sum('cantidad')
    ).order_by('-veces_comprado')[:5]
    
    # Últimas 10 compras
    ultimas_compras = ventas.values(
        'id',
        'numero',
        'fecha',
        'total',
        'metodo_pago'
    )[:10]
    
    return Response({
        'cliente': {
            'id': cliente.id,
            'nombre': cliente.nombre_completo,
            'dni': cliente.dni,
            'telefono': cliente.telefono
        },
        'resumen': {
            'total_compras': resumen['total_compras'],
            'total_gastado': resumen['total_gastado'],
            'ticket_promedio': resumen['ticket_promedio'] or 0,
            'primera_compra': primera_compra.fecha if primera_compra else None,
            'ultima_compra': ultima_compra.fecha if ultima_compra else None
        },
        'productos_favoritos': list(productos_favoritos),
        'ultimas_compras': list(ultimas_compras)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrador])
def margen_por_producto(request):
    """
    Reporte de márgenes por producto.
    Parámetros: fecha_desde, fecha_hasta, orden (margen_asc|margen_desc)
    """
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')
    orden = request.query_params.get('orden', 'margen_desc')
    
    # Filtros
    detalles = DetalleVenta.objects.filter(
        venta__estado=Venta.EstadoVenta.COMPLETADA
    )
    
    if fecha_desde:
        try:
            fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__gte=fecha_desde)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__lte=fecha_hasta)
        except ValueError:
            pass
    
    # Calcular márgenes
    productos = detalles.values(
        'variante__id',
        'variante__sku',
        'variante__nombre_variante'
    ).annotate(
        cantidad_vendida=Sum('cantidad'),
        total_costo=Sum(F('cantidad') * F('costo_unitario')),
        total_venta=Sum(F('cantidad') * F('precio_unitario')),
        margen_total=Sum(F('cantidad') * F('precio_unitario')) - Sum(F('cantidad') * F('costo_unitario'))
    )
    
    # Calcular margen porcentaje
    resultado = []
    for prod in productos:
        if prod['total_venta'] and prod['total_venta'] > 0:
            margen_porcentaje = (prod['margen_total'] / prod['total_venta']) * 100
        else:
            margen_porcentaje = 0
        
        resultado.append({
            'variante_id': prod['variante__id'],
            'sku': prod['variante__sku'],
            'nombre': prod['variante__nombre_variante'],
            'cantidad_vendida': prod['cantidad_vendida'],
            'total_costo': prod['total_costo'],
            'total_venta': prod['total_venta'],
            'margen_total': prod['margen_total'],
            'margen_porcentaje': round(margen_porcentaje, 2)
        })
    
    # Ordenar
    if orden == 'margen_asc':
        resultado.sort(key=lambda x: x['margen_porcentaje'])
    else:
        resultado.sort(key=lambda x: x['margen_porcentaje'], reverse=True)
    
    return Response({
        'productos': resultado
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrador])
def export_ventas_periodo_excel(request):
    """
    Exporta ventas del período a Excel.
    Parámetros: fecha_desde, fecha_hasta (YYYY-MM-DD)
    """
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')
    if not fecha_desde or not fecha_hasta:
        return Response(
            {'error': 'Se requieren fecha_desde y fecha_hasta'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
        fecha_hasta = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    ventas = Venta.objects.filter(
        fecha__date__gte=fecha_desde,
        fecha__date__lte=fecha_hasta,
        estado=Venta.EstadoVenta.COMPLETADA
    ).select_related('cliente', 'usuario').order_by('-fecha')
    exporter = ExcelExporter()
    return exporter.exportar_ventas(ventas)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdministrador])
def export_productos_mas_vendidos_excel(request):
    """
    Exporta reporte de productos más vendidos a Excel.
    Parámetros: tipo, limite, fecha_desde, fecha_hasta (igual que el reporte JSON)
    """
    tipo = request.query_params.get('tipo', 'cantidad')
    limite = int(request.query_params.get('limite', 100))
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')

    detalles = DetalleVenta.objects.filter(
        venta__estado=Venta.EstadoVenta.COMPLETADA
    )
    if fecha_desde:
        try:
            fd = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__gte=fd)
        except ValueError:
            pass
    if fecha_hasta:
        try:
            fh = datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
            detalles = detalles.filter(venta__fecha__date__lte=fh)
        except ValueError:
            pass

    productos = detalles.values(
        'variante__id',
        'variante__codigo',
        'variante__nombre_variante',
        'variante__producto_base__nombre'
    ).annotate(
        cantidad_vendida=Sum('cantidad'),
        total_facturado=Sum(F('cantidad') * F('precio_unitario'))
    )
    if tipo == 'facturacion':
        productos = productos.order_by('-total_facturado')
    else:
        productos = productos.order_by('-cantidad_vendida')
    productos = list(productos[:limite])
    # Normalizar clave para el exporter (espera variante__sku, el modelo tiene codigo)
    for p in productos:
        p['variante__sku'] = p.get('variante__codigo', '')

    exporter = ExcelExporter()
    return exporter.exportar_reporte_productos_mas_vendidos(productos)
