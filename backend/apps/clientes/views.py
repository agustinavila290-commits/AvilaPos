from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from decimal import Decimal

from .models import Cliente
from .serializers import (
    ClienteSerializer,
    ClienteCreateSerializer,
    ClienteUpdateSerializer,
    ClienteQuickCreateSerializer
)
from apps.usuarios.permissions import IsCajero
from apps.ventas.models import Venta


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de clientes.
    Accesible por cajeros y administradores.
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ClienteCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ClienteUpdateSerializer
        elif self.action == 'quick_create':
            return ClienteQuickCreateSerializer
        return ClienteSerializer
    
    def get_queryset(self):
        """
        Filtra clientes según parámetros de búsqueda.
        Soporta búsqueda por DNI, nombre, teléfono
        """
        queryset = super().get_queryset()
        
        # Filtrar por estado activo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo_bool = activo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(activo=activo_bool)
        
        # Búsqueda general (DNI, nombre, teléfono)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(dni__icontains=search) |
                Q(nombre__icontains=search) |
                Q(telefono__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Búsqueda específica por DNI (exacto)
        dni = self.request.query_params.get('dni', None)
        if dni:
            queryset = queryset.filter(dni=dni)
        
        return queryset.order_by('-fecha_creacion')
    
    @action(detail=False, methods=['post'])
    def quick_create(self, request):
        """
        Endpoint para alta rápida de cliente.
        Solo requiere DNI, nombre y teléfono.
        Usado principalmente desde el módulo de ventas.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()
        
        # Retornar con el serializer completo
        output_serializer = ClienteSerializer(cliente)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        """
        Obtiene el historial de ventas del cliente (solo ventas completadas, no anuladas).
        """
        cliente = self.get_object()
        ventas_qs = Venta.objects.filter(
            cliente=cliente,
            estado=Venta.EstadoVenta.COMPLETADA
        ).order_by('-fecha')

        agregado = ventas_qs.aggregate(total=Sum('total'))
        total_gastado = agregado['total'] if agregado['total'] is not None else Decimal('0')
        cantidad_compras = ventas_qs.count()
        ticket_promedio = (total_gastado / cantidad_compras) if cantidad_compras else Decimal('0')

        ventas_list = [
            {
                'id': v.id,
                'numero': v.numero,
                'fecha': v.fecha,
                'total': float(v.total),
                'estado': v.estado,
            }
            for v in ventas_qs[:100]
        ]

        return Response({
            'cliente': ClienteSerializer(cliente).data,
            'ventas': ventas_list,
            'total_gastado': float(total_gastado),
            'cantidad_compras': cantidad_compras,
            'ticket_promedio': float(ticket_promedio),
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar cliente"""
        cliente = self.get_object()
        cliente.activo = not cliente.activo
        cliente.save()
        
        serializer = self.get_serializer(cliente)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buscar_dni(self, request):
        """
        Búsqueda específica por DNI.
        Retorna el cliente si existe, o 404 si no.
        Usado para verificar si el cliente ya existe antes de crear.
        """
        dni = request.query_params.get('dni', None)
        
        if not dni:
            return Response(
                {'error': 'Debes proporcionar un DNI'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(dni=dni)
            serializer = self.get_serializer(cliente)
            return Response(serializer.data)
        except Cliente.DoesNotExist:
            return Response(
                {'error': 'Cliente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
