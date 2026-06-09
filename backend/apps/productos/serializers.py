from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Marca, Categoria, ProductoBase, VarianteProducto, ProductoImagen


class ProductoImagenSerializer(serializers.ModelSerializer):
    """Serializer para imágenes de producto."""
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductoImagen
        fields = ['id', 'url', 'orden', 'es_principal', 'fecha_creacion']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.imagen:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None


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
    producto_nombre = serializers.CharField(source='producto_base.nombre', read_only=True)
    marca_nombre = serializers.CharField(source='producto_base.marca.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='producto_base.categoria.nombre', read_only=True)
    stock_actual = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = VarianteProducto
        fields = [
            'id', 'producto_base', 'nombre_variante', 'codigo',
            'producto_nombre', 'marca_nombre', 'categoria_nombre',
            'costo', 'precio_mostrador', 'precio_web', 'precio_tarjeta',
            'margen_porcentaje', 'margen_monto', 'nombre_completo',
            'stock_actual', 'stock_minimo', 'punto_reorden',
            'imagen_url', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def get_stock_actual(self, obj):
        try:
            from apps.inventario.models import Stock
            stocks = Stock.objects.filter(variante=obj, deposito__activo=True)
            return sum(stock.cantidad for stock in stocks)
        except Exception:
            return 0

    def get_imagen_url(self, obj):
        pb = obj.producto_base
        if not pb:
            return None
        img = pb.imagenes.filter(es_principal=True).first() or pb.imagenes.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.imagen.url) if request else img.imagen.url
        if pb.imagen:
            request = self.context.get('request')
            return request.build_absolute_uri(pb.imagen.url) if request else pb.imagen.url
        return None


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
            'stock_inicial', 'stock_minimo', 'punto_reorden',
            'proveedor_habitual', 'activo'
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
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    imagen_principal_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductoBase
        fields = [
            'id', 'nombre', 'descripcion', 'marca', 'marca_nombre',
            'categoria', 'categoria_nombre', 'imagen', 'activo',
            'variantes', 'cantidad_variantes', 'imagenes', 'imagen_principal_url',
            'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']

    def get_cantidad_variantes(self, obj):
        return obj.variantes.count()

    def get_imagen_principal_url(self, obj):
        img = obj.imagenes.filter(es_principal=True).first() or obj.imagenes.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.imagen.url) if request else img.imagen.url
        if obj.imagen:
            return obj.imagen.url
        return None


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
    imagen_url = serializers.SerializerMethodField()
    proveedor_habitual_nombre = serializers.SerializerMethodField()

    def get_proveedor_habitual_nombre(self, obj):
        try:
            return obj.proveedor_habitual.nombre if obj.proveedor_habitual else None
        except Exception:
            return None

    class Meta:
        model = VarianteProducto
        fields = [
            'id', 'producto_base', 'codigo', 'nombre_variante', 'nombre_completo',
            'producto_nombre', 'marca_nombre', 'categoria_nombre',
            'costo', 'precio_mostrador', 'precio_web', 'precio_tarjeta',
            'margen_porcentaje', 'stock_actual', 'stock_minimo', 'punto_reorden',
            'imagen_url', 'proveedor_habitual', 'proveedor_habitual_nombre', 'activo'
        ]

    def get_stock_actual(self, obj):
        if hasattr(obj, 'stock_actual_anno'):
            return obj.stock_actual_anno
        try:
            from apps.inventario.models import Stock
            stocks = Stock.objects.filter(variante=obj, deposito__activo=True)
            return sum(stock.cantidad for stock in stocks)
        except Exception:
            return 0

    def get_imagen_url(self, obj):
        pb = obj.producto_base
        if not pb:
            return None
        img = pb.imagenes.filter(es_principal=True).first() or pb.imagenes.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.imagen.url) if request else img.imagen.url
        if pb.imagen:
            return pb.imagen.url
        return None
