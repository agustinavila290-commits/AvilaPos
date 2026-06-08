from django.db import models
from decimal import Decimal


class Cliente(models.Model):
    """
    Modelo para gestionar clientes.
    Cliente es obligatorio en cada venta.
    """

    class TipoCliente(models.TextChoices):
        MINORISTA  = 'MINORISTA',  'Minorista'
        MAYORISTA  = 'MAYORISTA',  'Mayorista'
        MECANICO   = 'MECANICO',   'Mecánico / Taller'
        REVENDEDOR = 'REVENDEDOR', 'Revendedor'

    dni = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='DNI',
        db_index=True
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre completo'
    )
    telefono = models.CharField(
        max_length=50,
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
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Campos extendidos — Fase 6
    tipo_cliente = models.CharField(
        max_length=12,
        choices=TipoCliente.choices,
        default=TipoCliente.MINORISTA,
        verbose_name='Tipo de cliente'
    )
    whatsapp = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name='WhatsApp',
        help_text='Número sin espacios ni guiones. Ej: 3834625390'
    )
    limite_credito = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0'),
        verbose_name='Límite de crédito',
        help_text='Monto máximo en cuenta corriente. 0 = sin límite'
    )
    descuento_habitual = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'),
        verbose_name='Descuento habitual %',
        help_text='Descuento sugerido en el POS para este cliente'
    )
    notas = models.TextField(
        blank=True, default='',
        verbose_name='Notas internas'
    )

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombre} (DNI: {self.dni})"

    @property
    def nombre_completo(self):
        """Nombre completo del cliente (alias de nombre para compatibilidad)"""
        return self.nombre
