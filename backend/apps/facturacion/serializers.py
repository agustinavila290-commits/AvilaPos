from rest_framework import serializers
from .models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP


class PuntoVentaSerializer(serializers.ModelSerializer):
    """Serializer para Punto de Venta"""
    
    class Meta:
        model = PuntoVenta
        fields = '__all__'


class ItemFacturaSerializer(serializers.ModelSerializer):
    """Serializer para ítem de factura"""
    
    class Meta:
        model = ItemFactura
        fields = [
            'id', 'orden', 'codigo', 'descripcion',
            'cantidad', 'precio_unitario', 'alicuota_iva',
            'subtotal', 'iva_105', 'iva_21', 'iva_27', 'total'
        ]
        read_only_fields = ['subtotal', 'iva_105', 'iva_21', 'iva_27', 'total']


class FacturaSerializer(serializers.ModelSerializer):
    """Serializer para factura"""
    items = ItemFacturaSerializer(many=True, read_only=True)
    numero_completo = serializers.CharField(read_only=True)
    punto_venta_numero = serializers.IntegerField(source='punto_venta.numero', read_only=True)
    punto_venta_nombre = serializers.CharField(source='punto_venta.nombre', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = Factura
        fields = '__all__'
        read_only_fields = [
            'numero', 'fecha_emision', 'fecha_creacion', 'fecha_modificacion',
            'cae', 'cae_vencimiento', 'fecha_proceso_afip', 'resultado_afip',
            'observaciones_afip', 'qr_data', 'numero_completo'
        ]


class FacturaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear factura con ítems"""
    items = ItemFacturaSerializer(many=True)
    
    class Meta:
        model = Factura
        fields = [
            'tipo_comprobante', 'punto_venta', 'cliente',
            'cliente_razon_social', 'cliente_cuit', 'cliente_condicion_iva',
            'cliente_domicilio', 'venta', 'fecha_vencimiento',
            'otros_tributos', 'observaciones', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Obtener el siguiente número para este tipo de comprobante
        punto_venta = validated_data['punto_venta']
        tipo_comprobante = validated_data['tipo_comprobante']
        
        # Determinar el campo de numeración según el tipo
        campo_numero = self._get_campo_numero(tipo_comprobante)
        siguiente_numero = getattr(punto_venta, campo_numero) + 1
        
        # Crear factura
        factura = Factura.objects.create(
            numero=siguiente_numero,
            usuario=self.context['request'].user,
            subtotal=0,
            total=0,
            **validated_data
        )
        
        # Crear ítems
        for item_data in items_data:
            ItemFactura.objects.create(factura=factura, **item_data)
        
        # Calcular totales
        factura.calcular_totales()
        factura.save()
        
        # Actualizar numeración del punto de venta
        setattr(punto_venta, campo_numero, siguiente_numero)
        punto_venta.save()
        
        return factura
    
    def _get_campo_numero(self, tipo_comprobante):
        """Retorna el campo de numeración según el tipo de comprobante"""
        mapping = {
            'FA': 'ultimo_numero_factura_a',
            'FB': 'ultimo_numero_factura_b',
            'FC': 'ultimo_numero_factura_c',
            'NCA': 'ultimo_numero_nota_credito_a',
            'NCB': 'ultimo_numero_nota_credito_b',
            'NCC': 'ultimo_numero_nota_credito_c',
            'PRE': 'ultimo_numero_presupuesto',
        }
        return mapping.get(tipo_comprobante, 'ultimo_numero_factura_b')


class ConfiguracionAFIPSerializer(serializers.ModelSerializer):
    """Serializer para configuración AFIP"""
    
    class Meta:
        model = ConfiguracionAFIP
        fields = '__all__'
        extra_kwargs = {
            'clave_privada': {'write_only': True},
            'token': {'read_only': True},
            'sign': {'read_only': True},
            'token_expiracion': {'read_only': True},
        }
