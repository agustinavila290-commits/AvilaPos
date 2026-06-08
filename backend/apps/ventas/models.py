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
    tarjeta_cupon_numero = models.TextField(
        blank=True,
        default='',
        verbose_name='Número de cupón tarjeta',
        help_text='Número(s) de cupón/comprobante del posnet para pagos con tarjeta'
    )
    tarjeta_codigo_autorizacion = models.TextField(
        blank=True,
        default='',
        verbose_name='Código de autorización tarjeta',
        help_text='Código(s) de autorización informados por el posnet para pagos con tarjeta'
    )

    # Datos de transferencia bancaria
    class EstadoTransferencia(models.TextChoices):
        PENDIENTE   = 'PENDIENTE',  'Pendiente de confirmación'
        CONFIRMADA  = 'CONFIRMADA', 'Confirmada'
        RECHAZADA   = 'RECHAZADA',  'Rechazada'

    transferencia_banco = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name='Banco / Billetera'
    )
    transferencia_cuenta_destino = models.CharField(
        max_length=200, blank=True, default='',
        verbose_name='Cuenta Destino / CBU / CVU'
    )
    transferencia_numero_operacion = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name='N° de Operación'
    )
    transferencia_observacion = models.TextField(
        blank=True, default='',
        verbose_name='Observación'
    )
    transferencia_estado = models.CharField(
        max_length=12,
        choices=EstadoTransferencia.choices,
        blank=True, default='',
        verbose_name='Estado Transferencia',
        help_text='Solo aplica cuando metodo_pago=TRANSFERENCIA'
    )
    transferencia_confirmada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='transferencias_confirmadas',
        verbose_name='Confirmada por'
    )
    transferencia_fecha_confirmacion = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Fecha de Confirmación'
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


# ─── Presupuestos ──────────────────────────────────────────────────────────────

class Presupuesto(models.Model):
    """Presupuesto / cotización. No descuenta stock hasta convertirse en Venta."""

    class Estado(models.TextChoices):
        BORRADOR   = 'BORRADOR',   'Borrador'
        ENVIADO    = 'ENVIADO',    'Enviado'
        ACEPTADO   = 'ACEPTADO',   'Aceptado'
        RECHAZADO  = 'RECHAZADO',  'Rechazado'
        VENCIDO    = 'VENCIDO',    'Vencido'
        CONVERTIDO = 'CONVERTIDO', 'Convertido a venta'

    numero = models.IntegerField(unique=True, verbose_name='Número')
    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT,
        null=True, blank=True, related_name='presupuestos',
        verbose_name='Cliente'
    )
    cliente_nombre_manual = models.CharField(
        max_length=200, blank=True, default='',
        verbose_name='Nombre cliente (manual)',
        help_text='Usado cuando no hay cliente registrado'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='presupuestos', verbose_name='Usuario'
    )
    deposito = models.ForeignKey(
        Deposito, on_delete=models.PROTECT,
        null=True, blank=True, related_name='presupuestos',
        verbose_name='Depósito'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name='Válido hasta')
    observaciones = models.TextField(blank=True, default='', verbose_name='Observaciones')
    estado = models.CharField(
        max_length=12, choices=Estado.choices,
        default=Estado.BORRADOR, verbose_name='Estado'
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuento_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    descuento_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    venta = models.ForeignKey(
        Venta, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='presupuesto_origen',
        verbose_name='Venta generada'
    )

    class Meta:
        verbose_name = 'Presupuesto'
        verbose_name_plural = 'Presupuestos'
        ordering = ['-fecha_creacion']

    def __str__(self):
        cliente_str = self.cliente.nombre_completo if self.cliente else (self.cliente_nombre_manual or 'Sin cliente')
        return f"Presupuesto #{self.numero} - {cliente_str}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            last = Presupuesto.objects.order_by('-numero').first()
            self.numero = (last.numero + 1) if last else 1
        super().save(*args, **kwargs)

    @property
    def nombre_cliente(self):
        if self.cliente:
            return self.cliente.nombre_completo
        return self.cliente_nombre_manual or 'Sin cliente'

    @property
    def esta_vencido(self):
        from django.utils import timezone
        if self.fecha_vencimiento and self.estado not in ('CONVERTIDO', 'RECHAZADO'):
            return self.fecha_vencimiento < timezone.now().date()
        return False


class ItemPresupuesto(models.Model):
    presupuesto = models.ForeignKey(
        Presupuesto, on_delete=models.CASCADE, related_name='items'
    )
    variante = models.ForeignKey(
        VarianteProducto, on_delete=models.PROTECT, related_name='presupuestos'
    )
    cantidad = models.IntegerField(validators=[MinValueValidator(1)])
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.variante.codigo} x{self.cantidad}"
