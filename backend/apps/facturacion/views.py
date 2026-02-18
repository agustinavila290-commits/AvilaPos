from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP
from .serializers import (
    PuntoVentaSerializer,
    FacturaSerializer,
    FacturaCreateSerializer,
    ConfiguracionAFIPSerializer
)
from .afip_service import AFIPService


class PuntoVentaViewSet(viewsets.ModelViewSet):
    """ViewSet para Puntos de Venta"""
    queryset = PuntoVenta.objects.all()
    serializer_class = PuntoVentaSerializer
    permission_classes = [IsAuthenticated]


class FacturaViewSet(viewsets.ModelViewSet):
    """ViewSet para Facturas"""
    queryset = Factura.objects.select_related(
        'punto_venta', 'cliente', 'usuario', 'venta'
    ).prefetch_related('items').all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_comprobante', 'estado', 'punto_venta', 'cliente']
    search_fields = ['numero', 'cliente_razon_social', 'cliente_cuit']
    ordering_fields = ['fecha_emision', 'numero', 'total']
    ordering = ['-fecha_emision', '-numero']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FacturaCreateSerializer
        return FacturaSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear factura"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        factura = serializer.save()
        
        # Retornar con serializer de lectura
        output_serializer = FacturaSerializer(factura)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def autorizar_afip(self, request, pk=None):
        """Solicitar autorización a AFIP"""
        factura = self.get_object()
        
        if factura.estado != Factura.Estado.BORRADOR:
            return Response({
                'success': False,
                'error': 'Solo se pueden autorizar facturas en estado Borrador'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Usar servicio AFIP
        # Obtener configuración AFIP
        config_afip = ConfiguracionAFIP.objects.first()
        if not config_afip:
            return Response({
                'success': False,
                'error': 'No hay configuración AFIP. Configure primero en /api/facturacion/configuracion-afip/'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        afip_service = AFIPService(config=config_afip)
        resultado = afip_service.autorizar_factura(factura)
        
        if resultado['success']:
            serializer = FacturaSerializer(factura)
            return Response({
                'success': True,
                'mensaje': 'Factura autorizada correctamente',
                'factura': serializer.data
            })
        else:
            return Response({
                'success': False,
                'error': resultado['error']
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Generar PDF de la factura"""
        factura = self.get_object()
        
        from .pdf_generator import generar_pdf_factura
        pdf_buffer = generar_pdf_factura(factura)
        
        from django.http import FileResponse
        response = FileResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="factura_{factura.numero_completo}.pdf"'
        
        return response
    
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """Anular factura"""
        factura = self.get_object()
        
        if factura.estado == Factura.Estado.ANULADA:
            return Response({
                'success': False,
                'error': 'La factura ya está anulada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        factura.estado = Factura.Estado.ANULADA
        factura.save()
        
        serializer = FacturaSerializer(factura)
        return Response({
            'success': True,
            'mensaje': 'Factura anulada correctamente',
            'factura': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de facturación"""
        from django.db.models import Sum, Count
        from decimal import Decimal
        
        stats = {
            'total_facturas': Factura.objects.count(),
            'facturas_autorizadas': Factura.objects.filter(estado=Factura.Estado.AUTORIZADA).count(),
            'facturas_pendientes': Factura.objects.filter(estado=Factura.Estado.BORRADOR).count(),
            'total_facturado': Factura.objects.filter(
                estado=Factura.Estado.AUTORIZADA
            ).aggregate(total=Sum('total'))['total'] or Decimal('0.00'),
            'por_tipo': list(Factura.objects.values('tipo_comprobante').annotate(
                cantidad=Count('id'),
                total=Sum('total')
            ))
        }
        
        return Response(stats)


class ConfiguracionAFIPViewSet(viewsets.ModelViewSet):
    """ViewSet para Configuración AFIP"""
    queryset = ConfiguracionAFIP.objects.all()
    serializer_class = ConfiguracionAFIPSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def renovar_token(self, request, pk=None):
        """Renovar token AFIP"""
        config = self.get_object()
        
        afip_service = AFIPService(config=config)
        resultado = afip_service.obtener_token(config)
        
        if resultado['success']:
            return Response({
                'success': True,
                'mensaje': 'Token renovado correctamente',
                'expiracion': config.token_expiracion
            })
        else:
            return Response({
                'success': False,
                'error': resultado['error']
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def probar_conexion(self, request, pk=None):
        """Probar conexión con AFIP"""
        config = self.get_object()
        
        afip_service = AFIPService(config=config)
        resultado = afip_service.probar_conexion(config)
        
        return Response(resultado)
