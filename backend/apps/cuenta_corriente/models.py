"""
Modelos para tickets de cuenta corriente.
Un cliente puede tener varios tickets abiertos (por trabajo/moto).
Cada ticket permite agregar o devolver productos hasta el cierre.
"""
from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from decimal import Decimal

from apps.clientes.models import Cliente
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito
from apps.ventas.models import Venta


class TicketCuentaCorriente(models.Model):
    """
    Ticket de cuenta corriente. Un cliente puede tener varios.
    Diferenciados por descripción (ej. "Moto 110", "Reparación Juan").
    """
    class Estado(models.TextChoices):
        A_SALDAR = 'A_SALDAR', 'A saldar'
        ABONADO = 'ABONADO', 'Abonado'

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        related_name='tickets_cuenta_corriente',
        verbose_name='Cliente'
    )
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='tickets_cuenta_corriente',
        verbose_name='Depósito'
    )
    usuario_apertura = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tickets_abiertos',
        verbose_name='Usuario que abre'
    )

    numero = models.IntegerField(
        unique=True,
        verbose_name='Número de ticket',
        help_text='Número autoincremental'
    )
    descripcion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Descripción',
        help_text='Ej: Moto 110, Reparación Juan'
    )

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.A_SALDAR,
        verbose_name='Estado'
    )

    fecha_apertura = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de apertura'
    )
    fecha_cierre = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de cierre'
    )

    venta = models.ForeignKey(
        Venta,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_cuenta_corriente',
        verbose_name='Venta generada',
        help_text='Venta creada al abonar'
    )
    usuario_cierre = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='tickets_cerrados',
        verbose_name='Usuario que cierra'
    )

    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        verbose_name='Subtotal'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        verbose_name='Total'
    )

    class Meta:
        verbose_name = 'Ticket cuenta corriente'
        verbose_name_plural = 'Tickets cuenta corriente'
        ordering = ['-fecha_apertura']
        indexes = [
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['numero']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"Ticket #{self.numero} - {self.cliente.nombre} - {self.get_estado_display()}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            ultimo = TicketCuentaCorriente.objects.order_by('-numero').first()
            self.numero = (ultimo.numero + 1) if ultimo else 1
        super().save(*args, **kwargs)

    def recalcular_totales(self):
        """Recalcula subtotal y total desde los detalles (consulta DB para evitar cache obsoleto)."""
        from django.db.models import Sum
        agg = DetalleTicketCC.objects.filter(ticket=self).aggregate(s=Sum('subtotal'))
        total = agg['s'] or Decimal('0')
        self.subtotal = total
        self.total = total
        self.save(update_fields=['subtotal', 'total'])


class DetalleTicketCC(models.Model):
    """Línea de producto en un ticket de cuenta corriente."""
    ticket = models.ForeignKey(
        TicketCuentaCorriente,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Ticket'
    )
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        related_name='detalles_ticket_cc',
        verbose_name='Producto'
    )

    cantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )

    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Precio unitario'
    )
    descuento_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Descuento unitario'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Subtotal'
    )
    costo_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Costo unitario'
    )

    class Meta:
        verbose_name = 'Detalle ticket cuenta corriente'
        verbose_name_plural = 'Detalles ticket cuenta corriente'
        ordering = ['id']
        unique_together = [['ticket', 'variante']]

    def __str__(self):
        return f"{self.variante.sku} x{self.cantidad} - ${self.subtotal}"

    @property
    def precio_final_unitario(self):
        return self.precio_unitario - self.descuento_unitario
