from django.contrib import admin
from .models import TicketCuentaCorriente, DetalleTicketCC


class DetalleTicketCCInline(admin.TabularInline):
    model = DetalleTicketCC
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(TicketCuentaCorriente)
class TicketCuentaCorrienteAdmin(admin.ModelAdmin):
    list_display = ('numero', 'cliente', 'descripcion', 'estado', 'total', 'fecha_apertura', 'fecha_cierre')
    list_filter = ('estado', 'deposito')
    search_fields = ('numero', 'cliente__nombre', 'cliente__dni', 'descripcion')
    readonly_fields = ('numero', 'fecha_apertura', 'fecha_cierre')
    inlines = [DetalleTicketCCInline]
