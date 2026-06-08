from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import Usuario


_ROL_COLORS = {
    'ADMINISTRADOR': ('#fee2e2', '#991b1b', 'Administrador'),
    'SUPERVISOR':    ('#fef3c7', '#92400e', 'Supervisor'),
    'CAJERO':        ('#dbeafe', '#1e40af', 'Cajero'),
    'VENDEDOR':      ('#dcfce7', '#166534', 'Vendedor'),
    'DEPOSITO':      ('#f3f4f6', '#374151', 'Depósito'),
}


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ('username', 'nombre_completo', 'email', 'badge_rol', 'is_active', 'date_joined')
    list_filter = ('rol', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    def nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre or '-'
    nombre_completo.short_description = 'Nombre'

    def badge_rol(self, obj):
        bg, color, label = _ROL_COLORS.get(obj.rol, ('#f3f4f6', '#374151', obj.rol))
        return _badge(bg, color, label)
    badge_rol.short_description = 'Rol'
    badge_rol.admin_order_field = 'rol'

    # Formulario de edición: primero datos del negocio, después permisos técnicos
    fieldsets = (
        ('Datos personales', {
            'fields': ('username', 'password', 'first_name', 'last_name', 'email'),
        }),
        ('Rol en el sistema', {
            'fields': ('rol',),
            'description': (
                'ADMINISTRADOR: acceso total. '
                'CAJERO: solo ventas y consultas. '
                'VENDEDOR: ventas y clientes. '
                'SUPERVISOR: todo excepto configuración. '
                'DEPÓSITO: inventario y stock.'
            ),
        }),
        ('Estado', {
            'fields': ('is_active',),
        }),
        ('Permisos avanzados (Django)', {
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
            'description': 'Solo necesario para superusuarios técnicos. El rol es suficiente para los usuarios del negocio.',
        }),
        ('Fechas', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        ('Credenciales', {
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Datos personales', {
            'fields': ('first_name', 'last_name', 'email'),
        }),
        ('Rol en el sistema', {
            'fields': ('rol',),
            'description': (
                'ADMINISTRADOR: acceso total. '
                'CAJERO: solo ventas y consultas. '
                'VENDEDOR: ventas y clientes.'
            ),
        }),
    )
