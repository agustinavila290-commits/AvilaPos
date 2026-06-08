"""
Inyecta métricas de negocio en el dashboard del admin Django.
Se importa desde urls.py para que el patch se aplique al inicio.
"""
from django.contrib.admin import AdminSite
from django.db.models import Sum

_original_index = AdminSite.index


def _dashboard_index(self, request, extra_context=None):
    metrics = {}
    try:
        from django.utils import timezone
        from apps.ventas.models import Venta
        from apps.inventario.models import Stock
        from apps.facturacion.models import Factura
        from apps.clientes.models import Cliente

        today = timezone.localdate()

        ventas_hoy = Venta.objects.filter(fecha__date=today, estado='COMPLETADA')
        ventas_mes = Venta.objects.filter(
            fecha__year=today.year,
            fecha__month=today.month,
            estado='COMPLETADA',
        )

        metrics = {
            'ventas_hoy_count': ventas_hoy.count(),
            'ventas_hoy_monto': float(ventas_hoy.aggregate(t=Sum('total'))['t'] or 0),
            'ventas_mes_count': ventas_mes.count(),
            'ventas_mes_monto': float(ventas_mes.aggregate(t=Sum('total'))['t'] or 0),
            'stock_critico': Stock.objects.filter(cantidad__gt=0, cantidad__lte=2).count(),
            'stock_agotado': Stock.objects.filter(cantidad__lte=0).count(),
            'facturas_pendientes': Factura.objects.filter(estado='BORRADOR').count(),
            'facturas_rechazadas': Factura.objects.filter(estado='RECHAZADA').count(),
            'clientes_total': Cliente.objects.filter(activo=True).count(),
            'ultimas_ventas': list(
                Venta.objects.select_related('cliente', 'usuario')
                .order_by('-fecha')[:8]
                .values(
                    'id', 'numero', 'total', 'metodo_pago', 'fecha',
                    'cliente__nombre', 'cliente__apellido',
                    'usuario__first_name', 'usuario__username',
                )
            ),
        }
    except Exception:
        pass

    ctx = extra_context or {}
    ctx['dashboard_metrics'] = metrics
    return _original_index(self, request, ctx)


AdminSite.index = _dashboard_index
print("[AvilaPOS] Dashboard admin patch aplicado")
