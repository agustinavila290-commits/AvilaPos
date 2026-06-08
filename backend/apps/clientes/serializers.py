from rest_framework import serializers
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Cliente"""

    total_compras          = serializers.SerializerMethodField()
    ultima_compra          = serializers.SerializerMethodField()
    saldo_cuenta_corriente = serializers.SerializerMethodField()
    tipo_cliente_display   = serializers.CharField(source='get_tipo_cliente_display', read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id', 'dni', 'nombre', 'telefono', 'email', 'direccion',
            'activo', 'fecha_creacion', 'total_compras', 'ultima_compra',
            # Fase 6
            'tipo_cliente', 'tipo_cliente_display', 'whatsapp',
            'limite_credito', 'descuento_habitual', 'notas',
            'saldo_cuenta_corriente',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'total_compras', 'ultima_compra',
                            'tipo_cliente_display', 'saldo_cuenta_corriente']

    def get_total_compras(self, obj):
        from django.db.models import Sum
        agg = obj.ventas.filter(estado='COMPLETADA').aggregate(t=Sum('total'))
        return float(agg['t'] or 0)

    def get_ultima_compra(self, obj):
        ult = obj.ventas.filter(estado='COMPLETADA').order_by('-fecha').first()
        return ult.fecha.isoformat() if ult else None

    def get_saldo_cuenta_corriente(self, obj):
        """Suma de saldos pendientes en todos los tickets A_SALDAR."""
        from django.db.models import Sum
        from apps.cuenta_corriente.models import PagoTicketCC, TicketCuentaCorriente
        tickets = TicketCuentaCorriente.objects.filter(cliente=obj, estado='A_SALDAR')
        total_deuda = tickets.aggregate(t=Sum('total'))['t'] or 0
        pagado = PagoTicketCC.objects.filter(ticket__in=tickets).aggregate(p=Sum('monto'))['p'] or 0
        return float(max(0, total_deuda - pagado))


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
        fields = [
            'nombre', 'telefono', 'email', 'direccion', 'activo',
            'tipo_cliente', 'whatsapp', 'limite_credito', 'descuento_habitual', 'notas',
        ]
    
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
