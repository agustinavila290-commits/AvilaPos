from rest_framework import serializers
from decimal import Decimal
from .models import Venta, DetalleVenta, Presupuesto, ItemPresupuesto
from apps.clientes.serializers import ClienteSerializer
from apps.productos.serializers import VarianteListSerializer


class DetalleVentaSerializer(serializers.ModelSerializer):
    """Serializer para detalle de venta"""
    variante_info = VarianteListSerializer(source='variante', read_only=True)
    codigo = serializers.CharField(source='variante.codigo', read_only=True)
    nombre_producto = serializers.CharField(source='variante.nombre_completo', read_only=True)
    precio_final_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    margen_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    margen_porcentaje = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = DetalleVenta
        fields = [
            'id',
            'variante',
            'variante_info',
            'codigo',
            'nombre_producto',
            'cantidad',
            'precio_unitario',
            'descuento_unitario',
            'precio_final_unitario',
            'subtotal',
            'costo_unitario',
            'margen_unitario',
            'margen_porcentaje'
        ]
        read_only_fields = ['id']


class VentaSerializer(serializers.ModelSerializer):
    """Serializer completo para venta"""
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    cliente_info = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()
    cliente_telefono = serializers.SerializerMethodField()
    cliente_whatsapp = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    margen_porcentaje = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    margen_es_bajo = serializers.BooleanField(read_only=True)
    factura_info = serializers.SerializerMethodField()
    
    transferencia_confirmada_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = [
            'id',
            'numero',
            'cliente',
            'cliente_info',
            'cliente_nombre',
            'cliente_telefono',
            'cliente_whatsapp',
            'usuario',
            'usuario_nombre',
            'deposito',
            'deposito_nombre',
            'fecha',
            'subtotal',
            'descuento_porcentaje',
            'descuento_monto',
            'total',
            'metodo_pago',
            'tarjeta_cupon_numero',
            'tarjeta_codigo_autorizacion',
            'metodo_pago_display',
            'estado',
            'estado_display',
            'motivo_anulacion',
            'usuario_anulacion',
            'fecha_anulacion',
            'detalles',
            'margen_porcentaje',
            'margen_es_bajo',
            'factura_info',
            # Transferencia
            'transferencia_banco',
            'transferencia_cuenta_destino',
            'transferencia_numero_operacion',
            'transferencia_observacion',
            'transferencia_estado',
            'transferencia_confirmada_por',
            'transferencia_confirmada_por_nombre',
            'transferencia_fecha_confirmacion',
        ]
        read_only_fields = [
            'id', 'numero', 'fecha', 'usuario', 'estado',
            'motivo_anulacion', 'usuario_anulacion', 'fecha_anulacion',
            'transferencia_confirmada_por', 'transferencia_fecha_confirmacion',
        ]

    def get_transferencia_confirmada_por_nombre(self, obj):
        if obj.transferencia_confirmada_por:
            u = obj.transferencia_confirmada_por
            return u.get_full_name() or u.username
        return None

    def get_cliente_info(self, obj):
        return ClienteSerializer(obj.cliente).data if obj.cliente else None

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo if obj.cliente else 'Consumidor final'

    def get_cliente_telefono(self, obj):
        return obj.cliente.telefono if obj.cliente else ''

    def get_cliente_whatsapp(self, obj):
        return getattr(obj.cliente, 'whatsapp', '') if obj.cliente else ''

    def get_factura_info(self, obj):
        factura = obj.facturas.filter(
            estado='AUTORIZADA'
        ).order_by('-fecha_emision').first()
        if not factura:
            return None
        return {
            'id': factura.id,
            'numero_completo': factura.numero_completo,
            'estado': factura.estado,
            'pdf_archivo': factura.pdf_archivo or '',
        }


class VentaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    cliente_nombre = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    factura_info = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = [
            'id', 'numero', 'cliente_nombre', 'usuario_nombre',
            'fecha', 'total', 'metodo_pago', 'metodo_pago_display',
            'estado_display', 'cantidad_items', 'factura_info',
            'transferencia_banco', 'transferencia_estado',
        ]

    def get_cantidad_items(self, obj):
        return obj.detalles.count()

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo if obj.cliente else 'Consumidor final'

    def get_factura_info(self, obj):
        factura = obj.facturas.filter(estado='AUTORIZADA').order_by('-fecha_emision').first()
        if not factura:
            return None
        return {
            'id': factura.id,
            'numero_completo': factura.numero_completo,
            'pdf_archivo': factura.pdf_archivo or '',
        }


class DetalleVentaCreateSerializer(serializers.Serializer):
    """Serializer para crear detalle de venta"""
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    descuento_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        default=0
    )


