"""
Views para el módulo de ventas.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Venta, DetalleVenta
from apps.clientes.models import Cliente
from apps.inventario.models import Deposito
from apps.productos.models import VarianteProducto
from .serializers import (
    VentaSerializer,
    VentaListSerializer,
    VentaCreateSerializer,
    AnularVentaSerializer
)
from .services import VentaService
from apps.usuarios.permissions import IsAdministrador, IsCajero


class VentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de ventas.
    """
    queryset = Venta.objects.select_related(
        'cliente',
        'usuario',
        'deposito',
        'usuario_anulacion'
    ).prefetch_related('detalles__variante').all()
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'metodo_pago', 'cliente', 'usuario', 'deposito']
    search_fields = ['numero', 'cliente__nombre', 'cliente__apellido', 'cliente__dni']
    ordering_fields = ['fecha', 'total', 'numero']
    ordering = ['-fecha']
    
    def get_serializer_class(self):
        """Usar serializer simplificado para listas"""
        if self.action == 'list':
            return VentaListSerializer
        if self.action == 'create':
            return VentaCreateSerializer
        return VentaSerializer
    
    def get_permissions(self):
        """Solo admin puede anular ventas"""
        if self.action == 'anular':
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        """Crear venta con sus detalles"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Obtener objetos
        from apps.configuracion.models import ConfiguracionManager
        cliente_obligatorio = ConfiguracionManager.obtener('CLIENTE_OBLIGATORIO', True)
        cliente_id = data.get('cliente_id')
        cliente = None
        if cliente_id is not None:
            try:
                cliente = Cliente.objects.get(id=cliente_id)
            except Cliente.DoesNotExist:
                return Response(
                    {'error': 'Cliente no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif cliente_obligatorio:
            return Response(
                {'error': 'Debe seleccionar un cliente (configuración: cliente obligatorio)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            deposito = Deposito.objects.get(id=data['deposito_id'])
        except Deposito.DoesNotExist:
            return Response(
                {'error': 'Depósito no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validar descuento según rol
        descuento_porcentaje = data.get('descuento_porcentaje', 0)
        if not VentaService.validar_descuento_permitido(request.user, descuento_porcentaje):
            return Response(
                {'error': f'Los cajeros solo pueden aplicar hasta 50% de descuento. Solicitaste {descuento_porcentaje}%'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Preparar items
        items = []
        for item_data in data['items']:
            try:
                variante = VarianteProducto.objects.get(id=item_data['variante_id'])
            except VarianteProducto.DoesNotExist:
                return Response(
                    {'error': f"Producto con ID {item_data['variante_id']} no encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            items.append({
                'variante': variante,
                'cantidad': item_data['cantidad'],
                'precio_unitario': item_data['precio_unitario'],
                'descuento_unitario': item_data.get('descuento_unitario', 0)
            })
        
        # Crear venta
        try:
            venta = VentaService.crear_venta(
                cliente=cliente,
                usuario=request.user,
                deposito=deposito,
                items=items,
                metodo_pago=data['metodo_pago'],
                tarjeta_cupon_numero=data.get('tarjeta_cupon_numero', ''),
                tarjeta_codigo_autorizacion=data.get('tarjeta_codigo_autorizacion', ''),
                descuento_porcentaje=data.get('descuento_porcentaje', 0),
                descuento_monto=data.get('descuento_monto', 0),
                transferencia_banco=data.get('transferencia_banco', ''),
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar margen bajo
        alerta_margen = None
        if venta.margen_es_bajo:
            alerta_margen = f'ALERTA: Margen de ganancia bajo ({venta.margen_porcentaje:.2f}%)'
        
        # Serializar respuesta
        output_serializer = VentaSerializer(venta)
        response_data = output_serializer.data
        if alerta_margen:
            response_data['alerta'] = alerta_margen
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdministrador])
    def anular(self, request, pk=None):
        """Anular una venta (solo admin)"""
        venta = self.get_object()
        
        serializer = AnularVentaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            venta_anulada = VentaService.anular_venta(
                venta=venta,
                usuario_admin=request.user,
                motivo=serializer.validated_data['motivo']
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        output_serializer = VentaSerializer(venta_anulada)
        return Response(output_serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen_diario(self, request):
        """Resumen de ventas del día actual"""
        hoy = timezone.now().date()
        
        ventas_hoy = Venta.objects.filter(
            fecha__date=hoy,
            estado=Venta.EstadoVenta.COMPLETADA
        ).aggregate(
            total_ventas=Count('id'),
            monto_total=Sum('total')
        )
        
        return Response({
            'fecha': hoy,
            'total_ventas': ventas_hoy['total_ventas'] or 0,
            'monto_total': ventas_hoy['monto_total'] or 0
        })
    
    @action(detail=False, methods=['get'])
    def por_fecha(self, request):
        """Ventas filtradas por rango de fechas"""
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        
        if not fecha_desde or not fecha_hasta:
            return Response(
                {'error': 'Se requieren fecha_desde y fecha_hasta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ventas = self.get_queryset().filter(
            fecha__date__gte=fecha_desde,
            fecha__date__lte=fecha_hasta,
            estado=Venta.EstadoVenta.COMPLETADA
        )
        
        # Paginación
        page = self.paginate_queryset(ventas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(ventas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_cliente(self, request):
        """Historial de ventas de un cliente"""
        cliente_id = request.query_params.get('cliente_id')

        if not cliente_id:
            return Response(
                {'error': 'Se requiere cliente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ventas = self.get_queryset().filter(cliente_id=cliente_id)

        page = self.paginate_queryset(ventas)
        if page is not None:
            serializer = VentaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = VentaListSerializer(ventas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def actualizar_datos_tarjeta(self, request, pk=None):
        """Guarda el número de cupón y código de autorización del posnet en la venta."""
        venta = self.get_object()
        cupon = (request.data.get('tarjeta_cupon_numero') or '').strip()
        auth = (request.data.get('tarjeta_codigo_autorizacion') or '').strip()
        if not cupon or not auth:
            return Response(
                {'error': 'Ingresá el número de cupón y el código de autorización.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        venta.tarjeta_cupon_numero = cupon
        venta.tarjeta_codigo_autorizacion = auth
        venta.save(update_fields=['tarjeta_cupon_numero', 'tarjeta_codigo_autorizacion'])
        return Response({'ok': True})

    @action(detail=False, methods=['get'])
    def transferencias_pendientes(self, request):
        """Lista ventas con transferencia pendiente de confirmación."""
        qs = self.get_queryset().filter(
            metodo_pago='TRANSFERENCIA',
            transferencia_estado='PENDIENTE',
            estado='COMPLETADA',
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = VentaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = VentaListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdministrador])
    def confirmar_transferencia(self, request, pk=None):
        """Confirma una transferencia pendiente. Solo admin."""
        venta = self.get_object()
        if venta.metodo_pago != 'TRANSFERENCIA':
            return Response({'error': 'La venta no es por transferencia.'}, status=status.HTTP_400_BAD_REQUEST)
        if venta.transferencia_estado == 'CONFIRMADA':
            return Response({'error': 'La transferencia ya fue confirmada.'}, status=status.HTTP_400_BAD_REQUEST)

        nro_op = (request.data.get('transferencia_numero_operacion') or '').strip()
        banco = (request.data.get('transferencia_banco') or venta.transferencia_banco or '').strip()
        cuenta = (request.data.get('transferencia_cuenta_destino') or '').strip()
        obs = (request.data.get('transferencia_observacion') or '').strip()

        venta.transferencia_estado = 'CONFIRMADA'
        venta.transferencia_numero_operacion = nro_op
        venta.transferencia_banco = banco
        venta.transferencia_cuenta_destino = cuenta
        venta.transferencia_observacion = obs
        venta.transferencia_confirmada_por = request.user
        venta.transferencia_fecha_confirmacion = timezone.now()
        venta.save(update_fields=[
            'transferencia_estado', 'transferencia_numero_operacion',
            'transferencia_banco', 'transferencia_cuenta_destino',
            'transferencia_observacion', 'transferencia_confirmada_por',
            'transferencia_fecha_confirmacion',
        ])
        return Response(VentaSerializer(venta).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdministrador])
    def rechazar_transferencia(self, request, pk=None):
        """Rechaza una transferencia pendiente. Solo admin."""
        venta = self.get_object()
        if venta.metodo_pago != 'TRANSFERENCIA':
            return Response({'error': 'La venta no es por transferencia.'}, status=status.HTTP_400_BAD_REQUEST)
        if venta.transferencia_estado in ('CONFIRMADA', 'RECHAZADA'):
            return Response({'error': f'La transferencia ya está en estado {venta.transferencia_estado}.'}, status=status.HTTP_400_BAD_REQUEST)

        obs = (request.data.get('transferencia_observacion') or '').strip()
        venta.transferencia_estado = 'RECHAZADA'
        venta.transferencia_observacion = obs
        venta.transferencia_confirmada_por = request.user
        venta.transferencia_fecha_confirmacion = timezone.now()
        venta.save(update_fields=[
            'transferencia_estado', 'transferencia_observacion',
            'transferencia_confirmada_por', 'transferencia_fecha_confirmacion',
        ])
        return Response(VentaSerializer(venta).data)
