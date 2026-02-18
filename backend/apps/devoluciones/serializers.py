"""
Serializers para devoluciones.
"""
from rest_framework import serializers
from django.db import transaction
from decimal import Decimal

from .models import DevolucionVenta, DetalleDevolucion, NotaCredito
from apps.ventas.models import Venta, DetalleVenta
from apps.ventas.serializers import VentaListSerializer


class DetalleDevolucionSerializer(serializers.ModelSerializer):
    """Serializer para detalle de devolución"""
    nombre_producto = serializers.CharField(source='variante.nombre_completo', read_only=True)
    sku = serializers.CharField(source='variante.sku', read_only=True)
    codigo_barras = serializers.CharField(source='variante.codigo_barras', read_only=True)
    
    class Meta:
        model = DetalleDevolucion
        fields = [
            'id',
            'detalle_venta',
            'variante',
            'nombre_producto',
            'sku',
            'codigo_barras',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'estado_producto'
        ]
        read_only_fields = ['id', 'subtotal']


class DevolucionVentaSerializer(serializers.ModelSerializer):
    """Serializer completo para devolución"""
    detalles = DetalleDevolucionSerializer(many=True, read_only=True)
    venta_info = VentaListSerializer(source='venta', read_only=True)
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name',
        read_only=True
    )
    motivo_display = serializers.CharField(
        source='get_motivo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    
    class Meta:
        model = DevolucionVenta
        fields = [
            'id',
            'numero',
            'venta',
            'venta_info',
            'usuario',
            'usuario_nombre',
            'fecha',
            'motivo',
            'motivo_display',
            'observaciones',
            'deposito',
            'total',
            'estado',
            'estado_display',
            'genera_nota_credito',
            'detalles'
        ]
        read_only_fields = ['id', 'numero', 'fecha', 'total']


class DevolucionVentaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    venta_numero = serializers.IntegerField(source='venta.numero', read_only=True)
    cliente_nombre = serializers.CharField(source='venta.cliente.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    
    class Meta:
        model = DevolucionVenta
        fields = [
            'id',
            'numero',
            'venta',
            'venta_numero',
            'cliente_nombre',
            'usuario_nombre',
            'fecha',
            'motivo',
            'motivo_display',
            'total',
            'estado',
            'estado_display',
            'cantidad_items',
            'genera_nota_credito'
        ]
    
    def get_cantidad_items(self, obj):
        return obj.detalles.count()


class DetalleDevolucionCreateSerializer(serializers.Serializer):
    """Serializer para crear detalles de devolución"""
    detalle_venta_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    estado_producto = serializers.CharField(required=False, allow_blank=True)


class DevolucionVentaCreateSerializer(serializers.Serializer):
    """Serializer para crear una devolución"""
    venta_id = serializers.IntegerField()
    motivo = serializers.ChoiceField(choices=DevolucionVenta.MotivoDevolucion.choices)
    observaciones = serializers.CharField(required=False, allow_blank=True)
    deposito_id = serializers.IntegerField()
    genera_nota_credito = serializers.BooleanField(default=True)
    items = DetalleDevolucionCreateSerializer(many=True)
    
    def validate_venta_id(self, value):
        """Valida que la venta existe y está completada"""
        try:
            venta = Venta.objects.get(id=value)
            if venta.estado != Venta.EstadoVenta.COMPLETADA:
                raise serializers.ValidationError(
                    'Solo se pueden hacer devoluciones de ventas completadas'
                )
            return value
        except Venta.DoesNotExist:
            raise serializers.ValidationError('La venta no existe')
    
    def validate_items(self, items):
        """Valida los items de la devolución"""
        if not items:
            raise serializers.ValidationError('Debe incluir al menos un producto')
        
        # Verificar que no haya duplicados
        detalles_ids = [item['detalle_venta_id'] for item in items]
        if len(detalles_ids) != len(set(detalles_ids)):
            raise serializers.ValidationError('No puede haber productos duplicados')
        
        return items
    
    def validate(self, data):
        """Validaciones cruzadas"""
        venta_id = data['venta_id']
        items = data['items']
        
        # Verificar que todos los detalles pertenecen a la venta
        venta = Venta.objects.get(id=venta_id)
        detalles_venta = DetalleVenta.objects.filter(
            venta=venta,
            id__in=[item['detalle_venta_id'] for item in items]
        )
        
        if detalles_venta.count() != len(items):
            raise serializers.ValidationError(
                'Algunos productos no pertenecen a esta venta'
            )
        
        # Verificar cantidades
        for item in items:
            detalle = detalles_venta.get(id=item['detalle_venta_id'])
            
            # Calcular cantidad ya devuelta
            cantidad_devuelta = DetalleDevolucion.objects.filter(
                detalle_venta=detalle,
                devolucion__estado__in=[
                    DevolucionVenta.EstadoDevolucion.PENDIENTE,
                    DevolucionVenta.EstadoDevolucion.PROCESADA
                ]
            ).aggregate(total=models.Sum('cantidad'))['total'] or 0
            
            cantidad_disponible = detalle.cantidad - cantidad_devuelta
            
            if item['cantidad'] > cantidad_disponible:
                raise serializers.ValidationError(
                    f"No se pueden devolver {item['cantidad']} unidades de "
                    f"{detalle.variante.nombre_completo}. "
                    f"Solo hay {cantidad_disponible} disponibles."
                )
        
        return data


class NotaCreditoSerializer(serializers.ModelSerializer):
    """Serializer para notas de crédito"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    devolucion_numero = serializers.IntegerField(source='devolucion.numero', read_only=True)
    saldo_disponible = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = NotaCredito
        fields = [
            'id',
            'numero',
            'devolucion',
            'devolucion_numero',
            'cliente',
            'cliente_nombre',
            'monto',
            'monto_utilizado',
            'saldo_disponible',
            'fecha_emision',
            'fecha_vencimiento',
            'estado',
            'estado_display',
            'observaciones'
        ]
        read_only_fields = [
            'id',
            'numero',
            'fecha_emision',
            'monto_utilizado',
            'saldo_disponible'
        ]
