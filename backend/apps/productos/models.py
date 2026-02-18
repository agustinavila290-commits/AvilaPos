from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Marca(models.Model):
    """Marca de productos (ej: Honda, Yamaha, Zanella)"""
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    
    class Meta:
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    """Categoría de productos (ej: Motor, Frenos, Transmisión)"""
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    
    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class ProductoBase(models.Model):
    """
    Producto base que agrupa variantes.
    Ejemplo: "Pistón Honda CG 150" es el producto base
    """
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Marca'
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Categoría'
    )
    imagen = models.ImageField(
        upload_to='productos/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Producto Base'
        verbose_name_plural = 'Productos Base'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['marca', 'categoria']),
        ]
    
    def __str__(self):
        return f"{self.nombre} ({self.marca.nombre})"


class VarianteProducto(models.Model):
    """
    Variante de un producto base.
    Ejemplo: "Pistón Honda CG 150" tiene variantes: STD, 0.25, 0.50, 0.75, 1.00
    Cada variante tiene su propio SKU, precios y stock.
    """
    producto_base = models.ForeignKey(
        ProductoBase,
        on_delete=models.CASCADE,
        related_name='variantes',
        verbose_name='Producto Base'
    )
    nombre_variante = models.CharField(
        max_length=100,
        verbose_name='Nombre de Variante',
        help_text='Ej: STD, 0.25, 0.50, Rojo, Talle M'
    )
    codigo = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Código',
        db_index=True,
        help_text='Código único del producto (puede ser código de barras, SKU, etc.)'
    )
    
    # Precios
    costo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Costo (último costo)',
        help_text='Último costo de compra'
    )
    precio_mostrador = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Precio Mostrador'
    )
    precio_web = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Precio Web',
        help_text='Precio para tienda online'
    )
    precio_tarjeta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Precio Tarjeta',
        help_text='Precio de venta con tarjeta de crédito/débito',
        default=Decimal('0.00')
    )
    
    # Estado
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )
    
    class Meta:
        verbose_name = 'Variante de Producto'
        verbose_name_plural = 'Variantes de Producto'
        ordering = ['producto_base__nombre', 'nombre_variante']
        unique_together = [['producto_base', 'nombre_variante']]
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['producto_base', 'activo']),
        ]
    
    def __str__(self):
        return f"{self.producto_base.nombre} - {self.nombre_variante} (Código: {self.codigo})"
    
    @property
    def margen_porcentaje(self):
        """Calcula el margen porcentual del precio mostrador"""
        if self.precio_mostrador > 0:
            return ((self.precio_mostrador - self.costo) / self.precio_mostrador) * 100
        return 0
    
    @property
    def margen_monto(self):
        """Calcula el margen en monto del precio mostrador"""
        return self.precio_mostrador - self.costo
    
    @property
    def sku(self):
        """Alias de código para compatibilidad (SKU/código de barras)"""
        return self.codigo

    @property
    def nombre_completo(self):
        """Retorna el nombre completo incluyendo marca y variante"""
        return f"{self.producto_base.marca.nombre} {self.producto_base.nombre} - {self.nombre_variante}"

    def save(self, *args, **kwargs):
        """Precio tarjeta = costo + 84% (calculado en base de datos al guardar)."""
        if self.costo is not None and self.costo >= 0:
            self.precio_tarjeta = (self.costo * Decimal('1.84')).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)
