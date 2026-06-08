from pathlib import Path
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.http import FileResponse
from django.shortcuts import get_object_or_404
import logging
from .models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP
from .serializers import (
    PuntoVentaSerializer,
    FacturaSerializer,
    FacturaCreateSerializer,
    ConfiguracionAFIPSerializer
)
from .afip_service import AFIPService
from .pdf_generator import generar_pdf_factura
from apps.usuarios.permissions import IsAdministrador

logger = logging.getLogger(__name__)

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

        # Validar datos de tarjeta si la venta fue pagada con TARJETA
        venta = factura.venta
        if venta and venta.metodo_pago == 'TARJETA':
            if not (venta.tarjeta_cupon_numero or '').strip() or not (venta.tarjeta_codigo_autorizacion or '').strip():
                return Response({
                    'success': False,
                    'error': 'Para facturar una venta con tarjeta, cargá el número de cupón y el código de autorización del posnet.'
                }, status=status.HTTP_400_BAD_REQUEST)

        config_afip = ConfiguracionAFIP.objects.first()
        if not config_afip:
            return Response({
                'success': False,
                'error': 'No hay configuración AFIP. Configure primero en /api/facturacion/configuracion-afip/'
            }, status=status.HTTP_400_BAD_REQUEST)

        afip_service = AFIPService(config=config_afip)
        resultado = afip_service.autorizar_factura(factura)

        if resultado['success']:
            # Auto-generar y guardar PDF en disco
            try:
                pdf_buffer, ruta_relativa = generar_pdf_factura(factura, guardar_en_disco=True)
                if ruta_relativa:
                    factura.pdf_archivo = ruta_relativa
                    factura.save(update_fields=['pdf_archivo'])
            except Exception as e:
                logger.warning("No se pudo generar el PDF automáticamente para factura %s: %s", factura.id, e)

            serializer = FacturaSerializer(factura)
            return Response({
                'success': True,
                'mensaje': 'Factura autorizada correctamente',
                'factura': serializer.data
            })
        else:
            detalle = resultado.get('detalle')
            if detalle:
                try:
                    logger.error(
                        "AFIP autorizar_factura fallo. factura_id=%s error=%s xml_request=%s xml_response=%s",
                        factura.id,
                        detalle.get('error') or resultado.get('error'),
                        detalle.get('xml_request'),
                        detalle.get('xml_response'),
                    )
                except Exception:
                    pass
            return Response({
                'success': False,
                'error': resultado.get('error'),
                'detalle': detalle,
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Sirve el PDF de la factura: desde disco si existe, sino lo regenera en memoria."""
        factura = self.get_object()

        # Servir desde disco si el archivo existe
        if factura.pdf_archivo:
            ruta = Path(settings.MEDIA_ROOT) / factura.pdf_archivo
            if ruta.exists():
                return FileResponse(
                    open(ruta, 'rb'),
                    content_type='application/pdf',
                    as_attachment=True,
                    filename=ruta.name,
                )

        # Fallback: generar en memoria sin guardar (no re-emite AFIP)
        pdf_buffer, _ = generar_pdf_factura(factura, guardar_en_disco=False)
        response = FileResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="factura_{factura.numero_completo}.pdf"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsAdministrador])
    def regenerar_pdf(self, request, pk=None):
        """Regenera y guarda el PDF de una factura autorizada sin re-emitir AFIP."""
        factura = self.get_object()

        if factura.estado != Factura.Estado.AUTORIZADA:
            return Response(
                {'error': 'Solo se puede regenerar el PDF de facturas autorizadas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            _, ruta_relativa = generar_pdf_factura(factura, guardar_en_disco=True)
            factura.pdf_archivo = ruta_relativa
            factura.save(update_fields=['pdf_archivo'])
            return Response({'ok': True, 'pdf_archivo': ruta_relativa})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
