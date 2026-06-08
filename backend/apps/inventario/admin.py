from django.contrib import admin
from django.utils.html import format_html
from .models import Deposito, Stock, MovimientoStock


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


_ESTADO_STOCK_COLORS = {
    'NORMAL':    ('#dcfce7', '#166534', 'Normal'),
    'BAJO':      ('#fef9c3', '#854d0e', 'Bajo'),
    'CRITICO':   ('#fee2e2', '#991b1b', 'Crítico'),
    'SIN_STOCK': ('#f3f4f6', '#374151', 'Sin stock'),
}


@admin.register(Deposito)
class DepositoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'direccion', 'activo', 'es_principal', 'fecha_creacion']
    list_filter = ['activo', 'es_principal']
    search_fields = ['nombre', 'direccion']
    readonly_fields = ['fecha_creacion']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['variante', 'deposito', 'cantidad', 'badge_estado', 'fecha_actualizacion']
    list_filter = ['deposito', 'fecha_actualizacion']
    search_fields = ['variante__sku', 'variante__codigo_barras', 'variante__nombre_variante']
    readonly_fields = ['fecha_actualizacion']
    autocomplete_fields = ['variante', 'deposito']

    def badge_estado(self, obj):
        bg, color, label = _ESTADO_STOCK_COLORS.get(obj.estado, ('#f3f4f6', '#374151', obj.estado))
        return _badge(bg, color, label)
    badge_estado.short_description = 'Estado'


@admin.register(MovimientoStock)
class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = [
        'fecha',
        'tipo',
        'variante',
        'deposito',
        'cantidad',
        'stock_anterior',
        'stock_posterior',
        'usuario'
    ]
    list_filter = ['tipo', 'deposito', 'fecha']
    search_fields = [
        'variante__sku',
        'variante__codigo_barras',
        'observaciones'
    ]
    readonly_fields = [
        'fecha',
        'stock_anterior',
        'stock_posterior'
    ]
    autocomplete_fields = ['variante', 'deposito', 'usuario']
    date_hierarchy = 'fecha'
    
    def has_add_permission(self, request):
        # No permitir agregar movimientos manualmente desde el admin
        return False
    
    def has_change_permission(self, request, obj=None):
        # No permitir editar movimientos
        return False
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar movimientos
        return False
