from django.contrib import admin
from .models import CloverConfig, CloverPago


@admin.register(CloverConfig)
class CloverConfigAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'merchant_id', 'tipo_integracion', 'activo', 'fecha_actualizacion']
    list_filter = ['tipo_integracion', 'activo']
    search_fields = ['nombre', 'merchant_id']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    fieldsets = (
        (None, {
            'fields': ('nombre', 'activo')
        }),
        ('Clover', {
            'fields': ('merchant_id', 'access_token', 'tipo_integracion', 'endpoint_url')
        }),
        ('Auditoría', {
            'fields': ('fecha_creacion', 'fecha_actualizacion')
        }),
    )


@admin.register(CloverPago)
class CloverPagoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'clover_payment_id', 'monto', 'estado', 'metodo_tarjeta',
        'venta', 'fecha_procesamiento'
    ]
    list_filter = ['estado', 'fecha_procesamiento']
    search_fields = ['clover_payment_id', 'venta__numero']
    readonly_fields = [
        'venta', 'clover_payment_id', 'monto', 'estado', 'metodo_tarjeta',
        'ultimos_4_digitos', 'datos_respuesta', 'error_mensaje', 'fecha_procesamiento'
    ]
    date_hierarchy = 'fecha_procesamiento'

    def has_add_permission(self, request):
        return False
