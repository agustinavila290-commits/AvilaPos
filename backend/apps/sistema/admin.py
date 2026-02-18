from django.contrib import admin
from .models import BackupLog, AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'usuario', 'accion', 'descripcion_corta', 'ip_address']
    list_filter = ['accion', 'fecha', 'usuario']
    search_fields = ['descripcion', 'usuario__username', 'ip_address']
    readonly_fields = [
        'fecha', 'usuario', 'accion', 'descripcion',
        'content_type', 'object_id', 'datos_anteriores', 'datos_nuevos',
        'ip_address', 'user_agent'
    ]
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + '...' if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(BackupLog)
class BackupLogAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'estado', 'archivo', 'tamanio_mb', 'duracion', 'usuario']
    list_filter = ['estado', 'fecha']
    search_fields = ['archivo', 'error']
    readonly_fields = ['fecha', 'tamanio_mb']
    
    def tamanio_mb(self, obj):
        if obj.tamanio:
            return f"{round(obj.tamanio / (1024 * 1024), 2)} MB"
        return "-"
    tamanio_mb.short_description = 'Tamaño'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return True
