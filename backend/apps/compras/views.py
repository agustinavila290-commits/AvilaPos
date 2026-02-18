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

from .models import Proveedor, Compra, CompraFacturaAdjunto
from apps.inventario.models import Deposito
from apps.productos.models import VarianteProducto
from .serializers import (
    ProveedorSerializer,
    CompraSerializer,
    CompraListSerializer,
    CompraCreateSerializer,
    CompraFacturaAdjuntoSerializer
)
from .services import CompraService
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
