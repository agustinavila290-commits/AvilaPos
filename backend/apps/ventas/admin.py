from django.contrib import admin
from .models import Venta, DetalleVenta


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 0
    readonly_fields = [
        'variante',
        'cantidad',
        'precio_unitario',
        'descuento_unitario',
        'subtotal',
        'costo_unitario'
    ]
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = [
        'numero',
        'cliente',
        'usuario',
        'fecha',
        'total',
        'metodo_pago',
        'estado'
    ]
    list_filter = ['estado', 'metodo_pago', 'fecha']
    search_fields = [
        'numero',
        'cliente__nombre',
        'cliente__apellido',
        'cliente__dni'
    ]
    readonly_fields = [
        'numero',
        'fecha',
        'subtotal',
        'total',
        'usuario',
        'fecha_anulacion',
        'usuario_anulacion'
    ]
    inlines = [DetalleVentaInline]
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información de la Venta', {
            'fields': ('numero', 'fecha', 'estado')
        }),
        ('Cliente y Usuario', {
            'fields': ('cliente', 'usuario', 'deposito')
        }),
        ('Montos', {
            'fields': (
                'subtotal',
                'descuento_porcentaje',
                'descuento_monto',
                'total',
                'metodo_pago'
            )
        }),
        ('Anulación', {
            'fields': (
                'motivo_anulacion',
                'usuario_anulacion',
                'fecha_anulacion'
            ),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Las ventas se crean desde la API
        return False
    
    def has_delete_permission(self, request, obj=None):
        # No se pueden eliminar ventas
        return False


@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = [
        'venta',
        'variante',
        'cantidad',
        'precio_unitario',
        'subtotal'
    ]
    list_filter = ['venta__fecha']
    search_fields = [
        'venta__numero',
        'variante__sku',
        'variante__nombre_variante'
    ]
    readonly_fields = [
        'venta',
        'variante',
        'cantidad',
        'precio_unitario',
        'descuento_unitario',
        'subtotal',
        'costo_unitario'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