class VentaCreateSerializer(serializers.Serializer):
    """Serializer para crear venta"""
    cliente_id = serializers.IntegerField(required=False, allow_null=True)
    deposito_id = serializers.IntegerField()
    metodo_pago = serializers.ChoiceField(choices=Venta.MetodoPago.choices)
    descuento_porcentaje = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=0, max_value=100, default=0
    )
    descuento_monto = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, default=0
    )
    items = DetalleVentaCreateSerializer(many=True)
    # Campos opcionales de transferencia
    transferencia_banco = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La venta debe tener al menos un producto")
        return value

    def validate(self, data):
        if data.get('descuento_porcentaje', 0) > 0 and data.get('descuento_monto', 0) > 0:
            raise serializers.ValidationError(
                "No se puede aplicar descuento por porcentaje y monto a la vez"
            )
        return data


class AnularVentaSerializer(serializers.Serializer):
    """Serializer para anular venta"""
    motivo = serializers.CharField(
        min_length=10,
        required=True,
        error_messages={
            'required': 'El motivo es obligatorio',
            'min_length': 'El motivo debe tener al menos 10 caracteres'
        }
    )


# ─── Presupuestos ───────────────────────────────────────────────────────────────

class ItemPresupuestoSerializer(serializers.ModelSerializer):
    codigo        = serializers.CharField(source='variante.codigo', read_only=True)
    nombre        = serializers.CharField(source='variante.nombre_completo', read_only=True)
    variante_info = VarianteListSerializer(source='variante', read_only=True)

    class Meta:
        model  = ItemPresupuesto
        fields = ['id', 'variante', 'variante_info', 'codigo', 'nombre',
                  'cantidad', 'precio_unitario', 'descuento_unitario', 'subtotal']
        read_only_fields = ['id']


class PresupuestoSerializer(serializers.ModelSerializer):
    items           = ItemPresupuestoSerializer(many=True, read_only=True)
    cliente_info    = serializers.SerializerMethodField()
    nombre_cliente  = serializers.SerializerMethodField()
    usuario_nombre  = serializers.CharField(source='usuario.get_full_name', read_only=True)
    estado_display  = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencido    = serializers.BooleanField(read_only=True)
    venta_numero    = serializers.SerializerMethodField()

    class Meta:
        model  = Presupuesto
        fields = [
            'id', 'numero', 'cliente', 'cliente_info', 'nombre_cliente',
            'cliente_nombre_manual', 'usuario', 'usuario_nombre',
            'deposito', 'fecha_creacion', 'fecha_vencimiento',
            'observaciones', 'estado', 'estado_display', 'esta_vencido',
            'subtotal', 'descuento_porcentaje', 'descuento_monto', 'total',
            'venta', 'venta_numero', 'items',
        ]
        read_only_fields = ['id', 'numero', 'usuario', 'fecha_creacion', 'venta']

    def get_cliente_info(self, obj):
        return ClienteSerializer(obj.cliente).data if obj.cliente else None

    def get_nombre_cliente(self, obj):
        return obj.nombre_cliente

    def get_venta_numero(self, obj):
        return obj.venta.numero if obj.venta else None


class PresupuestoListSerializer(serializers.ModelSerializer):
    nombre_cliente = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencido   = serializers.BooleanField(read_only=True)
    cantidad_items = serializers.SerializerMethodField()

    class Meta:
        model  = Presupuesto
        fields = [
            'id', 'numero', 'nombre_cliente', 'fecha_creacion',
            'fecha_vencimiento', 'total', 'estado', 'estado_display',
            'esta_vencido', 'cantidad_items',
        ]

    def get_nombre_cliente(self, obj): return obj.nombre_cliente
    def get_cantidad_items(self, obj): return obj.items.count()


class ItemPresupuestoCreateSerializer(serializers.Serializer):
    variante_id       = serializers.IntegerField()
    cantidad          = serializers.IntegerField(min_value=1)
    precio_unitario   = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    descuento_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)


class PresupuestoCreateSerializer(serializers.Serializer):
    cliente_id            = serializers.IntegerField(required=False, allow_null=True)
    cliente_nombre_manual = serializers.CharField(required=False, allow_blank=True, default='')
    deposito_id           = serializers.IntegerField(required=False, allow_null=True)
    fecha_vencimiento     = serializers.DateField(required=False, allow_null=True)
    observaciones         = serializers.CharField(required=False, allow_blank=True, default='')
    descuento_porcentaje  = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100, default=0)
    descuento_monto       = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, default=0)
    items                 = ItemPresupuestoCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("El presupuesto debe tener al menos un producto")
        return value
