from django.contrib import admin
from .models import Configuracion


@admin.register(Configuracion)
class ConfiguracionAdmin(admin.ModelAdmin):
    list_display = [
        'clave',
        'valor',
        'tipo_dato',
        'categoria',
        'es_editable',
        'fecha_modificacion'
    ]
    list_filter = ['categoria', 'tipo_dato', 'es_editable']
    search_fields = ['clave', 'descripcion']
    readonly_fields = ['fecha_modificacion']
    
    fieldsets = (
        ('Identificación', {
            'fields': ('clave', 'categoria')
        }),
        ('Valor', {
            'fields': ('valor', 'tipo_dato')
        }),
        ('Información', {
            'fields': ('descripcion', 'es_editable')
        }),
        ('Auditoría', {
            'fields': ('fecha_modificacion',),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Hace clave readonly al editar"""
        if obj:  # Editando
            return self.readonly_fields + ('clave',)
        return self.readonly_fields
