"""Serializers para tickets de cuenta corriente."""
from rest_framework import serializers
from .models import TicketCuentaCorriente, DetalleTicketCC, PagoTicketCC
from apps.ventas.models import Venta
from apps.productos.serializers import VarianteListSerializer


class PagoTicketCCSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    class Meta:
        model = PagoTicketCC
        fields = ['id', 'ticket', 'usuario', 'usuario_nombre', 'fecha',
                  'monto', 'metodo_pago', 'metodo_pago_display', 'observacion']
        read_only_fields = ['id', 'ticket', 'usuario', 'fecha']


class DetalleTicketCCSerializer(serializers.ModelSerializer):
    variante_info = VarianteListSerializer(source='variante', read_only=True)
    codigo = serializers.CharField(source='variante.codigo', read_only=True)
    nombre_producto = serializers.CharField(source='variante.nombre_completo', read_only=True)

    class Meta:
        model = DetalleTicketCC
        fields = [
            'id', 'ticket', 'variante', 'variante_info', 'codigo', 'nombre_producto',
            'cantidad', 'precio_unitario', 'descuento_unitario', 'subtotal', 'costo_unitario',
        ]
        read_only_fields = ['id', 'subtotal']


class TicketCuentaCorrienteSerializer(serializers.ModelSerializer):
    detalles = DetalleTicketCCSerializer(many=True, read_only=True)
    pagos = PagoTicketCCSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_telefono = serializers.CharField(source='cliente.telefono', read_only=True)
    cliente_whatsapp = serializers.CharField(source='cliente.whatsapp', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    usuario_apertura_nombre = serializers.CharField(source='usuario_apertura.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = TicketCuentaCorriente
        fields = [
            'id', 'numero', 'cliente', 'cliente_nombre', 'cliente_telefono', 'cliente_whatsapp',
            'deposito', 'deposito_nombre',
            'usuario_apertura', 'usuario_apertura_nombre', 'descripcion', 'estado', 'estado_display',
            'fecha_apertura', 'fecha_cierre', 'fecha_vencimiento', 'venta', 'usuario_cierre',
            'subtotal', 'total', 'saldo_pendiente', 'esta_vencido', 'detalles', 'pagos',
        ]
        read_only_fields = [
            'id', 'numero', 'fecha_apertura', 'fecha_cierre', 'subtotal', 'total',
            'usuario_apertura', 'venta', 'usuario_cierre', 'saldo_pendiente', 'esta_vencido',
        ]


class TicketCuentaCorrienteListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_telefono = serializers.CharField(source='cliente.telefono', read_only=True)
    cliente_whatsapp = serializers.CharField(source='cliente.whatsapp', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = TicketCuentaCorriente
        fields = [
            'id', 'numero', 'cliente', 'cliente_nombre', 'cliente_telefono', 'cliente_whatsapp',
            'deposito_nombre',
            'descripcion', 'estado', 'estado_display', 'total', 'saldo_pendiente',
            'esta_vencido', 'fecha_apertura', 'fecha_cierre', 'fecha_vencimiento',
        ]


class TicketCreateSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField()
    deposito_id = serializers.IntegerField()
    descripcion = serializers.CharField(required=False, allow_blank=True, default='')


class AgregarItemSerializer(serializers.Serializer):
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    descuento_unitario = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, default=0, required=False
    )


class DevolverItemSerializer(serializers.Serializer):
    detalle_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)


class CerrarTicketSerializer(serializers.Serializer):
    metodo_pago = serializers.ChoiceField(choices=[c[0] for c in Venta.MetodoPago.choices])


class RegistrarPagoSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    metodo_pago = serializers.ChoiceField(
        choices=[c[0] for c in PagoTicketCC.MetodoPago.choices],
        default='EFECTIVO'
    )
    observacion = serializers.CharField(required=False, allow_blank=True, default='')
