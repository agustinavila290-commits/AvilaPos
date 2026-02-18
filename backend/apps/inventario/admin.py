from django.contrib import admin
from .models import Deposito, Stock, MovimientoStock


@admin.register(Deposito)
class DepositoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'direccion', 'activo', 'es_principal', 'fecha_creacion']
    list_filter = ['activo', 'es_principal']
    search_fields = ['nombre', 'direccion']
    readonly_fields = ['fecha_creacion']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['variante', 'deposito', 'cantidad', 'es_critico', 'estado', 'fecha_actualizacion']
    list_filter = ['deposito', 'fecha_actualizacion']
    search_fields = ['variante__sku', 'variante__codigo_barras', 'variante__nombre_variante']
    readonly_fields = ['fecha_actualizacion']
    autocomplete_fields = ['variante', 'deposito']
    
    def es_critico(self, obj):
        return obj.es_critico
    es_critico.boolean = True
    es_critico.short_description = '¿Crítico?'


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
