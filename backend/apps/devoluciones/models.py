"""
Modelos para gestión de devoluciones.
Permite devoluciones parciales y totales con notas de crédito.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from decimal import Decimal

from apps.ventas.models import Venta, DetalleVenta
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito


class DevolucionVenta(models.Model):
    """
    Modelo para registrar devoluciones de ventas.
    Puede ser parcial (algunos productos) o total.
    """
    
    class MotivoDevolucion(models.TextChoices):
        DEFECTO_PRODUCTO = 'DEFECTO', 'Defecto en el producto'
        PRODUCTO_INCORRECTO = 'INCORRECTO', 'Producto incorrecto'
        CLIENTE_ARREPENTIDO = 'ARREPENTIMIENTO', 'Arrepentimiento del cliente'
        ERROR_VENTA = 'ERROR', 'Error en la venta'
        GARANTIA = 'GARANTIA', 'Garantía'
        OTRO = 'OTRO', 'Otro motivo'
    
    class EstadoDevolucion(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        PROCESADA = 'PROCESADA', 'Procesada'
        CANCELADA = 'CANCELADA', 'Cancelada'
    
    # Numeración automática
    numero = models.IntegerField(
        unique=True,
        verbose_name='Número de Devolución',
        help_text='Número autoincremental de devolución'
    )
    
    # Relación con venta original
    venta = models.ForeignKey(
        Venta,
        on_delete=models.PROTECT,
        related_name='devoluciones',
        verbose_name='Venta Original'
    )
    
    # Usuario que procesa la devolución
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='devoluciones_procesadas',
        verbose_name='Usuario',
        help_text='Usuario que procesó la devolución'
    )
    
    # Información de la devolución
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Devolución'
    )
    
    motivo = models.CharField(
        max_length=20,
        choices=MotivoDevolucion.choices,
        verbose_name='Motivo',
        help_text='Motivo de la devolución'
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Detalles adicionales sobre la devolución'
    )
    
    # Depósito donde reingresan los productos
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='devoluciones',
        verbose_name='Depósito',
        help_text='Depósito donde reingresan los productos'
    )
    
    # Totales
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Total',
        help_text='Total de la devolución'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoDevolucion.choices,
        default=EstadoDevolucion.PENDIENTE,
        verbose_name='Estado'
    )
    
    # Nota de crédito
    genera_nota_credito = models.BooleanField(
        default=True,
        verbose_name='Genera Nota de Crédito',
        help_text='Si debe generar una nota de crédito para el cliente'
    )
    
    class Meta:
        verbose_name = 'Devolución de Venta'
        verbose_name_plural = 'Devoluciones de Ventas'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['numero']),
            models.Index(fields=['venta']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"Devolución #{self.numero} - Venta #{self.venta.numero}"
    
    def save(self, *args, **kwargs):
        """Asigna número automático si es nueva"""
        if not self.numero:
            ultimo = DevolucionVenta.objects.aggregate(
                max_numero=models.Max('numero')
            )['max_numero']
            self.numero = (ultimo or 0) + 1
        super().save(*args, **kwargs)


class DetalleDevolucion(models.Model):
    """
    Detalle de productos devueltos en una devolución.
    """
    
    devolucion = models.ForeignKey(
        DevolucionVenta,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Devolución'
    )
    
    # Detalle original de la venta
    detalle_venta = models.ForeignKey(
        DetalleVenta,
        on_delete=models.PROTECT,
        related_name='devoluciones',
        verbose_name='Detalle de Venta',
        help_text='Detalle original de la venta'
    )
    
    # Producto devuelto
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        related_name='devoluciones',
        verbose_name='Producto'
    )
    
    # Cantidad devuelta
    cantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad',
        help_text='Cantidad de unidades devueltas'
    )
    
    # Precio al que se vendió (para calcular el reembolso)
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Precio Unitario',
        help_text='Precio al que se vendió originalmente'
    )
    
    # Subtotal de la devolución
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Subtotal',
        help_text='Cantidad * Precio Unitario'
    )
    
    # Estado del producto devuelto
    estado_producto = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Estado del Producto',
        help_text='Condición en la que se devuelve (ej: nuevo, usado, dañado)'
    )
    
    class Meta:
        verbose_name = 'Detalle de Devolución'
        verbose_name_plural = 'Detalles de Devoluciones'
        unique_together = ['devolucion', 'detalle_venta']
    
    def __str__(self):
        return f"{self.variante} - {self.cantidad} unidades"


class NotaCredito(models.Model):
    """
    Notas de crédito generadas por devoluciones.
    """
    
    class EstadoNota(models.TextChoices):
        ACTIVA = 'ACTIVA', 'Activa'
        UTILIZADA = 'UTILIZADA', 'Utilizada'
        VENCIDA = 'VENCIDA', 'Vencida'
        CANCELADA = 'CANCELADA', 'Cancelada'
    
    numero = models.IntegerField(
        unique=True,
        verbose_name='Número de Nota de Crédito'
    )
    
    devolucion = models.OneToOneField(
        DevolucionVenta,
        on_delete=models.PROTECT,
        related_name='nota_credito',
        verbose_name='Devolución'
    )
    
    cliente = models.ForeignKey(
        'clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='notas_credito',
        verbose_name='Cliente'
    )
    
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto'
    )
    
    monto_utilizado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Monto Utilizado'
    )
    
    fecha_emision = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Emisión'
    )
    
    fecha_vencimiento = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Opcional. Si no se especifica, no vence.'
    )
    
    estado = models.CharField(
        max_length=20,
        choices=EstadoNota.choices,
        default=EstadoNota.ACTIVA,
        verbose_name='Estado'
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    
    class Meta:
        verbose_name = 'Nota de Crédito'
        verbose_name_plural = 'Notas de Crédito'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['cliente']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"NC #{self.numero} - {self.cliente.nombre} - ${self.monto}"
    
    @property
    def saldo_disponible(self):
        """Calcula el saldo disponible de la nota de crédito"""
        return self.monto - self.monto_utilizado
    
    def save(self, *args, **kwargs):
        """Asigna número automático si es nueva"""
        if not self.numero:
            ultimo = NotaCredito.objects.aggregate(
                max_numero=models.Max('numero')
            )['max_numero']
            self.numero = (ultimo or 0) + 1
        super().save(*args, **kwargs)
