from django.db import models


class Cliente(models.Model):
    """
    Modelo para gestionar clientes.
    Cliente es obligatorio en cada venta.
    """
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
