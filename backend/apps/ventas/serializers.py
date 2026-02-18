"""
Serializers para el módulo de ventas.
"""
from rest_framework import serializers
from decimal import Decimal
from .models import Venta, DetalleVenta
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
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    margen_porcentaje = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    margen_es_bajo = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Venta
        fields = [
            'id',
            'numero',
            'cliente',
            'cliente_info',
            'cliente_nombre',
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
            'metodo_pago_display',
            'estado',
            'estado_display',
            'motivo_anulacion',
            'usuario_anulacion',
            'fecha_anulacion',
            'detalles',
            'margen_porcentaje',
            'margen_es_bajo'
        ]
        read_only_fields = [
            'id',
            'numero',
            'fecha',
            'usuario',
            'estado',
            'motivo_anulacion',
            'usuario_anulacion',
            'fecha_anulacion'
        ]

    def get_cliente_info(self, obj):
        return ClienteSerializer(obj.cliente).data if obj.cliente else None

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo if obj.cliente else 'Consumidor final'


class VentaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    cliente_nombre = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Venta
        fields = [
            'id',
            'numero',
            'cliente_nombre',
            'usuario_nombre',
            'fecha',
            'total',
            'metodo_pago_display',
            'estado_display',
            'cantidad_items'
        ]
    
    def get_cantidad_items(self, obj):
        return obj.detalles.count()

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo if obj.cliente else 'Consumidor final'


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
    clover_pago_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID del pago Clover si se cobró con tarjeta vía Clover'
    )
    descuento_porcentaje = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=0,
        max_value=100,
        default=0
    )
    descuento_monto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        default=0
    )
    items = DetalleVentaCreateSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La venta debe tener al menos un producto")
        return value
    
    def validate(self, data):
        # No se puede usar descuento_porcentaje y descuento_monto a la vez
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
