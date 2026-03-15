"""Views para tickets de cuenta corriente."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import TicketCuentaCorriente, DetalleTicketCC
from .serializers import (
    TicketCuentaCorrienteSerializer,
    TicketCuentaCorrienteListSerializer,
    TicketCreateSerializer,
    AgregarItemSerializer,
    DevolverItemSerializer,
    CerrarTicketSerializer,
)
from .services import TicketCuentaCorrienteService
from apps.clientes.models import Cliente
from apps.inventario.models import Deposito
from apps.productos.models import VarianteProducto
from apps.usuarios.permissions import IsCajero


class TicketCuentaCorrienteViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'head', 'options']
    queryset = TicketCuentaCorriente.objects.select_related(
        'cliente', 'deposito', 'usuario_apertura', 'usuario_cierre', 'venta'
    ).prefetch_related('detalles__variante').all()

    serializer_class = TicketCuentaCorrienteSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['cliente', 'estado', 'deposito']

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketCuentaCorrienteListSerializer
        return TicketCuentaCorrienteSerializer

    def create(self, request):
        """Abrir nuevo ticket."""
        ser = TicketCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            cliente = Cliente.objects.get(id=data['cliente_id'])
        except Cliente.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        try:
            deposito = Deposito.objects.get(id=data['deposito_id'])
        except Deposito.DoesNotExist:
            return Response({'error': 'Depósito no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            ticket = TicketCuentaCorrienteService.abrir_ticket(
                cliente=cliente,
                deposito=deposito,
                usuario=request.user,
                descripcion=data.get('descripcion', ''),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output = TicketCuentaCorrienteSerializer(ticket)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def agregar_item(self, request, pk=None):
        ticket = self.get_object()
        ser = AgregarItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            variante = VarianteProducto.objects.get(id=data['variante_id'])
        except VarianteProducto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            TicketCuentaCorrienteService.agregar_item(
                ticket=ticket,
                variante=variante,
                cantidad=data['cantidad'],
                precio_unitario=data['precio_unitario'],
                usuario=request.user,
                descuento_unitario=data.get('descuento_unitario', 0),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        ticket.refresh_from_db()
        output = TicketCuentaCorrienteSerializer(ticket)
        return Response(output.data)

    @action(detail=True, methods=['post'])
    def devolver_item(self, request, pk=None):
        ticket = self.get_object()
        ser = DevolverItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            detalle = DetalleTicketCC.objects.get(id=data['detalle_id'], ticket=ticket)
        except DetalleTicketCC.DoesNotExist:
            return Response({'error': 'Detalle no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            TicketCuentaCorrienteService.devolver_item(
                ticket=ticket,
                detalle=detalle,
                cantidad_a_devolver=data['cantidad'],
                usuario=request.user,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        ticket.refresh_from_db()
        output = TicketCuentaCorrienteSerializer(ticket)
        return Response(output.data)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        ticket = self.get_object()
        ser = CerrarTicketSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            venta = TicketCuentaCorrienteService.cerrar_ticket(
                ticket=ticket,
                usuario=request.user,
                metodo_pago=data['metodo_pago'],
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        from apps.ventas.serializers import VentaSerializer
        return Response({
            'ticket': TicketCuentaCorrienteSerializer(ticket).data,
            'venta': VentaSerializer(venta).data,
        })
