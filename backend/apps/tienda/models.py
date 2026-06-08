from django.db import models


class ModeloMoto(models.Model):
    """Modelo de moto para el buscador de compatibilidad de la tienda web."""
    marca = models.CharField(max_length=80, verbose_name='Marca')
    modelo = models.CharField(max_length=80, verbose_name='Modelo')
    anio = models.IntegerField(verbose_name='Año')
    activo = models.BooleanField(default=True)
    productos = models.ManyToManyField(
        'productos.ProductoBase',
        blank=True,
        related_name='modelos_compatibles',
        verbose_name='Productos compatibles',
    )

    class Meta:
        verbose_name = 'Modelo de moto'
        verbose_name_plural = 'Modelos de moto'
        ordering = ['marca', 'modelo', 'anio']
        unique_together = [['marca', 'modelo', 'anio']]

    def __str__(self) -> str:
        return f"{self.marca} {self.modelo} {self.anio}"


class PuntoRetiro(models.Model):
    """Punto de retiro para pedidos web (click & collect)."""

    nombre = models.CharField(max_length=120)
    direccion_texto = models.CharField(max_length=255, blank=True, null=True)
    lat = models.FloatField(blank=True, null=True)
    lng = models.FloatField(blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    horarios = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Punto de retiro"
        verbose_name_plural = "Puntos de retiro"
        ordering = ["-activo", "nombre"]

    def __str__(self) -> str:
        return self.nombre


class ClienteWeb(models.Model):
    """
    Usuario registrado de la tienda web.
    Separado del modelo Cliente del POS (que requiere DNI y es para uso interno).
    """
    nombre = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255, blank=True)
    google_id = models.CharField(max_length=120, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Cliente web"
        verbose_name_plural = "Clientes web"
        ordering = ["-fecha_registro"]

    def __str__(self) -> str:
        return f"{self.nombre} <{self.email}>"


class PedidoWeb(models.Model):
    """
    Vincula una Venta con el ClienteWeb que la originó.
    Evita modificar el modelo Venta del POS.
    """
    venta = models.OneToOneField(
        'ventas.Venta',
        on_delete=models.CASCADE,
        related_name='pedido_web',
    )
    cliente_web = models.ForeignKey(
        ClienteWeb,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos',
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pedido web"
        verbose_name_plural = "Pedidos web"
        ordering = ["-fecha"]

    def __str__(self) -> str:
        cliente = self.cliente_web.email if self.cliente_web else "anónimo"
        return f"Pedido web #{self.venta_id} — {cliente}"
