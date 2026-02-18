from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Cliente"""
    
    total_compras = serializers.SerializerMethodField()
    ultima_compra = serializers.SerializerMethodField()
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'dni', 'nombre', 'telefono', 'email', 'direccion',
            'activo', 'fecha_creacion', 'total_compras', 'ultima_compra'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'total_compras', 'ultima_compra']
    
    def get_total_compras(self, obj):
        """Calcula el total histórico de compras del cliente"""
        # TODO: Implementar cuando tengamos el módulo de ventas
        return 0
    
    def get_ultima_compra(self, obj):
        """Obtiene la fecha de la última compra"""
        # TODO: Implementar cuando tengamos el módulo de ventas
        return None


class ClienteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear clientes con validación"""
    
    class Meta:
        model = Cliente
        fields = ['dni', 'nombre', 'telefono', 'email', 'direccion']
    
    def validate_dni(self, value):
        """Validar que el DNI no esté duplicado"""
        if Cliente.objects.filter(dni=value).exists():
            raise serializers.ValidationError(
                'Ya existe un cliente con este DNI.'
            )
        return value
    
    def validate_telefono(self, value):
        """Validar formato de teléfono"""
        if not value:
            raise serializers.ValidationError('El teléfono es obligatorio.')
        # Aquí puedes agregar validaciones más específicas del formato
        return value


class ClienteUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar clientes"""
    
    class Meta:
        model = Cliente
        fields = ['nombre', 'telefono', 'email', 'direccion', 'activo']
    
    def validate_telefono(self, value):
        """Validar formato de teléfono"""
        if not value:
            raise serializers.ValidationError('El teléfono es obligatorio.')
        return value


class ClienteQuickCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para alta rápida de cliente.
    Solo campos esenciales: DNI, nombre, teléfono
    """
    
    class Meta:
        model = Cliente
        fields = ['dni', 'nombre', 'telefono']
    
    def validate_dni(self, value):
        """Validar que el DNI no esté duplicado"""
        if Cliente.objects.filter(dni=value).exists():
            raise serializers.ValidationError(
                'Ya existe un cliente con este DNI.'
            )
        return value
