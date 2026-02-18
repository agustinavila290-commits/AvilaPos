from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()


class AuditLog(models.Model):
    """
    Registro de auditoría de acciones del sistema
    Registra: quién, qué, cuándo, dónde (IP)
    """
    
    class AccionChoices(models.TextChoices):
        CREAR = 'CREAR', 'Crear'
        MODIFICAR = 'MODIFICAR', 'Modificar'
        ELIMINAR = 'ELIMINAR', 'Eliminar'
        LOGIN = 'LOGIN', 'Inicio de Sesión'
        LOGOUT = 'LOGOUT', 'Cierre de Sesión'
        VENTA = 'VENTA', 'Venta'
        COMPRA = 'COMPRA', 'Compra'
        AJUSTE_STOCK = 'AJUSTE_STOCK', 'Ajuste de Stock'
        ANULACION = 'ANULACION', 'Anulación'
        DEVOLUCION = 'DEVOLUCION', 'Devolución'
        BACKUP = 'BACKUP', 'Backup'
        RESTAURACION = 'RESTAURACION', 'Restauración'
    
    # Usuario que realizó la acción
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Usuario'
    )
    
    # Tipo de acción
    accion = models.CharField(
        max_length=20,
        choices=AccionChoices.choices,
        verbose_name='Acción'
    )
    
    # Modelo afectado (GenericForeignKey para cualquier modelo)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    objeto = GenericForeignKey('content_type', 'object_id')
    
    # Descripción de la acción
    descripcion = models.TextField(verbose_name='Descripción')
    
    # Datos antes y después (JSON)
    datos_anteriores = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos Anteriores'
    )
    datos_nuevos = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos Nuevos'
    )
    
    # Información de la sesión
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    
    # Timestamp
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora'
    )
    
    class Meta:
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['accion', '-fecha']),
        ]
    
    def __str__(self):
        usuario_str = self.usuario.username if self.usuario else 'Sistema'
        return f"{self.fecha.strftime('%Y-%m-%d %H:%M:%S')} - {usuario_str} - {self.accion}"


class BackupLog(models.Model):
    """Registro de backups realizados"""
    
    class EstadoChoices(models.TextChoices):
        EXITOSO = 'EXITOSO', 'Exitoso'
        FALLIDO = 'FALLIDO', 'Fallido'
        EN_PROGRESO = 'EN_PROGRESO', 'En Progreso'
    
    fecha = models.DateTimeField(auto_now_add=True, verbose_name='Fecha')
    estado = models.CharField(
        max_length=20,
        choices=EstadoChoices.choices,
        default=EstadoChoices.EN_PROGRESO,
        verbose_name='Estado'
    )
    archivo = models.CharField(max_length=255, verbose_name='Archivo', blank=True)
    tamanio = models.BigIntegerField(verbose_name='Tamaño (bytes)', null=True, blank=True)
    duracion = models.FloatField(verbose_name='Duración (segundos)', null=True, blank=True)
    error = models.TextField(verbose_name='Error', blank=True)
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Usuario',
        help_text='Usuario que ejecutó el backup (null si es automático)'
    )
    
    class Meta:
        verbose_name = 'Log de Backup'
        verbose_name_plural = 'Logs de Backups'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"Backup {self.fecha.strftime('%Y-%m-%d %H:%M')} - {self.estado}"
