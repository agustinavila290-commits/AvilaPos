"""
ViewSet para Presupuestos.
Separado de views.py para mantener el código organizado.
"""
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.utils import timezone

from .models import Presupuesto, ItemPresupuesto
from apps.clientes.models import Cliente
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito
from .serializers import (
    PresupuestoSerializer,
    PresupuestoListSerializer,
    PresupuestoCreateSerializer,
)
from .services import VentaService
from .presupuesto_pdf import generar_pdf_presupuesto


class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.select_related(
        'cliente', 'usuario', 'deposito', 'venta'
    ).prefetch_related('items__variante').all()
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['estado', 'cliente']
    search_fields      = ['numero', 'cliente__nombre', 'cliente__apellido', 'cliente_nombre_manual']
    ordering_fields    = ['fecha_creacion', 'total', 'numero']
    ordering           = ['-fecha_creacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return PresupuestoListSerializer
        if self.action in ('create', 'partial_update'):
            return PresupuestoCreateSerializer
        return PresupuestoSerializer

    def create(self, request, *args, **kwargs):
        serializer = PresupuestoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Resolver cliente
        cliente = None
        if data.get('cliente_id'):
            try:
                cliente = Cliente.objects.get(id=data['cliente_id'])
            except Cliente.DoesNotExist:
                return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Resolver depósito (opcional para presupuestos)
        deposito = None
        if data.get('deposito_id'):
            try:
                deposito = Deposito.objects.get(id=data['deposito_id'])
            except Deposito.DoesNotExist:
                return Response({'error': 'Depósito no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if not deposito:
            deposito = Deposito.objects.filter(activo=True).first()

        # Calcular totales
        subtotal = Decimal('0')
        items_validos = []
        for item_data in data['items']:
            try:
                variante = VarianteProducto.objects.get(id=item_data['variante_id'])
            except VarianteProducto.DoesNotExist:
                return Response(
                    {'error': f"Variante {item_data['variante_id']} no encontrada"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            precio    = Decimal(str(item_data['precio_unitario']))
            descuento = Decimal(str(item_data.get('descuento_unitario', 0)))
            cant      = item_data['cantidad']
            sub       = (precio - descuento) * cant
            subtotal += sub
            items_validos.append({
                'variante': variante, 'cantidad': cant,
                'precio_unitario': precio, 'descuento_unitario': descuento,
                'subtotal': sub,
            })

        # Descuento general
        desc_pct   = Decimal(str(data.get('descuento_porcentaje', 0)))
        desc_monto = Decimal(str(data.get('descuento_monto', 0)))
        if desc_monto > 0:
            total = subtotal - desc_monto
        elif desc_pct > 0:
            desc_monto = subtotal * desc_pct / 100
            total = subtotal - desc_monto
        else:
            total = subtotal

        # Crear presupuesto
        presupuesto = Presupuesto.objects.create(
            cliente=cliente,
            cliente_nombre_manual=data.get('cliente_nombre_manual', ''),
            usuario=request.user,
            deposito=deposito,
            fecha_vencimiento=data.get('fecha_vencimiento'),
            observaciones=data.get('observaciones', ''),
            subtotal=subtotal,
            descuento_porcentaje=desc_pct,
            descuento_monto=desc_monto,
            total=total,
        )
        for item in items_validos:
            ItemPresupuesto.objects.create(presupuesto=presupuesto, **item)

        return Response(PresupuestoSerializer(presupuesto).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        presupuesto = self.get_object()
        if presupuesto.estado == 'CONVERTIDO':
            return Response({'error': 'No se puede editar un presupuesto convertido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Solo actualizar campos simples (no ítems por ahora)
        campos = ['fecha_vencimiento', 'observaciones', 'estado', 'cliente_nombre_manual']
        for campo in campos:
            if campo in request.data:
                setattr(presupuesto, campo, request.data[campo])
        presupuesto.save()
        return Response(PresupuestoSerializer(presupuesto).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Descargar PDF del presupuesto."""
        presupuesto = self.get_object()
        buf = generar_pdf_presupuesto(presupuesto)
        nombre = f"presupuesto_{presupuesto.numero:05d}.pdf"
        return FileResponse(buf, content_type='application/pdf',
                            as_attachment=True, filename=nombre)

    @action(detail=True, methods=['post'])
    def convertir(self, request, pk=None):
        """Convierte el presupuesto en una Venta y descuenta stock."""
        presupuesto = self.get_object()

        if presupuesto.estado == 'CONVERTIDO':
            return Response({'error': 'Ya fue convertido.'}, status=status.HTTP_400_BAD_REQUEST)
        if presupuesto.esta_vencido:
            return Response({'error': 'El presupuesto está vencido.'}, status=status.HTTP_400_BAD_REQUEST)

        metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
        if metodo_pago not in ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA'):
            metodo_pago = 'EFECTIVO'

        deposito = presupuesto.deposito
        if not deposito:
            deposito = Deposito.objects.filter(activo=True).first()
        if not deposito:
            return Response({'error': 'No hay depósito disponible.'}, status=status.HTTP_400_BAD_REQUEST)

        items = [
            {
                'variante': item.variante,
                'cantidad': item.cantidad,
                'precio_unitario': item.precio_unitario,
                'descuento_unitario': item.descuento_unitario,
            }
            for item in presupuesto.items.select_related('variante').all()
        ]

        try:
            venta = VentaService.crear_venta(
                cliente=presupuesto.cliente,
                usuario=request.user,
                deposito=deposito,
                items=items,
                metodo_pago=metodo_pago,
                descuento_porcentaje=presupuesto.descuento_porcentaje,
                descuento_monto=presupuesto.descuento_monto,
                transferencia_banco=request.data.get('transferencia_banco', ''),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        presupuesto.estado = 'CONVERTIDO'
        presupuesto.venta  = venta
        presupuesto.save(update_fields=['estado', 'venta'])

        return Response({'venta_id': venta.id, 'venta_numero': venta.numero})

    @action(detail=True, methods=['patch'])
    def marcar_enviado(self, request, pk=None):
        """Marca el presupuesto como ENVIADO."""
        presupuesto = self.get_object()
        if presupuesto.estado not in ('BORRADOR', 'ENVIADO'):
            return Response({'error': f'No se puede marcar como enviado desde {presupuesto.estado}.'}, status=status.HTTP_400_BAD_REQUEST)
        presupuesto.estado = 'ENVIADO'
        presupuesto.save(update_fields=['estado'])
        return Response(PresupuestoSerializer(presupuesto).data)
