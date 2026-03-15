from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from apps.productos.models import VarianteProducto


class Deposito(models.Model):
    """
    Depósito de almacenamiento.
    Inicialmente 1 depósito, preparado para múltiples.
    """
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre'
    )
    direccion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Dirección'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    es_principal = models.BooleanField(
        default=False,
        verbose_name='Depósito Principal',
        help_text='Depósito por defecto para operaciones'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Depósito'
        verbose_name_plural = 'Depósitos'
        ordering = ['-es_principal', 'nombre']
    
    def __str__(self):
        return self.nombre
    
    def save(self, *args, **kwargs):
        # Si es el único depósito, hacerlo principal
        if not Deposito.objects.exists():
            self.es_principal = True
        super().save(*args, **kwargs)


class Stock(models.Model):
    """
    Stock de una variante en un depósito específico.
    Se actualiza SOLO a través de MovimientoStock.
    """
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.CASCADE,
        related_name='stocks',
        verbose_name='Variante'
    )
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='stocks',
        verbose_name='Depósito'
    )
    cantidad = models.IntegerField(
        default=0,
        verbose_name='Cantidad',
        help_text='Cantidad actual en stock (puede ser negativa)'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )
    
    class Meta:
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'
        unique_together = [['variante', 'deposito']]
        ordering = ['variante__producto_base__nombre', 'variante__nombre_variante']
        indexes = [
            models.Index(fields=['variante', 'deposito']),
            models.Index(fields=['cantidad']),
        ]
    
    def __str__(self):
        return f"{self.variante.nombre_completo} - {self.deposito.nombre}: {self.cantidad}"
    
    @property
    def es_critico(self):
        """Retorna True si el stock es crítico (≤ umbral configurado)."""
        from apps.configuracion.models import ConfiguracionManager
        umbral = ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2)
        try:
            umbral = int(umbral)
        except (TypeError, ValueError):
            umbral = 2
        return self.cantidad <= umbral

    @property
    def estado(self):
        """Retorna el estado del stock: SIN_STOCK, CRITICO, BAJO, NORMAL."""
        from apps.configuracion.models import ConfiguracionManager
        umbral_critico = ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2)
        umbral_bajo = ConfiguracionManager.obtener('UMBRAL_STOCK_BAJO', 5)
        try:
            umbral_critico = int(umbral_critico)
        except (TypeError, ValueError):
            umbral_critico = 2
        try:
            umbral_bajo = int(umbral_bajo)
        except (TypeError, ValueError):
            umbral_bajo = 5
        if self.cantidad <= 0:
            return 'SIN_STOCK'
        elif self.cantidad <= umbral_critico:
            return 'CRITICO'
        elif self.cantidad <= umbral_bajo:
            return 'BAJO'
        return 'NORMAL'


class MovimientoStock(models.Model):
    """
    Registro de todos los movimientos de stock.
    Auditoría completa de entradas y salidas.
    """
    
    class TipoMovimiento(models.TextChoices):
        COMPRA = 'COMPRA', 'Compra'
        VENTA = 'VENTA', 'Venta'
        VENTA_WEB = 'VENTA_WEB', 'Venta tienda web'
        DEVOLUCION = 'DEVOLUCION', 'Devolución'
        ANULACION = 'ANULACION', 'Anulación'
        AJUSTE = 'AJUSTE', 'Ajuste Manual'
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'
        INVENTARIO_INICIAL = 'INVENTARIO_INICIAL', 'Inventario Inicial'
        SALIDA_TICKET_CC = 'SALIDA_TICKET_CC', 'Salida ticket cuenta corriente'
        DEVOLUCION_TICKET_CC = 'DEVOLUCION_TICKET_CC', 'Devolución ticket cuenta corriente'
    
    variante = models.ForeignKey(
        VarianteProducto,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Variante'
    )
    deposito = models.ForeignKey(
        Deposito,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Depósito'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TipoMovimiento.choices,
        verbose_name='Tipo de Movimiento'
    )
    cantidad = models.IntegerField(
        verbose_name='Cantidad',
        help_text='Positivo para entradas, negativo para salidas'
    )
    
    # Auditoría
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_stock',
        verbose_name='Usuario'
    )
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha'
    )
    
    # Referencias a otros documentos
    referencia_tipo = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tipo de Referencia',
        help_text='Ej: venta, compra, ajuste'
    )
    referencia_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID de Referencia',
        help_text='ID del documento relacionado'
    )
    
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    
    # Stock antes y después del movimiento (para auditoría)
    stock_anterior = models.IntegerField(
        verbose_name='Stock Anterior'
    )
    stock_posterior = models.IntegerField(
        verbose_name='Stock Posterior'
    )
    
    class Meta:
        verbose_name = 'Movimiento de Stock'
        verbose_name_plural = 'Movimientos de Stock'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['variante', 'deposito', '-fecha']),
            models.Index(fields=['tipo', '-fecha']),
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['referencia_tipo', 'referencia_id']),
        ]
    
    def __str__(self):
        signo = '+' if self.cantidad >= 0 else ''
        return f"{self.tipo} - {self.variante.sku}: {signo}{self.cantidad} ({self.fecha.strftime('%Y-%m-%d %H:%M')})"
