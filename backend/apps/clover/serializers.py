"""
Serializers para el módulo Clover.
"""
from rest_framework import serializers
from decimal import Decimal
from .models import CloverConfig, CloverPago


class ProcesarPagoCloverSerializer(serializers.Serializer):
    """Validación del body para procesar pago con Clover."""
    monto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        help_text='Monto total a cobrar'
    )
    descripcion = serializers.CharField(
        max_length=200,
        required=False,
        default='Venta',
        allow_blank=True
    )
    orden_id = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        allow_null=True
    )
