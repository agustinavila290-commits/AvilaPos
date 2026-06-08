from django.contrib import admin
from django.utils.html import format_html
from .models import Configuracion


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


@admin.register(Configuracion)
class ConfiguracionAdmin(admin.ModelAdmin):
    list_display = [
        'clave',
        'valor',
        'descripcion_corta',
        'badge_categoria',
        'badge_tipo',
        'es_editable',
        'fecha_modificacion',
    ]
    list_filter = ['categoria', 'tipo_dato', 'es_editable']
    search_fields = ['clave', 'descripcion']
    readonly_fields = ['fecha_modificacion', 'descripcion_panel']

    _CATEGORIA_COLORS = {
        'INVENTARIO': ('#dbeafe', '#1e40af'),
        'VENTAS':     ('#dcfce7', '#166534'),
        'FACTURACION':('#ede9fe', '#5b21b6'),
        'SISTEMA':    ('#f3f4f6', '#374151'),
        'IMPRESION':  ('#fef9c3', '#854d0e'),
    }

    _TIPO_COLORS = {
        'INTEGER': ('#dbeafe', '#1e40af', 'Entero'),
        'DECIMAL': ('#ede9fe', '#5b21b6', 'Decimal'),
        'BOOLEAN': ('#fef9c3', '#854d0e', 'Booleano'),
        'STRING':  ('#f3f4f6', '#374151', 'Texto'),
    }

    def descripcion_corta(self, obj):
        if obj.descripcion and len(obj.descripcion) > 60:
            return obj.descripcion[:60] + '…'
        return obj.descripcion or '-'
    descripcion_corta.short_description = 'Descripción'

    def badge_categoria(self, obj):
        bg, color = self._CATEGORIA_COLORS.get(obj.categoria, ('#f3f4f6', '#374151'))
        return _badge(bg, color, obj.categoria)
    badge_categoria.short_description = 'Categoría'
    badge_categoria.admin_order_field = 'categoria'

    def badge_tipo(self, obj):
        bg, color, label = self._TIPO_COLORS.get(obj.tipo_dato, ('#f3f4f6', '#374151', obj.tipo_dato))
        return _badge(bg, color, label)
    badge_tipo.short_description = 'Tipo'
    badge_tipo.admin_order_field = 'tipo_dato'

    def descripcion_panel(self, obj):
        """Muestra la descripción completa destacada sobre el campo valor."""
        if not obj.descripcion:
            return '-'
        return format_html(
            '<div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:10px 14px;'
            'border-radius:0 6px 6px 0;color:#1e3a8a;font-size:13px;line-height:1.5">'
            '<strong>¿Para qué sirve este parámetro?</strong><br>{}</div>',
            obj.descripcion
        )
    descripcion_panel.short_description = 'Información'

    fieldsets = (
        ('Información del parámetro', {
            'fields': ('descripcion_panel', 'clave', 'categoria'),
        }),
        ('Valor actual', {
            'fields': ('valor', 'tipo_dato'),
        }),
        ('Control', {
            'fields': ('descripcion', 'es_editable'),
            'classes': ('collapse',),
            'description': 'La descripción se muestra en la sección de arriba.',
        }),
        ('Auditoría', {
            'fields': ('fecha_modificacion',),
            'classes': ('collapse',),
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        base = list(self.readonly_fields)
        if obj:
            base.append('clave')
        return base
