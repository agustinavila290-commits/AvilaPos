"""
Modelos para integración con Clover POSnet.
Configuración del dispositivo y registro de pagos procesados.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class CloverConfig(models.Model):
    """
    Configuración de integración con Clover (un comercio = una config activa).
    Los tokens se guardan en texto; en producción conviene encriptarlos.
    """
    class TipoIntegracion(models.TextChoices):
        REST = 'REST', 'REST Pay Display (red local)'
        CLOUD = 'CLOUD', 'Cloud Pay Display (nube)'

    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Ej: POS Principal, Caja 2'
    )
    merchant_id = models.CharField(
        max_length=100,
        verbose_name='Merchant ID',
        help_text='ID del comercio en Clover'
    )
    access_token = models.TextField(
        verbose_name='Access Token',
        help_text='Token OAuth de Clover (en producción usar encriptación)'
    )
    tipo_integracion = models.CharField(
        max_length=10,
        choices=TipoIntegracion.choices,
        default=TipoIntegracion.REST,
        verbose_name='Tipo de integración'
    )
    endpoint_url = models.CharField(
        max_length=500,
        verbose_name='URL del endpoint',
        help_text='REST: http://IP_DISPOSITIVO:8080 | Cloud: https://api.clover.com'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración Clover'
        verbose_name_plural = 'Configuraciones Clover'
        ordering = ['-activo', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_integracion_display()})"


class CloverPago(models.Model):
    """
    Registro de cada pago procesado con Clover.
    Se vincula a la venta una vez creada (opcional).
    """
    class EstadoPago(models.TextChoices):
        APPROVED = 'APPROVED', 'Aprobado'
        DECLINED = 'DECLINED', 'Rechazado'
        CANCELLED = 'CANCELLED', 'Cancelado'
        ERROR = 'ERROR', 'Error'

    venta = models.ForeignKey(
        'ventas.Venta',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pagos_clover',
        verbose_name='Venta'
    )
    clover_payment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        verbose_name='ID pago Clover'
    )
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoPago.choices,
        verbose_name='Estado'
    )
    metodo_tarjeta = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Tipo tarjeta',
        help_text='CREDIT, DEBIT, etc.'
    )
    ultimos_4_digitos = models.CharField(
        max_length=4,
        blank=True,
        verbose_name='Últimos 4 dígitos'
    )
    datos_respuesta = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Respuesta Clover'
    )
    error_mensaje = models.TextField(
        blank=True,
        verbose_name='Mensaje de error'
    )
    fecha_procesamiento = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pago Clover'
        verbose_name_plural = 'Pagos Clover'
        ordering = ['-fecha_procesamiento']
        indexes = [
            models.Index(fields=['clover_payment_id']),
            models.Index(fields=['estado']),
            models.Index(fields=['-fecha_procesamiento']),
        ]

    def __str__(self):
        return f"Clover {self.clover_payment_id or 'N/A'} - ${self.monto} - {self.estado}"
