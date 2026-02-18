from django.apps import AppConfig


class VentasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ventas'
    verbose_name = 'Ventas'
    
    def ready(self):
        import apps.ventas.signals  # Importar signals cuando la app esté lista
