from django.contrib import admin
from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('dni', 'nombre', 'telefono', 'email', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('dni', 'nombre', 'telefono', 'email')
    ordering = ('-fecha_creacion',)
