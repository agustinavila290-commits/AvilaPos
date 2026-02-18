from django.contrib import admin
from .models import Proveedor, Compra, DetalleCompra


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
        'estado'
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
    
    def has_add_permission(self, request):
        # Las compras se registran desde la API
        return False
    
    def has_delete_permission(self, request, obj=None):
        # No se pueden eliminar compras
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
