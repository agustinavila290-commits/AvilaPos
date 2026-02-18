"""
Serializers para el módulo de compras.
"""
from rest_framework import serializers
from .models import Proveedor, Compra, DetalleCompra, CompraFacturaAdjunto
from apps.productos.serializers import VarianteListSerializer


class ProveedorSerializer(serializers.ModelSerializer):
    """Serializer para proveedores"""
    
    class Meta:
        model = Proveedor
        fields = [
            'id',
            'nombre',
            'razon_social',
            'cuit',
            'telefono',
            'email',
            'direccion',
            'observaciones',
            'activo',
            'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']
    
    def validate_nombre(self, value):
        nombre = (value or '').strip()
        if not nombre:
            raise serializers.ValidationError('El nombre es obligatorio.')
        if self.instance and Proveedor.objects.filter(nombre__iexact=nombre).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('Ya existe un proveedor con ese nombre.')
        if not self.instance and Proveedor.objects.filter(nombre__iexact=nombre).exists():
            raise serializers.ValidationError('Ya existe un proveedor con ese nombre.')
        return nombre


class DetalleCompraSerializer(serializers.ModelSerializer):
    """Serializer para detalle de compra"""
    variante_info = VarianteListSerializer(source='variante', read_only=True)
    codigo = serializers.CharField(source='variante.codigo', read_only=True)
    nombre_producto = serializers.CharField(source='variante.nombre_completo', read_only=True)
    
    class Meta:
        model = DetalleCompra
        fields = [
            'id',
            'variante',
            'variante_info',
            'sku',
            'nombre_producto',
            'cantidad',
            'costo_unitario',
            'subtotal',
            'precio_venta_sugerido',
            'actualizar_costo',
            'actualizar_precio'
        ]
        read_only_fields = ['id']


class CompraFacturaAdjuntoSerializer(serializers.ModelSerializer):
    """Serializer para adjuntos de factura (imágenes)"""
    url_descarga = serializers.SerializerMethodField()

    class Meta:
        model = CompraFacturaAdjunto
        fields = ['id', 'archivo', 'orden', 'fecha_subida', 'url_descarga']
        read_only_fields = ['id', 'fecha_subida']

    def get_url_descarga(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
            return obj.archivo.url
        return None


class CompraSerializer(serializers.ModelSerializer):
    """Serializer completo para compra"""
    detalles = DetalleCompraSerializer(many=True, read_only=True)
    adjuntos_factura = CompraFacturaAdjuntoSerializer(many=True, read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    deposito_nombre = serializers.CharField(source='deposito.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Compra
        fields = [
            'id',
            'numero',
            'proveedor',
            'proveedor_nombre',
            'usuario',
            'usuario_nombre',
            'deposito',
            'deposito_nombre',
            'fecha',
            'fecha_compra',
            'total',
            'numero_factura',
            'observaciones',
            'estado',
            'estado_display',
            'detalles',
            'adjuntos_factura'
        ]
        read_only_fields = ['id', 'numero', 'fecha', 'usuario', 'estado']


class CompraListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Compra
        fields = [
            'id',
            'numero',
            'proveedor_nombre',
            'usuario_nombre',
            'fecha',
            'total',
            'estado_display',
            'cantidad_items',
            'numero_factura'
        ]
    
    def get_cantidad_items(self, obj):
        return obj.detalles.count()


class DetalleCompraCreateSerializer(serializers.Serializer):
    """Serializer para crear detalle de compra"""
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    costo_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    precio_venta_sugerido = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True
    )
    actualizar_costo = serializers.BooleanField(default=True)
    actualizar_precio = serializers.BooleanField(default=False)


class CompraCreateSerializer(serializers.Serializer):
    """Serializer para crear compra"""
    proveedor_id = serializers.IntegerField()
    deposito_id = serializers.IntegerField()
    fecha_compra = serializers.DateField(required=False, allow_null=True)
    numero_factura = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    items = DetalleCompraCreateSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La compra debe tener al menos un producto")
        return value
