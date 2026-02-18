"""
Configuración del admin para devoluciones.
"""
from django.contrib import admin
from .models import DevolucionVenta, DetalleDevolucion, NotaCredito


class DetalleDevolucionInline(admin.TabularInline):
    model = DetalleDevolucion
    extra = 0
    readonly_fields = ['detalle_venta', 'variante', 'cantidad', 'precio_unitario', 'subtotal']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(DevolucionVenta)
class DevolucionVentaAdmin(admin.ModelAdmin):
    list_display = [
        'numero',
        'venta',
        'fecha',
        'motivo',
        'total',
        'estado',
        'genera_nota_credito'
    ]
    list_filter = ['estado', 'motivo', 'genera_nota_credito', 'fecha']
    search_fields = ['numero', 'venta__numero', 'venta__cliente__nombre', 'observaciones']
    readonly_fields = [
        'numero',
        'venta',
        'usuario',
        'fecha',
        'total',
        'estado'
    ]
    inlines = [DetalleDevolucionInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'venta', 'usuario', 'fecha')
        }),
        ('Detalles de la Devolución', {
            'fields': ('motivo', 'observaciones', 'deposito')
        }),
        ('Montos y Estado', {
            'fields': ('total', 'estado', 'genera_nota_credito')
        }),
    )
    
    def has_add_permission(self, request):
        # Las devoluciones solo se crean por API
        return False
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar devoluciones
        return False


@admin.register(DetalleDevolucion)
class DetalleDevolucionAdmin(admin.ModelAdmin):
    list_display = [
        'devolucion',
        'variante',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'estado_producto'
    ]
    list_filter = ['devolucion__estado']
    search_fields = ['variante__producto_base__nombre', 'variante__codigo']
    readonly_fields = [
        'devolucion',
        'detalle_venta',
        'variante',
        'cantidad',
        'precio_unitario',
        'subtotal'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(NotaCredito)
class NotaCreditoAdmin(admin.ModelAdmin):
    list_display = [
        'numero',
        'cliente',
        'monto',
        'monto_utilizado',
        'get_saldo',
        'fecha_emision',
        'fecha_vencimiento',
        'estado'
    ]
    list_filter = ['estado', 'fecha_emision']
    search_fields = ['numero', 'cliente__nombre', 'devolucion__numero']
    readonly_fields = [
        'numero',
        'devolucion',
        'cliente',
        'monto',
        'monto_utilizado',
        'get_saldo',
        'fecha_emision'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero', 'devolucion', 'cliente', 'fecha_emision')
        }),
        ('Montos', {
            'fields': ('monto', 'monto_utilizado', 'get_saldo')
        }),
        ('Estado', {
            'fields': ('estado', 'fecha_vencimiento', 'observaciones')
        }),
    )
    
    def get_saldo(self, obj):
        return f"${obj.saldo_disponible}"
    get_saldo.short_description = 'Saldo Disponible'
    
    def has_add_permission(self, request):
        # Las notas se generan automáticamente
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
