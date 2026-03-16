from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Marca, Categoria, ProductoBase, VarianteProducto


class MarcaSerializer(serializers.ModelSerializer):
    """Serializer para Marca"""
    
    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'descripcion', 'activo']


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para Categoría"""
    
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'activo']


class VarianteProductoSerializer(serializers.ModelSerializer):
    """Serializer completo para Variante de Producto"""
    margen_porcentaje = serializers.ReadOnlyField()
    margen_monto = serializers.ReadOnlyField()
    nombre_completo = serializers.ReadOnlyField()
    
    # Stock se agregará en el Módulo 4
    stock_actual = serializers.SerializerMethodField()
    
    class Meta:
        model = VarianteProducto
        fields = [
            'id', 'producto_base', 'nombre_variante', 'codigo',
            'costo', 'precio_mostrador', 'precio_web', 'precio_tarjeta',
            'margen_porcentaje', 'margen_monto', 'nombre_completo',
            'stock_actual', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_stock_actual(self, obj):
        """Obtiene el stock actual de la variante"""
        try:
            from apps.inventario.models import Stock
            # Sumar el stock de todos los depósitos
            stocks = Stock.objects.filter(variante=obj, deposito__activo=True)
            total = sum(stock.cantidad for stock in stocks)
            return total
        except Exception as e:
            return 0


class VarianteProductoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar variantes"""
    precio_tarjeta = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    stock_inicial = serializers.IntegerField(required=False, default=0, min_value=0)
    
    class Meta:
        model = VarianteProducto
        fields = [
            'id', 'nombre_variante', 'codigo',
            'costo', 'precio_mostrador', 'precio_web', 'precio_tarjeta',
            'stock_inicial', 'activo'
        ]
    
    def validate_codigo(self, value):
        """Validar que el código sea único"""
        instance = self.instance
        if instance:
            # Si estamos actualizando, excluir la instancia actual
            if VarianteProducto.objects.filter(codigo=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError('Ya existe una variante con este código.')
        else:
            # Si estamos creando, verificar que no exista
            if VarianteProducto.objects.filter(codigo=value).exists():
                raise serializers.ValidationError('Ya existe una variante con este código.')
        return value


class ProductoBaseSerializer(serializers.ModelSerializer):
    """Serializer completo para Producto Base con variantes"""
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    variantes = VarianteProductoSerializer(many=True, read_only=True)
    cantidad_variantes = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductoBase
        fields = [
            'id', 'nombre', 'descripcion', 'marca', 'marca_nombre',
            'categoria', 'categoria_nombre', 'imagen', 'activo',
            'variantes', 'cantidad_variantes', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']
    
    def get_cantidad_variantes(self, obj):
        """Retorna la cantidad de variantes del producto"""
        return obj.variantes.count()


class ProductoBaseCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Producto Base"""
    
    class Meta:
        model = ProductoBase
        fields = ['nombre', 'descripcion', 'marca', 'categoria', 'imagen', 'activo']


class ProductoConVariantesSerializer(serializers.ModelSerializer):
    """
    Serializer para crear un producto con sus variantes en una sola petición.
    Usado en el formulario de crear producto.
    """
    variantes = VarianteProductoCreateSerializer(many=True)
    
    class Meta:
        model = ProductoBase
        fields = ['nombre', 'descripcion', 'marca', 'categoria', 'imagen', 'variantes']
    
    def create(self, validated_data):
        variantes_data = validated_data.pop('variantes')
        # Asegurar activo por defecto si no viene
        if 'activo' not in validated_data:
            validated_data['activo'] = True
        from apps.inventario.models import Deposito, MovimientoStock
        from apps.inventario.services import InventarioService

        request = self.context.get('request')
        usuario = getattr(request, 'user', None) if request else None
        deposito_principal = Deposito.objects.filter(es_principal=True, activo=True).first()

        with transaction.atomic():
            producto = ProductoBase.objects.create(**validated_data)
            for variante_data in variantes_data:
                vd = dict(variante_data)
                vd.pop('id', None)  # no enviar id al crear
                stock_inicial = int(vd.pop('stock_inicial', 0) or 0)
                if vd.get('precio_tarjeta') is None:
                    vd['precio_tarjeta'] = Decimal('0.00')
                variante = VarianteProducto.objects.create(producto_base=producto, **vd)

                # Stock inicial opcional en depósito principal
                if stock_inicial > 0 and deposito_principal and usuario:
                    InventarioService.registrar_movimiento(
                        variante=variante,
                        deposito=deposito_principal,
                        tipo_movimiento=MovimientoStock.TipoMovimiento.INVENTARIO_INICIAL,
                        cantidad=stock_inicial,
                        usuario=usuario,
                        observaciones='Stock inicial al crear producto'
                    )
        return producto


class ImportacionExcelSerializer(serializers.Serializer):
    """
    Serializer para importación masiva desde Excel.
    No usa modelo directamente, valida los datos del Excel.
    """
    codigo = serializers.CharField(max_length=100, required=True)
    nombre_producto = serializers.CharField(max_length=200, required=True)
    nombre_variante = serializers.CharField(max_length=100, required=True)
    marca = serializers.CharField(max_length=100, required=True)
    categoria = serializers.CharField(max_length=100, required=True)
    costo = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    precio_mostrador = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    precio_web = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    stock_inicial = serializers.IntegerField(required=False, default=0, min_value=0)
    
    def validate_codigo(self, value):
        """Validar que el código no esté duplicado en la base de datos"""
        if VarianteProducto.objects.filter(codigo=value).exists():
            raise serializers.ValidationError(f'Código {value} ya existe en la base de datos.')
        return value


class VarianteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de variantes"""
    producto_nombre = serializers.CharField(source='producto_base.nombre', read_only=True)
    marca_nombre = serializers.CharField(source='producto_base.marca.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='producto_base.categoria.nombre', read_only=True)
    nombre_completo = serializers.ReadOnlyField()
    margen_porcentaje = serializers.ReadOnlyField()
    stock_actual = serializers.SerializerMethodField()
    
    class Meta:
        model = VarianteProducto
        fields = [
            'id', 'codigo', 'nombre_variante', 'nombre_completo',
            'producto_nombre', 'marca_nombre', 'categoria_nombre',
            'costo', 'precio_mostrador', 'precio_web', 'precio_tarjeta',
            'margen_porcentaje', 'stock_actual', 'activo'
        ]
    
    def get_stock_actual(self, obj):
        """Obtiene el stock actual (usa anotación si existe para evitar N+1 en listado)"""
        if hasattr(obj, 'stock_actual_anno'):
            return obj.stock_actual_anno
        try:
            from apps.inventario.models import Stock
            stocks = Stock.objects.filter(variante=obj, deposito__activo=True)
            return sum(stock.cantidad for stock in stocks)
        except Exception:
            return 0
