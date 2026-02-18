"""
Views para el módulo de inventario.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Deposito, Stock, MovimientoStock
from apps.productos.models import VarianteProducto
from .serializers import (
    DepositoSerializer,
    StockSerializer,
    StockListSerializer,
    MovimientoStockSerializer,
    AjusteStockSerializer,
    ConsultaStockSerializer
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
        from django.utils import timezone
        from django.db.models import Sum, Count
        
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
