from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from apps.clientes.models import Cliente
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito


class Venta(models.Model):
    """
    Venta realizada.
    Cliente es OBLIGATORIO.
    """
    
    class MetodoPago(models.TextChoices):
        EFECTIVO = 'EFECTIVO', 'Efectivo'
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'
        TARJETA = 'TARJETA', 'Tarjeta'
    
    class EstadoVenta(models.TextChoices):
        COMPLETADA = 'COMPLETADA', 'Completada'
        ANULADA = 'ANULADA', 'Anulada'
    
    # Numeración automática
    numero = models.IntegerField(
        unique=True,
        verbose_name='Número de Venta',
        help_text='Número autoincremental de venta'
    )
    
    # Relaciones
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        related_name='ventas',
        verbose_name='Cliente',
        help_text='Cliente (opcional si la configuración CLIENTE_OBLIGATORIO está desactivada)',
        null=True,
        blank=True
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ventas_realizadas',
        verbose_name='Usuario (Cajero)',
        help_text='Usuario que realizó la venta'
    )
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='ventas',
        verbose_name='Depósito',
        help_text='Depósito desde donde se realizó la venta'
    )
    
    # Fecha
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora'
    )
    
    # Montos
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Subtotal',
        help_text='Suma de subtotales de detalles'
    )
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Descuento %',
        help_text='Porcentaje de descuento aplicado'
    )
    descuento_monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Descuento $',
        help_text='Monto de descuento en pesos'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Total',
        help_text='Total final a pagar'
    )
    
    # Método de pago
    metodo_pago = models.CharField(
        max_length=20,
        choices=MetodoPago.choices,
        verbose_name='Método de Pago'
    )
    tarjeta_cupon_numero = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Número de cupón tarjeta',
        help_text='Número de cupón/comprobante del posnet para pagos con tarjeta'
    )
    tarjeta_codigo_autorizacion = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Código de autorización tarjeta',
        help_text='Código de autorización informado por el posnet para pagos con tarjeta'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoVenta.choices,
        default=EstadoVenta.COMPLETADA,
        verbose_name='Estado'
    )
    
    # Anulación
    motivo_anulacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Anulación',
        help_text='Requerido si la venta está anulada'
    )
    usuario_anulacion = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ventas_anuladas',
        blank=True,
        null=True,
        verbose_name='Usuario que Anuló',
        help_text='Solo admin puede anular'
    )
    fecha_anulacion = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de Anulación'
    )
    
    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['numero']),
            models.Index(fields=['cliente', '-fecha']),
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        cliente_str = self.cliente.nombre_completo if self.cliente else 'Consumidor final'
        return f"Venta #{self.numero} - {cliente_str} - ${self.total}"
    
    @property
    def margen_porcentaje(self):
        """Calcula el margen de ganancia en porcentaje"""
        if self.subtotal == 0:
            return 0
        
        costo_total = sum(
            detalle.costo_unitario * detalle.cantidad
            for detalle in self.detalles.all()
        )
        
        if costo_total == 0:
            return 100
        
        ganancia = self.total - costo_total
        return (ganancia / costo_total) * 100
    
    @property
    def margen_es_bajo(self):
        """Retorna True si el margen es menor al 5%"""
        return self.margen_porcentaje < 5
    
    def save(self, *args, **kwargs):
        # Asignar número automático si es nueva venta
        if not self.pk and not self.numero:
            ultima_venta = Venta.objects.order_by('-numero').first()
            self.numero = (ultima_venta.numero + 1) if ultima_venta else 1
        
        super().save(*args, **kwargs)


class DetalleVenta(models.Model):
    """
    Detalle de productos vendidos.
    """
    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Venta'
    )
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        related_name='ventas',
        verbose_name='Producto'
    )
    
    # Cantidad
    cantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    
    # Precios al momento de la venta
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Precio Unitario',
        help_text='Precio de venta al momento de la transacción'
    )
    descuento_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Descuento Unitario',
        help_text='Descuento aplicado por unidad'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Subtotal',
        help_text='(Precio - Descuento) * Cantidad'
    )
    
    # Costo para calcular margen
    costo_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Costo Unitario',
        help_text='Costo del producto al momento de la venta (para margen)'
    )
    
    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'
        ordering = ['id']
    
    def __str__(self):
        return f"{self.variante.sku} x{self.cantidad} - ${self.subtotal}"
    
    @property
    def precio_final_unitario(self):
        """Precio final por unidad después del descuento"""
        return self.precio_unitario - self.descuento_unitario
    
    @property
    def margen_unitario(self):
        """Margen de ganancia por unidad"""
        return self.precio_final_unitario - self.costo_unitario
    
    @property
    def margen_porcentaje(self):
        """Margen de ganancia en porcentaje"""
        if self.costo_unitario == 0:
            return 100
        return (self.margen_unitario / self.costo_unitario) * 100
