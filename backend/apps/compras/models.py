from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from apps.productos.models import VarianteProducto
from apps.inventario.models import Deposito


class Proveedor(models.Model):
    """
    Proveedor de productos.
    """
    nombre = models.CharField(
        max_length=200,
        unique=True,
        verbose_name='Nombre del Proveedor'
    )
    razon_social = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Razón Social'
    )
    cuit = models.CharField(
        max_length=13,
        blank=True,
        null=True,
        verbose_name='CUIT'
    )
    
    # Contacto
    telefono = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email'
    )
    direccion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Dirección'
    )
    
    # Notas
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    
    # Estado
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Compra(models.Model):
    """
    Compra realizada a un proveedor.
    """
    
    class EstadoCompra(models.TextChoices):
        COMPLETADA = 'COMPLETADA', 'Completada'
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        CANCELADA = 'CANCELADA', 'Cancelada'
    
    # Numeración automática
    numero = models.IntegerField(
        unique=True,
        verbose_name='Número de Compra',
        help_text='Número autoincremental de compra'
    )
    
    # Relaciones
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='compras',
        verbose_name='Proveedor'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='compras_realizadas',
        verbose_name='Usuario',
        help_text='Usuario que registró la compra'
    )
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='compras',
        verbose_name='Depósito',
        help_text='Depósito donde ingresa la mercadería'
    )
    
    # Fecha
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Registro'
    )
    fecha_compra = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Compra',
        help_text='Fecha real de la compra (opcional)'
    )
    
    # Montos
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Total',
        help_text='Total de la compra'
    )
    
    # Documentación
    numero_factura = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de Factura',
        help_text='Número de factura del proveedor'
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoCompra.choices,
        default=EstadoCompra.COMPLETADA,
        verbose_name='Estado'
    )
    
    class Meta:
        verbose_name = 'Compra'
        verbose_name_plural = 'Compras'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['numero']),
            models.Index(fields=['proveedor', '-fecha']),
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"Compra #{self.numero} - {self.proveedor.nombre} - ${self.total}"
    
    def save(self, *args, **kwargs):
        # Asignar número automático si es nueva compra
        if not self.pk and not self.numero:
            ultima_compra = Compra.objects.order_by('-numero').first()
            self.numero = (ultima_compra.numero + 1) if ultima_compra else 1
        
        super().save(*args, **kwargs)


class DetalleCompra(models.Model):
    """
    Detalle de productos comprados.
    """
    compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Compra'
    )
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        related_name='compras',
        verbose_name='Producto'
    )
    
    # Cantidad
    cantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )
    
    # Precios al momento de la compra
    costo_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Costo Unitario',
        help_text='Costo de compra por unidad'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Subtotal',
        help_text='Costo Unitario * Cantidad'
    )
    
    # Precio de venta sugerido (opcional)
    precio_venta_sugerido = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Precio de Venta Sugerido',
        help_text='Precio de venta sugerido para esta compra'
    )
    
    # Actualización de costos
    actualizar_costo = models.BooleanField(
        default=True,
        verbose_name='Actualizar Costo del Producto',
        help_text='Si se debe actualizar el costo del producto con este valor'
    )
    actualizar_precio = models.BooleanField(
        default=False,
        verbose_name='Actualizar Precio de Venta',
        help_text='Si se debe actualizar el precio de venta del producto'
    )
    
    class Meta:
        verbose_name = 'Detalle de Compra'
        verbose_name_plural = 'Detalles de Compra'
        ordering = ['id']
    
    def __str__(self):
        return f"{self.variante.sku} x{self.cantidad} - ${self.subtotal}"


class CompraFacturaAdjunto(models.Model):
    """
    Imagen de factura adjunta a una compra (foto/escaneo).
    Se almacenan comprimidas para ahorrar espacio.
    """
    compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        related_name='adjuntos_factura',
        verbose_name='Compra'
    )
    archivo = models.ImageField(
        upload_to='compras_facturas/%Y/%m/',
        verbose_name='Archivo',
        help_text='Imagen de la factura (JPEG/PNG, se comprime al subir)'
    )
    orden = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de subida')

    class Meta:
        verbose_name = 'Adjunto de factura'
        verbose_name_plural = 'Adjuntos de facturas'
        ordering = ['compra', 'orden', 'id']

    def __str__(self):
        return f"Factura compra #{self.compra.numero} ({self.orden})"
