"""
Views para el módulo de compras.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models
from django.http import FileResponse, Http404

from .models import Proveedor, Compra, CompraFacturaAdjunto, HistorialCosto, OrdenCompra
from apps.inventario.models import Deposito
from apps.productos.models import VarianteProducto
from .serializers import (
    ProveedorSerializer,
    CompraSerializer,
    CompraListSerializer,
    CompraCreateSerializer,
    CompraFacturaAdjuntoSerializer,
    HistorialCostoSerializer,
    OrdenCompraSerializer,
    OrdenCompraListSerializer,
    OrdenCompraCreateSerializer,
    RecepcionSerializer,
)
from .services import CompraService, OrdenCompraService
from .image_utils import comprimir_imagen_factura
from apps.usuarios.permissions import IsAdministrador, IsCajero


class ProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de proveedores.
    """
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'razon_social', 'cuit']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
    
    def get_permissions(self):
        """Solo admin puede crear/actualizar/eliminar"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdministrador])
    def toggle_active(self, request, pk=None):
        """Activa/desactiva un proveedor"""
        proveedor = self.get_object()
        proveedor.activo = not proveedor.activo
        proveedor.save()
        serializer = self.get_serializer(proveedor)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def productos(self, request, pk=None):
        """Productos habituales de este proveedor (donde está configurado como proveedor_habitual)."""
        proveedor = self.get_object()
        from apps.productos.serializers import VarianteListSerializer
        variantes = VarianteProducto.objects.filter(
            proveedor_habitual=proveedor, activo=True
        ).select_related('producto_base', 'producto_base__marca', 'producto_base__categoria')
        serializer = VarianteListSerializer(variantes, many=True)
        return Response({'count': variantes.count(), 'results': serializer.data})


class CompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de compras.
    Solo admin puede registrar compras.
    """
    queryset = Compra.objects.select_related(
        'proveedor',
        'usuario',
        'deposito'
    ).prefetch_related('detalles__variante', 'adjuntos_factura').all()
    serializer_class = CompraSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'proveedor', 'deposito']
    search_fields = ['numero', 'numero_factura', 'proveedor__nombre']
    ordering_fields = ['fecha', 'total', 'numero']
    ordering = ['-fecha']
    
    def get_serializer_class(self):
        """Usar serializer simplificado para listas"""
        if self.action == 'list':
            return CompraListSerializer
        if self.action == 'create':
            return CompraCreateSerializer
        return CompraSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear compra con sus detalles"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Obtener objetos
        try:
            proveedor = Proveedor.objects.get(id=data['proveedor_id'])
            deposito = Deposito.objects.get(id=data['deposito_id'])
        except Proveedor.DoesNotExist:
            return Response(
                {'error': 'Proveedor no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Deposito.DoesNotExist:
            return Response(
                {'error': 'Depósito no encontrado'},
                status=status.HTTP_404_NOT_FOUND
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
                'costo_unitario': item_data['costo_unitario'],
                'precio_venta_sugerido': item_data.get('precio_venta_sugerido'),
                'actualizar_costo': item_data.get('actualizar_costo', True),
                'actualizar_precio': item_data.get('actualizar_precio', False)
            })
        
        # Crear compra
        try:
            compra = CompraService.crear_compra(
                proveedor=proveedor,
                usuario=request.user,
                deposito=deposito,
                items=items,
                numero_factura=data.get('numero_factura'),
                fecha_compra=data.get('fecha_compra'),
                observaciones=data.get('observaciones')
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serializar respuesta
        output_serializer = CompraSerializer(compra)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar una compra (solo admin)"""
        compra = self.get_object()
        
        try:
            compra_cancelada = CompraService.cancelar_compra(
                compra=compra,
                usuario_admin=request.user
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        output_serializer = CompraSerializer(compra_cancelada)
        return Response(output_serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_proveedor(self, request):
        """Historial de compras de un proveedor"""
        proveedor_id = request.query_params.get('proveedor_id')
        
        if not proveedor_id:
            return Response(
                {'error': 'Se requiere proveedor_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        compras = self.get_queryset().filter(proveedor_id=proveedor_id)
        
        # Paginación
        page = self.paginate_queryset(compras)
        if page is not None:
            serializer = CompraListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = CompraListSerializer(compras, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def adjuntos_factura(self, request, pk=None):
        """Sube una imagen de factura para la compra. Se comprime automáticamente."""
        compra = self.get_object()
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'error': 'Debe enviar un archivo en el campo "archivo"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Validar que sea imagen
        content_type = getattr(archivo, 'content_type', '') or ''
        if not content_type.startswith('image/'):
            return Response(
                {'error': 'El archivo debe ser una imagen (JPEG, PNG, etc.)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        comprimido = comprimir_imagen_factura(archivo)
        if comprimido is None:
            return Response(
                {'error': 'No se pudo procesar la imagen'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ultimo_orden = compra.adjuntos_factura.aggregate(
            ultimo=models.Max('orden')
        )
        orden = (ultimo_orden.get('ultimo') or 0) + 1
        adjunto = CompraFacturaAdjunto.objects.create(
            compra=compra,
            archivo=comprimido,
            orden=orden
        )
        serializer = CompraFacturaAdjuntoSerializer(adjunto, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def historial_costos(self, request):
        """Historial de costos de una variante. Params: variante_id"""
        variante_id = request.query_params.get('variante_id')
        if not variante_id:
            return Response({'error': 'variante_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        qs = HistorialCosto.objects.filter(variante_id=variante_id).select_related('usuario').order_by('-fecha')
        serializer = HistorialCostoSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})

    @action(detail=True, methods=['get'], url_path='adjuntos_factura/(?P<adjunto_id>[^/.]+)/descargar')
    def descargar_adjunto_factura(self, request, pk=None, adjunto_id=None):
        """Descarga un adjunto de factura por ID."""
        compra = self.get_object()
        try:
            adjunto = compra.adjuntos_factura.get(id=adjunto_id)
        except CompraFacturaAdjunto.DoesNotExist:
            raise Http404('Adjunto no encontrado')
        if not adjunto.archivo:
            raise Http404('Archivo no disponible')
        try:
            return FileResponse(
                adjunto.archivo.open('rb'),
                as_attachment=True,
                filename=adjunto.archivo.name.split('/')[-1] or f'factura_compra_{compra.numero}_{adjunto.id}.jpg'
            )
        except Exception:
            raise Http404('No se pudo abrir el archivo')


class OrdenCompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Órdenes de Compra.
    Soporta creación, emisión, recepción parcial/total y cancelación.
    """
    queryset = OrdenCompra.objects.select_related(
        'proveedor', 'usuario', 'deposito'
    ).prefetch_related('detalles__variante__producto_base__marca').all()
    serializer_class = OrdenCompraSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'proveedor', 'deposito']
    search_fields = ['numero', 'numero_referencia', 'proveedor__nombre']
    ordering_fields = ['fecha_emision', 'numero']
    ordering = ['-fecha_emision']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenCompraListSerializer
        if self.action == 'create':
            return OrdenCompraCreateSerializer
        return OrdenCompraSerializer

    def create(self, request, *args, **kwargs):
        serializer = OrdenCompraCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            proveedor = Proveedor.objects.get(id=data['proveedor_id'])
            deposito = Deposito.objects.get(id=data['deposito_id'])
        except Proveedor.DoesNotExist:
            return Response({'error': 'Proveedor no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Deposito.DoesNotExist:
            return Response({'error': 'Depósito no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        items = []
        for item in data['items']:
            try:
                variante = VarianteProducto.objects.get(id=item['variante_id'])
            except VarianteProducto.DoesNotExist:
                return Response(
                    {'error': f"Producto ID {item['variante_id']} no encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            items.append({
                'variante': variante,
                'cantidad_pedida': item['cantidad_pedida'],
                'costo_estimado': item.get('costo_estimado'),
            })

        try:
            orden = OrdenCompraService.crear_orden(
                proveedor=proveedor,
                usuario=request.user,
                deposito=deposito,
                items=items,
                fecha_esperada=data.get('fecha_esperada'),
                numero_referencia=data.get('numero_referencia'),
                observaciones=data.get('observaciones'),
                notas_proveedor=data.get('notas_proveedor'),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrdenCompraSerializer(orden).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def emitir(self, request, pk=None):
        """Cambia el estado de BORRADOR a EMITIDA."""
        orden = self.get_object()
        try:
            orden = OrdenCompraService.emitir(orden)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrdenCompraSerializer(orden).data)

    @action(detail=True, methods=['post'])
    def recibir(self, request, pk=None):
        """
        Registra una recepción parcial o total.
        Body: { items: [{detalle_id, cantidad_a_recibir, costo_real, ...}],
                numero_factura, fecha_compra, observaciones_compra }
        """
        orden = self.get_object()
        serializer = RecepcionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            orden, compra = OrdenCompraService.recibir(
                orden=orden,
                usuario=request.user,
                items_recibidos=data['items'],
                numero_factura=data.get('numero_factura'),
                fecha_compra=data.get('fecha_compra'),
                observaciones_compra=data.get('observaciones_compra'),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'orden': OrdenCompraSerializer(orden).data,
            'compra_generada': {
                'id': compra.id,
                'numero': compra.numero,
                'total': str(compra.total),
            }
        })

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela la orden (solo BORRADOR o EMITIDA o RECIBIDA_PARCIAL)."""
        orden = self.get_object()
        try:
            orden = OrdenCompraService.cancelar(orden, request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrdenCompraSerializer(orden).data)

    @action(detail=True, methods=['get'], url_path='generar_pdf')
    def generar_pdf(self, request, pk=None):
        """Descarga el PDF de una orden ya guardada."""
        from .orden_pdf import generar_pdf_orden_compra
        import datetime as dt
        orden = self.get_object()

        items = []
        for detalle in orden.detalles.select_related('variante__producto_base__marca').all():
            items.append({
                'codigo': detalle.variante.codigo or '—',
                'nombre': detalle.variante.nombre_completo,
                'cantidad_pedida': detalle.cantidad_pedida,
                'costo_estimado': detalle.costo_estimado,
            })

        orden_data = {
            'numero': orden.numero,
            'proveedor_nombre': orden.proveedor.nombre,
            'deposito_nombre': orden.deposito.nombre,
            'fecha_emision': orden.fecha_emision.strftime('%d/%m/%Y'),
            'fecha_esperada': orden.fecha_esperada.strftime('%d/%m/%Y') if orden.fecha_esperada else '—',
            'numero_referencia': orden.numero_referencia,
            'observaciones': orden.observaciones,
            'notas_proveedor': orden.notas_proveedor,
            'items': items,
            'total_estimado': orden.total_estimado,
        }

        pdf = generar_pdf_orden_compra(orden_data)
        response = FileResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="orden_{orden.numero:05d}.pdf"'
        return response

    @action(detail=False, methods=['post'], url_path='preview_pdf')
    def preview_pdf(self, request):
        """Genera PDF de una orden borrador sin guardarla en la base de datos."""
        from .orden_pdf import generar_pdf_orden_compra
        import datetime as dt
        data = request.data

        proveedor_nombre = '—'
        deposito_nombre = '—'
        if data.get('proveedor_id'):
            try:
                prov = Proveedor.objects.get(id=data['proveedor_id'])
                proveedor_nombre = prov.nombre
            except Proveedor.DoesNotExist:
                pass
        if data.get('deposito_id'):
            try:
                dep = Deposito.objects.get(id=data['deposito_id'])
                deposito_nombre = dep.nombre
            except Deposito.DoesNotExist:
                pass

        items = []
        for item in data.get('items', []):
            nombre = item.get('nombre') or '—'
            codigo = item.get('codigo') or '—'
            # Si viene variante_id y no tiene nombre propio, buscarlo
            if item.get('variante_id') and nombre == '—':
                try:
                    variante = VarianteProducto.objects.select_related(
                        'producto_base__marca'
                    ).get(id=item['variante_id'])
                    nombre = variante.nombre_completo
                    codigo = variante.codigo or '—'
                except VarianteProducto.DoesNotExist:
                    pass
            items.append({
                'codigo': codigo,
                'nombre': nombre,
                'cantidad_pedida': item.get('cantidad_pedida', 1),
                'costo_estimado': item.get('costo_estimado'),
            })

        total = sum(
            int(it.get('cantidad_pedida') or 1) * float(it.get('costo_estimado') or 0)
            for it in items
        )

        orden_data = {
            'numero': 'BORRADOR',
            'proveedor_nombre': proveedor_nombre,
            'deposito_nombre': deposito_nombre,
            'fecha_emision': dt.date.today().strftime('%d/%m/%Y'),
            'fecha_esperada': data.get('fecha_esperada') or '—',
            'numero_referencia': data.get('numero_referencia'),
            'observaciones': data.get('observaciones'),
            'notas_proveedor': data.get('notas_proveedor'),
            'items': items,
            'total_estimado': total,
        }

        pdf = generar_pdf_orden_compra(orden_data)
        response = FileResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="orden_borrador.pdf"'
        return response
