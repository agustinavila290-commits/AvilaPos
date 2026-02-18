"""
Serializers para configuración del sistema.
"""
from rest_framework import serializers
from .models import Configuracion


class ConfiguracionSerializer(serializers.ModelSerializer):
    """Serializer para configuración"""
    valor_convertido = serializers.SerializerMethodField()
    tipo_dato_display = serializers.CharField(source='get_tipo_dato_display', read_only=True)
    
    class Meta:
        model = Configuracion
        fields = [
            'id',
            'clave',
            'valor',
            'valor_convertido',
            'tipo_dato',
            'tipo_dato_display',
            'descripcion',
            'categoria',
            'es_editable',
            'fecha_modificacion'
        ]
        read_only_fields = ['id', 'fecha_modificacion']
    
    def get_valor_convertido(self, obj):
        """Retorna el valor convertido según su tipo"""
        return obj.get_valor_convertido()
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Si es una actualización, verificar que sea editable
        if self.instance and not self.instance.es_editable:
            if 'valor' in data and data['valor'] != self.instance.valor:
                raise serializers.ValidationError(
                    'Este parámetro no es editable'
                )
        
        return data


class ConfiguracionUpdateSerializer(serializers.Serializer):
    """Serializer para actualizar solo el valor de una configuración"""
    valor = serializers.CharField()
    
    def validate_valor(self, value):
        """Valida que el valor sea compatible con el tipo de dato"""
        config = self.context.get('configuracion')
        if not config:
            return value
        
        # Validar según el tipo
        try:
            if config.tipo_dato == Configuracion.TipoDato.INTEGER:
                int(value)
            elif config.tipo_dato == Configuracion.TipoDato.DECIMAL:
                from decimal import Decimal
                Decimal(value)
            elif config.tipo_dato == Configuracion.TipoDato.BOOLEAN:
                if value.lower() not in ('true', 'false', '1', '0', 'yes', 'no', 'si'):
                    raise serializers.ValidationError(
                        'Para tipo BOOLEAN, usar: true/false, 1/0, yes/no, si/no'
                    )
        except (ValueError, TypeError):
            raise serializers.ValidationError(
                f'El valor no es válido para el tipo {config.get_tipo_dato_display()}'
            )
        
        return value


class ConfiguracionBulkUpdateSerializer(serializers.Serializer):
    """Serializer para actualizar múltiples configuraciones"""
    configuraciones = serializers.DictField(
        child=serializers.CharField(),
        help_text='Diccionario de clave: valor'
    )
