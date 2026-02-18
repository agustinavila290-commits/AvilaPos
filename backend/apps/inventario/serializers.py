"""
Serializers para el módulo de inventario.
"""
from rest_framework import serializers
from .models import Deposito, Stock, MovimientoStock
from apps.productos.serializers import VarianteListSerializer


class DepositoSerializer(serializers.ModelSerializer):
    """Serializer para Deposito"""
    
    class Meta:
        model = Deposito
        fields = [
            'id',
            'nombre',
            'direccion',
            'activo',
            'es_principal',
            'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class StockSerializer(serializers.ModelSerializer):
    """Serializer detallado para Stock"""
    variante = VarianteListSerializer(read_only=True)
    deposito = DepositoSerializer(read_only=True)
    es_critico = serializers.BooleanField(read_only=True)
    estado = serializers.CharField(read_only=True)
    
    # Datos adicionales de la variante para facilitar búsqueda
    codigo = serializers.CharField(source='variante.codigo', read_only=True)
    nombre_completo = serializers.CharField(source='variante.nombre_completo', read_only=True)
    marca = serializers.CharField(source='variante.producto_base.marca.nombre', read_only=True)
    
    class Meta:
        model = Stock
        fields = [
            'id',
            'variante',
            'deposito',
            'cantidad',
            'es_critico',
            'estado',
            'fecha_actualizacion',
            # Campos adicionales
            'codigo',
            'nombre_completo',
            'marca'
        ]
        read_only_fields = ['id', 'fecha_actualizacion']


class StockListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de stock"""
    codigo = serializers.SerializerMethodField()
    sku = serializers.SerializerMethodField()
    codigo_barras = serializers.SerializerMethodField()
    nombre_completo = serializers.SerializerMethodField()
    marca = serializers.SerializerMethodField()
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    es_critico = serializers.SerializerMethodField()
    estado = serializers.SerializerMethodField()

    def get_codigo(self, obj):
        try:
            return obj.variante.codigo if obj.variante else ''
        except Exception:
            return ''

    def get_sku(self, obj):
        return self.get_codigo(obj)

    def get_codigo_barras(self, obj):
        return self.get_codigo(obj)

    def get_nombre_completo(self, obj):
        try:
            if obj.variante:
                return obj.variante.nombre_completo
        except Exception:
            pass
        try:
            return obj.variante.codigo if obj.variante else '—'
        except Exception:
            return '—'

    def get_marca(self, obj):
        try:
            return obj.variante.producto_base.marca.nombre if obj.variante and obj.variante.producto_base and obj.variante.producto_base.marca else ''
        except Exception:
            return ''

    def get_es_critico(self, obj):
        try:
            return obj.es_critico
        except Exception:
            return obj.cantidad <= 2

    def get_estado(self, obj):
        try:
            return obj.estado
        except Exception:
            if obj.cantidad <= 0:
                return 'SIN_STOCK'
            if obj.cantidad <= 2:
                return 'CRITICO'
            if obj.cantidad <= 5:
                return 'BAJO'
            return 'NORMAL'
    
    class Meta:
        model = Stock
        fields = [
            'id',
            'variante',
            'deposito',
            'deposito_nombre',
            'cantidad',
            'es_critico',
            'estado',
            'codigo',
            'sku',
            'codigo_barras',
            'nombre_completo',
            'marca',
            'fecha_actualizacion'
        ]


class MovimientoStockSerializer(serializers.ModelSerializer):
    """Serializer para MovimientoStock"""
    variante_codigo = serializers.CharField(source='variante.codigo', read_only=True)
    variante_nombre = serializers.CharField(source='variante.nombre_completo', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = MovimientoStock
        fields = [
            'id',
            'variante',
            'variante_codigo',
            'variante_nombre',
            'deposito',
            'deposito_nombre',
            'tipo',
            'tipo_display',
            'cantidad',
            'usuario',
            'usuario_nombre',
            'fecha',
            'referencia_tipo',
            'referencia_id',
            'observaciones',
            'stock_anterior',
            'stock_posterior'
        ]
        read_only_fields = [
            'id',
            'fecha',
            'stock_anterior',
            'stock_posterior'
        ]


class AjusteStockSerializer(serializers.Serializer):
    """Serializer para ajuste manual de stock"""
    variante_id = serializers.IntegerField()
    deposito_id = serializers.IntegerField()
    nueva_cantidad = serializers.IntegerField(min_value=0)
    observaciones = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'Las observaciones son obligatorias para ajustes de stock',
            'blank': 'Las observaciones no pueden estar vacías'
        }
    )


class ConsultaStockSerializer(serializers.Serializer):
    """Serializer para consultar stock de una variante"""
    variante_id = serializers.IntegerField()
    deposito_id = serializers.IntegerField(required=False)
