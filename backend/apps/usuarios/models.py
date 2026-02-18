from django.contrib.auth.models import AbstractUser
from django.db import models


class Permiso(models.Model):
    """
    Permisos personalizados del sistema
    """
    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(verbose_name='Descripción', blank=True)
    modulo = models.CharField(max_length=50, verbose_name='Módulo')
    
    class Meta:
        verbose_name = 'Permiso Personalizado'
        verbose_name_plural = 'Permisos Personalizados'
        ordering = ['modulo', 'nombre']
    
    def __str__(self):
        return f"{self.modulo} - {self.nombre}"


class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser.
    Incluye roles para diferenciar entre Cajero y Administrador.
    """
    
    class Rol(models.TextChoices):
        CAJERO = 'CAJERO', 'Cajero'
        ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'
        VENDEDOR = 'VENDEDOR', 'Vendedor'
        DEPOSITO = 'DEPOSITO', 'Depósito'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    
    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.CAJERO,
        verbose_name='Rol'
    )
    
    # Permisos personalizados
    permisos_custom = models.ManyToManyField(
        Permiso,
        blank=True,
        related_name='usuarios',
        verbose_name='Permisos Personalizados'
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_rol_display()})"
    
    @property
    def es_administrador(self):
        """Retorna True si el usuario es administrador"""
        return self.rol == self.Rol.ADMINISTRADOR
    
    @property
    def es_cajero(self):
        """Retorna True si el usuario es cajero"""
        return self.rol == self.Rol.CAJERO
    
    def tiene_permiso(self, codigo_permiso):
        """
        Verifica si el usuario tiene un permiso específico
        
        Args:
            codigo_permiso: Código del permiso a verificar
        
        Returns:
            bool: True si tiene el permiso, False en caso contrario
        """
        # Los admins siempre tienen todos los permisos
        if self.rol == self.Rol.ADMINISTRADOR or self.is_superuser:
            return True
        
        # Verificar en permisos personalizados
        return self.permisos_custom.filter(codigo=codigo_permiso).exists()
    
    def obtener_permisos(self):
        """
        Retorna lista de códigos de permisos del usuario
        
        Returns:
            list: Lista de códigos de permisos
        """
        if self.rol == self.Rol.ADMINISTRADOR or self.is_superuser:
            return ['*']  # Todos los permisos
        
        return list(self.permisos_custom.values_list('codigo', flat=True))
