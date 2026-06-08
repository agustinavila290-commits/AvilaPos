from django.contrib import admin
from django.utils.html import format_html
from .models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP


_ESTADO_FACTURA_COLORS = {
    'AUTORIZADA': ('#dcfce7', '#166534', 'Autorizada'),
    'RECHAZADA':  ('#fee2e2', '#991b1b', 'Rechazada'),
    'ANULADA':    ('#fee2e2', '#991b1b', 'Anulada'),
    'BORRADOR':   ('#f3f4f6', '#374151', 'Borrador'),
    'ERROR':      ('#fef3c7', '#92400e', 'Error'),
}


def _badge(bg, color, texto):
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, color, texto
    )


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
        'cliente_razon_social', 'total', 'badge_estado', 'cae'
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
    
    def badge_estado(self, obj):
        bg, color, label = _ESTADO_FACTURA_COLORS.get(obj.estado, ('#f3f4f6', '#374151', obj.estado))
        return _badge(bg, color, label)
    badge_estado.short_description = 'Estado'
    badge_estado.admin_order_field = 'estado'

    def has_delete_permission(self, request, obj=None):
        if obj and obj.estado == Factura.Estado.AUTORIZADA:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(ConfiguracionAFIP)
class ConfiguracionAFIPAdmin(admin.ModelAdmin):
    list_display = ['cuit_emisor', 'razon_social', 'badge_ambiente', 'activo']
    readonly_fields = ['token', 'sign', 'token_expiracion', 'aviso_ambiente']

    def badge_ambiente(self, obj):
        if obj.ambiente == 'H':
            return _badge('#fef3c7', '#92400e', 'Homologación (Testing)')
        return _badge('#dcfce7', '#166534', 'Producción')
    badge_ambiente.short_description = 'Ambiente'

    def aviso_ambiente(self, obj):
        if obj.ambiente == 'H':
            return format_html(
                '<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:12px 16px;color:#78350f;">'
                '<strong>⚠ MODO HOMOLOGACIÓN (TESTING)</strong><br>'
                'Las facturas generadas NO son válidas ante AFIP. '
                'Para emitir facturas reales cambiá el ambiente a <strong>Producción</strong> '
                'e ingresá los certificados correspondientes.'
                '</div>'
            )
        return format_html(
            '<div style="background:#dcfce7;border:1px solid #16a34a;border-radius:6px;padding:12px 16px;color:#166534;">'
            '<strong>✓ MODO PRODUCCIÓN</strong> — Las facturas son válidas ante AFIP.'
            '</div>'
        )
    aviso_ambiente.short_description = 'Estado del Ambiente'

    fieldsets = (
        ('Estado', {
            'fields': ('aviso_ambiente',),
        }),
        ('Datos del Contribuyente', {
            'fields': ('cuit_emisor', 'razon_social', 'domicilio_comercial', 'condicion_iva', 'inicio_actividades'),
        }),
        ('Configuración AFIP', {
            'fields': ('ambiente', 'activo'),
        }),
        ('Certificados', {
            'fields': ('certificado', 'clave_privada'),
            'description': (
                'Pegá el contenido completo del archivo .crt en "Certificado" y el archivo .key en "Clave Privada". '
                'El texto debe empezar con -----BEGIN CERTIFICATE----- y terminar con -----END CERTIFICATE----- '
                '(o BEGIN/END PRIVATE KEY para la clave). '
                'Obtené estos archivos solicitando un certificado en el servicio "wsass" de AFIP.'
            ),
        }),
        ('Token/Sign (se generan automáticamente)', {
            'fields': ('token', 'sign', 'token_expiracion'),
            'classes': ('collapse',),
            'description': 'Estos valores los genera el sistema al conectar con AFIP. No los edites manualmente.',
        }),
    )
