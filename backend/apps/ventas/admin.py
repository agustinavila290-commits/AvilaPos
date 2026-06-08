from django.contrib import admin
from django.utils.html import format_html
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


_ESTADO_VENTA_COLORS = {
    'COMPLETADA': ('#dcfce7', '#166534', 'Completada'),
    'ANULADA':    ('#fee2e2', '#991b1b', 'Anulada'),
}

_METODO_PAGO_COLORS = {
    'EFECTIVO':      ('#d1fae5', '#065f46', 'Efectivo'),
    'TRANSFERENCIA': ('#dbeafe', '#1e40af', 'Transferencia'),
    'TARJETA':       ('#ede9fe', '#5b21b6', 'Tarjeta'),
    'CUENTA_CORRIENTE': ('#fef9c3', '#854d0e', 'Cta. Corriente'),
}


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = [
        'numero',
        'cliente',
        'usuario',
        'fecha',
        'total',
        'badge_metodo_pago',
        'badge_estado',
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
    
    def badge_estado(self, obj):
        bg, color, label = _ESTADO_VENTA_COLORS.get(obj.estado, ('#f3f4f6', '#374151', obj.estado))
        return _badge(bg, color, label)
    badge_estado.short_description = 'Estado'
    badge_estado.admin_order_field = 'estado'

    def badge_metodo_pago(self, obj):
        bg, color, label = _METODO_PAGO_COLORS.get(obj.metodo_pago, ('#f3f4f6', '#374151', obj.metodo_pago))
        return _badge(bg, color, label)
    badge_metodo_pago.short_description = 'Método de pago'
    badge_metodo_pago.admin_order_field = 'metodo_pago'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
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
