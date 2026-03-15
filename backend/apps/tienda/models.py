from django.db import models


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

  def __str__(self) -> str:  # pragma: no cover - representación simple
    return self.nombre

