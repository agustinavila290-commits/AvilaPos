from django.contrib import admin
from django.utils.html import format_html
from .models import Proveedor, Compra, DetalleCompra


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


_ESTADO_COMPRA_COLORS = {
    'COMPLETADA': ('#dcfce7', '#166534', 'Completada'),
    'PENDIENTE':  ('#fef9c3', '#854d0e', 'Pendiente'),
    'ANULADA':    ('#fee2e2', '#991b1b', 'Anulada'),
}


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'razon_social', 'cuit', 'telefono', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre', 'razon_social', 'cuit']
    readonly_fields = ['fecha_creacion']


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 0
    readonly_fields = [
        'variante',
        'cantidad',
        'costo_unitario',
        'subtotal',
        'precio_venta_sugerido',
        'actualizar_costo',
        'actualizar_precio'
    ]
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = [
        'numero',
        'proveedor',
        'usuario',
        'fecha',
        'total',
        'numero_factura',
        'badge_estado',
    ]
    list_filter = ['estado', 'proveedor', 'fecha']
    search_fields = [
        'numero',
        'numero_factura',
        'proveedor__nombre'
    ]
    readonly_fields = [
        'numero',
        'fecha',
        'total',
        'usuario'
    ]
    inlines = [DetalleCompraInline]
    date_hierarchy = 'fecha'
    
    def badge_estado(self, obj):
        bg, color, label = _ESTADO_COMPRA_COLORS.get(obj.estado, ('#f3f4f6', '#374151', obj.estado))
        return _badge(bg, color, label)
    badge_estado.short_description = 'Estado'
    badge_estado.admin_order_field = 'estado'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    list_display = [
        'compra',
        'variante',
        'cantidad',
        'costo_unitario',
        'subtotal',
        'actualizar_costo',
        'actualizar_precio'
    ]
    list_filter = ['compra__fecha', 'actualizar_costo', 'actualizar_precio']
    search_fields = [
        'compra__numero',
        'variante__sku',
        'variante__nombre_variante'
    ]
    readonly_fields = [
        'compra',
        'variante',
        'cantidad',
        'costo_unitario',
        'subtotal',
        'precio_venta_sugerido',
        'actualizar_costo',
        'actualizar_precio'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
