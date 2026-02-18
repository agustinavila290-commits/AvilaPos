from django.contrib import admin
from .models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP


@admin.register(PuntoVenta)
class PuntoVentaAdmin(admin.ModelAdmin):
    list_display = ['numero', 'nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']


class ItemFacturaInline(admin.TabularInline):
    model = ItemFactura
    extra = 1
    fields = ['orden', 'codigo', 'descripcion', 'cantidad', 'precio_unitario', 'alicuota_iva', 'total']
    readonly_fields = ['total']


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_completo', 'tipo_comprobante', 'fecha_emision',
        'cliente_razon_social', 'total', 'estado', 'cae'
    ]
    list_filter = ['tipo_comprobante', 'estado', 'fecha_emision', 'punto_venta']
    search_fields = ['numero', 'cliente_razon_social', 'cliente_cuit', 'cae']
    readonly_fields = [
        'numero', 'fecha_emision', 'fecha_creacion', 'fecha_modificacion',
        'numero_completo', 'cae', 'cae_vencimiento', 'fecha_proceso_afip'
    ]
    inlines = [ItemFacturaInline]
    
    fieldsets = (
        ('Identificación', {
            'fields': ('tipo_comprobante', 'punto_venta', 'numero', 'numero_completo', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_emision', 'fecha_vencimiento', 'fecha_creacion', 'fecha_modificacion')
        }),
        ('Cliente', {
            'fields': ('cliente', 'cliente_razon_social', 'cliente_cuit', 'cliente_condicion_iva', 'cliente_domicilio')
        }),
        ('Referencias', {
            'fields': ('venta', 'usuario')
        }),
        ('Importes', {
            'fields': ('subtotal', 'iva_105', 'iva_21', 'iva_27', 'otros_tributos', 'total')
        }),
        ('AFIP', {
            'fields': ('cae', 'cae_vencimiento', 'fecha_proceso_afip', 'resultado_afip', 'observaciones_afip', 'qr_data')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar facturas autorizadas
        if obj and obj.estado == Factura.Estado.AUTORIZADA:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(ConfiguracionAFIP)
class ConfiguracionAFIPAdmin(admin.ModelAdmin):
    list_display = ['cuit_emisor', 'razon_social', 'ambiente', 'activo']
    readonly_fields = ['token', 'sign', 'token_expiracion']
    
    fieldsets = (
        ('Datos del Contribuyente', {
            'fields': ('cuit_emisor', 'razon_social', 'domicilio_comercial', 'condicion_iva', 'inicio_actividades')
        }),
        ('Configuración AFIP', {
            'fields': ('ambiente', 'activo')
        }),
        ('Certificados', {
            'fields': ('certificado', 'clave_privada'),
            'description': 'Certificado y clave privada para Web Service AFIP'
        }),
        ('Token/Sign (Automático)', {
            'fields': ('token', 'sign', 'token_expiracion'),
            'classes': ('collapse',)
        }),
    )
