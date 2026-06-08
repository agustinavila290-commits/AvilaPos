"""
Views para el módulo de inventario.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import timedelta

from .models import Deposito, Stock, MovimientoStock, ConteoInventario, DetalleConteo
from apps.productos.models import VarianteProducto
from .serializers import (
    DepositoSerializer,
    StockSerializer,
    StockListSerializer,
    MovimientoStockSerializer,
    AjusteStockSerializer,
    ConsultaStockSerializer,
    AjusteMasivoSerializer,
    ConteoInventarioSerializer,
    ConteoInventarioListSerializer,
    DetalleConteoSerializer,
)
from .services import InventarioService
from apps.usuarios.permissions import IsAdministrador, IsCajero


class DepositoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de depósitos.
    Solo administradores pueden crear/editar/eliminar.
    """
    queryset = Deposito.objects.all()
    serializer_class = DepositoSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'direccion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
    
    def get_permissions(self):
        """Solo admin puede crear/actualizar/eliminar"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def principal(self, request):
        """Obtiene el depósito principal"""
        deposito = Deposito.objects.filter(es_principal=True, activo=True).first()
        if deposito:
            serializer = self.get_serializer(deposito)
            return Response(serializer.data)
        return Response(
            {'error': 'No hay depósito principal configurado'},
            status=status.HTTP_404_NOT_FOUND
        )


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para consultar stocks.
    Los stocks se modifican SOLO a través de movimientos.
    """
    queryset = Stock.objects.select_related(
        'variante',
        'variante__producto_base',
        'variante__producto_base__marca',
        'variante__producto_base__categoria',
        'deposito'
    ).all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['deposito', 'variante']
    search_fields = [
        'variante__codigo',
        'variante__nombre_variante',
        'variante__producto_base__nombre'
    ]
    ordering_fields = ['cantidad', 'fecha_actualizacion']
    ordering = ['-fecha_actualizacion']
    
    def get_serializer_class(self):
        """Usar serializer simplificado para listas"""
        if self.action == 'list':
            return StockListSerializer
        return StockSerializer
    
    @action(detail=False, methods=['get'])
    def critico(self, request):
        """Lista productos con stock crítico (≤2 unidades)"""
        deposito_id = request.query_params.get('deposito')
        deposito = None
        
        if deposito_id:
            try:
                deposito = Deposito.objects.get(id=deposito_id)
            except Deposito.DoesNotExist:
                return Response(
                    {'error': 'Depósito no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        stocks_criticos = InventarioService.obtener_stock_critico(deposito=deposito)
        serializer = StockListSerializer(stocks_criticos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_variante(self, request):
        """Consulta stock de una variante específica en todos los depósitos"""
        variante_id = request.query_params.get('variante_id')
        
        if not variante_id:
            return Response(
                {'error': 'variante_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            variante = VarianteProducto.objects.get(id=variante_id)
        except VarianteProducto.DoesNotExist:
            return Response(
                {'error': 'Variante no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        stocks = Stock.objects.filter(variante=variante).select_related(
            'deposito',
            'variante',
            'variante__producto_base',
            'variante__producto_base__marca',
        )
        serializer = StockListSerializer(stocks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdministrador])
    def ajustar(self, request):
        """
        Realiza un ajuste manual de stock (solo admin).
        Requiere: variante_id, deposito_id, nueva_cantidad, observaciones
        """
        serializer = AjusteStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        variante_id = serializer.validated_data['variante_id']
        deposito_id = serializer.validated_data['deposito_id']
        nueva_cantidad = serializer.validated_data['nueva_cantidad']
        observaciones = serializer.validated_data['observaciones']
        
        # Validar existencia
        try:
            variante = VarianteProducto.objects.get(id=variante_id)
            deposito = Deposito.objects.get(id=deposito_id)
        except VarianteProducto.DoesNotExist:
            return Response(
                {'error': 'Variante no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Deposito.DoesNotExist:
            return Response(
                {'error': 'Depósito no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Realizar ajuste
        movimiento = InventarioService.ajuste_stock(
            variante=variante,
            deposito=deposito,
            nueva_cantidad=nueva_cantidad,
            usuario=request.user,
            observaciones=observaciones
        )
        
        if movimiento:
            return Response({
                'message': 'Ajuste realizado correctamente',
                'stock_anterior': movimiento.stock_anterior,
                'stock_nuevo': movimiento.stock_posterior,
                'diferencia': movimiento.cantidad,
                'movimiento_id': movimiento.id
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'No se realizó ningún ajuste (cantidad igual a la actual)',
                'stock_actual': InventarioService.obtener_stock_actual(variante, deposito)
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdministrador])
    def ajuste_masivo(self, request):
        """Ajusta el stock de múltiples variantes en una sola operación (solo admin)."""
        serializer = AjusteMasivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        deposito_id = serializer.validated_data['deposito_id']
        items = serializer.validated_data['items']
        obs_general = serializer.validated_data.get('observaciones_generales', '')

        try:
            deposito = Deposito.objects.get(id=deposito_id)
        except Deposito.DoesNotExist:
            return Response({'error': 'Depósito no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        resultados = []
        errores = []

        for item in items:
            try:
                variante = VarianteProducto.objects.get(id=item['variante_id'])
                obs = item.get('observaciones', '') or obs_general or 'Ajuste masivo de inventario'
                mov = InventarioService.ajuste_stock(
                    variante=variante,
                    deposito=deposito,
                    nueva_cantidad=item['nueva_cantidad'],
                    usuario=request.user,
                    observaciones=obs,
                )
                resultados.append({
                    'variante_id': variante.id,
                    'codigo': variante.codigo,
                    'ajustado': mov is not None,
                    'stock_nuevo': item['nueva_cantidad'],
                })
            except VarianteProducto.DoesNotExist:
                errores.append({'variante_id': item['variante_id'], 'error': 'Variante no encontrada'})
            except Exception as e:
                errores.append({'variante_id': item['variante_id'], 'error': str(e)})

        return Response({
            'procesados': len(resultados),
            'errores': len(errores),
            'resultados': resultados,
            'detalle_errores': errores,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def reposicion_sugerida(self, request):
        """
        Devuelve los stocks donde cantidad <= stock_minimo del producto.
        Si stock_minimo == 0 usa el umbral global UMBRAL_STOCK_CRITICO.
        """
        from apps.configuracion.models import ConfiguracionManager
        umbral_global = int(ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2))
        deposito_id = request.query_params.get('deposito')

        qs = Stock.objects.select_related(
            'variante', 'variante__producto_base',
            'variante__producto_base__marca', 'deposito'
        ).filter(variante__activo=True)

        if deposito_id:
            qs = qs.filter(deposito_id=deposito_id)

        resultados = []
        for stock in qs:
            minimo = stock.variante.stock_minimo if stock.variante.stock_minimo > 0 else umbral_global
            if stock.cantidad <= minimo:
                reorden = stock.variante.punto_reorden or max(minimo * 2, 5)
                resultados.append({
                    'stock_id': stock.id,
                    'variante_id': stock.variante.id,
                    'codigo': stock.variante.codigo,
                    'nombre_completo': stock.variante.nombre_completo,
                    'marca': stock.variante.producto_base.marca.nombre,
                    'deposito_id': stock.deposito.id,
                    'deposito_nombre': stock.deposito.nombre,
                    'cantidad_actual': stock.cantidad,
                    'stock_minimo': minimo,
                    'punto_reorden': reorden,
                    'faltante': minimo - stock.cantidad,
                    'estado': stock.estado,
                })

        resultados.sort(key=lambda x: x['cantidad_actual'])
        return Response({'count': len(resultados), 'results': resultados})

    @action(detail=False, methods=['get'])
    def sin_movimiento(self, request):
        """
        Variantes sin ventas en los últimos N días (default: 60).
        Excluye productos con stock 0 o negativo (no hay nada para vender).
        """
        dias = int(request.query_params.get('dias', 60))
        deposito_id = request.query_params.get('deposito')
        desde = timezone.now() - timedelta(days=dias)

        variantes_con_venta = MovimientoStock.objects.filter(
            tipo__in=[MovimientoStock.TipoMovimiento.VENTA, MovimientoStock.TipoMovimiento.VENTA_WEB],
            fecha__gte=desde
        ).values_list('variante_id', flat=True).distinct()

        qs = Stock.objects.select_related(
            'variante', 'variante__producto_base',
            'variante__producto_base__marca', 'deposito'
        ).filter(
            variante__activo=True,
            cantidad__gt=0,
        ).exclude(variante_id__in=variantes_con_venta)

        if deposito_id:
            qs = qs.filter(deposito_id=deposito_id)

        qs = qs.order_by('variante__producto_base__nombre', 'variante__nombre_variante')

        data = [{
            'stock_id': s.id,
            'variante_id': s.variante.id,
            'codigo': s.variante.codigo,
            'nombre_completo': s.variante.nombre_completo,
            'marca': s.variante.producto_base.marca.nombre,
            'deposito_nombre': s.deposito.nombre,
            'cantidad': s.cantidad,
            'costo': float(s.variante.costo),
            'precio_mostrador': float(s.variante.precio_mostrador),
        } for s in qs]

        return Response({'count': len(data), 'dias_sin_movimiento': dias, 'results': data})

    @action(detail=False, methods=['get'])
    def mas_vendidos(self, request):
        """
        Top 50 variantes por unidades vendidas en un período.
        Params: desde (YYYY-MM-DD), hasta (YYYY-MM-DD), deposito
        """
        desde_str = request.query_params.get('desde')
        hasta_str = request.query_params.get('hasta')
        deposito_id = request.query_params.get('deposito')

        qs = MovimientoStock.objects.filter(
            tipo__in=[MovimientoStock.TipoMovimiento.VENTA, MovimientoStock.TipoMovimiento.VENTA_WEB],
        )

        if desde_str:
            qs = qs.filter(fecha__date__gte=desde_str)
        if hasta_str:
            qs = qs.filter(fecha__date__lte=hasta_str)
        if deposito_id:
            qs = qs.filter(deposito_id=deposito_id)

        top = (
            qs.values('variante_id')
            .annotate(
                total_vendido=Sum(F('cantidad') * -1),
                cantidad_transacciones=Count('id'),
            )
            .order_by('-total_vendido')[:50]
        )

        variantes_ids = [r['variante_id'] for r in top]
        variantes_map = {
            v.id: v for v in VarianteProducto.objects.select_related(
                'producto_base', 'producto_base__marca'
            ).filter(id__in=variantes_ids)
        }

        data = []
        for r in top:
            v = variantes_map.get(r['variante_id'])
            if v:
                data.append({
                    'variante_id': v.id,
                    'codigo': v.codigo,
                    'nombre_completo': v.nombre_completo,
                    'marca': v.producto_base.marca.nombre,
                    'total_vendido': abs(r['total_vendido'] or 0),
                    'cantidad_transacciones': r['cantidad_transacciones'],
                    'precio_mostrador': float(v.precio_mostrador),
                })

        return Response({'count': len(data), 'results': data})

    @action(detail=False, methods=['get'])
    def margen_bajo(self, request):
        """
        Variantes con margen porcentual < umbral (default: 20%).
        """
        umbral = float(request.query_params.get('umbral', 20))
        deposito_id = request.query_params.get('deposito')

        qs = VarianteProducto.objects.select_related(
            'producto_base', 'producto_base__marca'
        ).filter(activo=True, precio_mostrador__gt=0)

        data = []
        for v in qs:
            margen = float(v.margen_porcentaje)
            if margen < umbral:
                stock_actual = 0
                if deposito_id:
                    try:
                        stock_actual = Stock.objects.get(variante=v, deposito_id=deposito_id).cantidad
                    except Stock.DoesNotExist:
                        pass
                else:
                    stock_actual = sum(
                        s.cantidad for s in Stock.objects.filter(variante=v, deposito__activo=True)
                    )
                data.append({
                    'variante_id': v.id,
                    'codigo': v.codigo,
                    'nombre_completo': v.nombre_completo,
                    'marca': v.producto_base.marca.nombre,
                    'costo': float(v.costo),
                    'precio_mostrador': float(v.precio_mostrador),
                    'margen_porcentaje': round(margen, 2),
                    'margen_monto': float(v.margen_monto),
                    'stock_actual': stock_actual,
                })

        data.sort(key=lambda x: x['margen_porcentaje'])
        return Response({'count': len(data), 'umbral': umbral, 'results': data})


class MovimientoStockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para consultar historial de movimientos.
    Los movimientos se crean automáticamente desde otros módulos.
    """
    queryset = MovimientoStock.objects.select_related(
        'variante',
        'variante__producto_base',
        'deposito',
        'usuario'
    ).all()
    serializer_class = MovimientoStockSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'deposito', 'variante', 'usuario']
    search_fields = [
        'variante__sku',
        'variante__codigo_barras',
        'observaciones'
    ]
    ordering_fields = ['fecha', 'cantidad']
    ordering = ['-fecha']
    
    @action(detail=False, methods=['get'])
    def por_variante(self, request):
        """Historial de movimientos de una variante específica"""
        variante_id = request.query_params.get('variante_id')
        deposito_id = request.query_params.get('deposito_id')
        
        if not variante_id:
            return Response(
                {'error': 'variante_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(variante_id=variante_id)
        
        if deposito_id:
            queryset = queryset.filter(deposito_id=deposito_id)
        
        # Paginar
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen_diario(self, request):
        """Resumen de movimientos del día actual"""
        hoy = timezone.now().date()

        movimientos = self.get_queryset().filter(
            fecha__date=hoy
        ).values('tipo').annotate(
            total=Count('id'),
            cantidad_total=Sum('cantidad')
        )

        return Response({
            'fecha': hoy,
            'movimientos': list(movimientos)
        })


class ConteoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para conteos físicos de inventario.
    Crear, completar ítems y finalizar con ajuste automático de diferencias.
    """
    queryset = ConteoInventario.objects.select_related('deposito', 'usuario').all()
    serializer_class = ConteoInventarioSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['deposito', 'estado']
    ordering = ['-fecha_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return ConteoInventarioListSerializer
        return ConteoInventarioSerializer

    def perform_create(self, serializer):
        """Al crear un conteo, cargar todos los stocks del depósito como ítems."""
        from django.db import transaction
        deposito = serializer.validated_data['deposito']
        with transaction.atomic():
            conteo = serializer.save(usuario=self.request.user)
            stocks = Stock.objects.filter(deposito=deposito, variante__activo=True).select_related('variante')
            detalles = [
                DetalleConteo(
                    conteo=conteo,
                    variante=s.variante,
                    cantidad_sistema=s.cantidad,
                )
                for s in stocks
            ]
            DetalleConteo.objects.bulk_create(detalles, ignore_conflicts=True)

    @action(detail=True, methods=['patch'])
    def actualizar_item(self, request, pk=None):
        """Actualiza la cantidad contada de un ítem del conteo."""
        conteo = self.get_object()
        if conteo.estado != ConteoInventario.Estado.ABIERTO:
            return Response({'error': 'Solo se pueden editar conteos abiertos.'}, status=status.HTTP_400_BAD_REQUEST)

        variante_id = request.data.get('variante_id')
        cantidad_contada = request.data.get('cantidad_contada')

        if variante_id is None or cantidad_contada is None:
            return Response({'error': 'variante_id y cantidad_contada son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            detalle = conteo.detalles.get(variante_id=variante_id)
        except DetalleConteo.DoesNotExist:
            return Response({'error': 'Ítem no encontrado en el conteo.'}, status=status.HTTP_404_NOT_FOUND)

        detalle.cantidad_contada = int(cantidad_contada)
        detalle.save()
        return Response(DetalleConteoSerializer(detalle).data)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Finaliza el conteo y crea ajustes de stock para todos los ítems
        con diferencia entre cantidad_sistema y cantidad_contada.
        Solo ajusta ítems donde se ingresó cantidad contada.
        """
        from django.db import transaction
        conteo = self.get_object()

        if conteo.estado != ConteoInventario.Estado.ABIERTO:
            return Response({'error': 'Solo se pueden finalizar conteos abiertos.'}, status=status.HTTP_400_BAD_REQUEST)

        ajustados = 0
        sin_cambio = 0
        sin_contar = 0

        with transaction.atomic():
            for detalle in conteo.detalles.select_related('variante').all():
                if detalle.cantidad_contada is None:
                    sin_contar += 1
                    continue
                if detalle.diferencia == 0:
                    sin_cambio += 1
                    continue

                InventarioService.ajuste_stock(
                    variante=detalle.variante,
                    deposito=conteo.deposito,
                    nueva_cantidad=detalle.cantidad_contada,
                    usuario=request.user,
                    observaciones=f'Conteo físico #{conteo.id}',
                )
                detalle.ajustado = True
                detalle.save(update_fields=['ajustado'])
                ajustados += 1

            conteo.estado = ConteoInventario.Estado.FINALIZADO
            conteo.fecha_cierre = timezone.now()
            conteo.save(update_fields=['estado', 'fecha_cierre'])

        return Response({
            'message': 'Conteo finalizado correctamente.',
            'ajustados': ajustados,
            'sin_cambio': sin_cambio,
            'sin_contar': sin_contar,
        })

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela un conteo abierto sin aplicar ningún ajuste."""
        conteo = self.get_object()
        if conteo.estado != ConteoInventario.Estado.ABIERTO:
            return Response({'error': 'Solo se pueden cancelar conteos abiertos.'}, status=status.HTTP_400_BAD_REQUEST)
        conteo.estado = ConteoInventario.Estado.CANCELADO
        conteo.fecha_cierre = timezone.now()
        conteo.save(update_fields=['estado', 'fecha_cierre'])
        return Response({'message': 'Conteo cancelado.'})
