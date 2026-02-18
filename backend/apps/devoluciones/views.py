"""
Views para devoluciones.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import DevolucionVenta, NotaCredito
from .serializers import (
    DevolucionVentaSerializer,
    DevolucionVentaListSerializer,
    DevolucionVentaCreateSerializer,
    NotaCreditoSerializer
)
from .services import DevolucionService, NotaCreditoService
from apps.usuarios.permissions import IsAdministrador, IsCajero


class DevolucionVentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de devoluciones de ventas.
    """
    queryset = DevolucionVenta.objects.all().select_related(
        'venta',
        'venta__cliente',
        'usuario',
        'deposito'
    ).prefetch_related('detalles__variante')
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'motivo', 'venta', 'deposito']
    search_fields = ['numero', 'venta__numero', 'venta__cliente__nombre', 'observaciones']
    ordering_fields = ['fecha', 'numero', 'total']
    ordering = ['-fecha']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DevolucionVentaListSerializer
        elif self.action == 'create':
            return DevolucionVentaCreateSerializer
        return DevolucionVentaSerializer
    
    def get_permissions(self):
        """Permisos específicos por acción"""
        if self.action in ['create', 'cancelar']:
            return [IsAuthenticated(), IsCajero()]
        return super().get_permissions()
    
    def create(self, request):
        """Crea una nueva devolución"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            devolucion = DevolucionService.crear_devolucion(
                venta_id=serializer.validated_data['venta_id'],
                usuario=request.user,
                motivo=serializer.validated_data['motivo'],
                items=serializer.validated_data['items'],
                deposito_id=serializer.validated_data['deposito_id'],
                observaciones=serializer.validated_data.get('observaciones', ''),
                genera_nota_credito=serializer.validated_data.get('genera_nota_credito', True)
            )
            
            output_serializer = DevolucionVentaSerializer(devolucion)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error al crear devolución: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una devolución pendiente"""
        devolucion = self.get_object()
        
        try:
            devolucion = DevolucionService.cancelar_devolucion(devolucion, request.user)
            serializer = self.get_serializer(devolucion)
            return Response(serializer.data)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def productos_devolubles(self, request):
        """Obtiene los productos que pueden ser devueltos de una venta"""
        venta_id = request.query_params.get('venta_id')
        
        if not venta_id:
            return Response(
                {'error': 'Se requiere el parámetro venta_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            productos = DevolucionService.obtener_productos_devolubles(venta_id)
            
            # Serializar los productos
            resultado = []
            for p in productos:
                resultado.append({
                    'detalle_id': p['detalle_id'],
                    'variante': {
                        'id': p['variante'].id,
                        'nombre': p['variante'].nombre_completo,
                        'sku': p['variante'].sku,
                        'codigo_barras': p['variante'].codigo_barras
                    },
                    'cantidad_vendida': p['cantidad_vendida'],
                    'cantidad_devuelta': p['cantidad_devuelta'],
                    'cantidad_disponible': p['cantidad_disponible'],
                    'precio_unitario': str(p['precio_unitario']),
                    'subtotal': str(p['subtotal'])
                })
            
            return Response(resultado)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class NotaCreditoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consulta de notas de crédito.
    Solo administradores pueden ver todas las notas.
    """
    queryset = NotaCredito.objects.all().select_related(
        'cliente',
        'devolucion'
    )
    serializer_class = NotaCreditoSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'cliente']
    search_fields = ['numero', 'cliente__nombre']
    ordering_fields = ['fecha_emision', 'numero', 'monto']
    ordering = ['-fecha_emision']
    
    @action(detail=False, methods=['get'])
    def activas_cliente(self, request):
        """Obtiene las notas de crédito activas de un cliente"""
        cliente_id = request.query_params.get('cliente_id')
        
        if not cliente_id:
            return Response(
                {'error': 'Se requiere el parámetro cliente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notas = NotaCreditoService.obtener_notas_activas_cliente(cliente_id)
        serializer = self.get_serializer(notas, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una nota de crédito"""
        nota = self.get_object()
        
        try:
            nota = NotaCreditoService.cancelar_nota_credito(nota, request.user)
            serializer = self.get_serializer(nota)
            return Response(serializer.data)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
