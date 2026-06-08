"""Vista del dashboard admin — métricas del negocio."""
from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Sum
from django.template.response import TemplateResponse
from django.utils import timezone


@staff_member_required
def dashboard_view(request):
    metrics = {}
    try:
        from apps.ventas.models import Venta
        from apps.inventario.models import Stock
        from apps.facturacion.models import Factura

        today = timezone.localdate()
        ventas_hoy = Venta.objects.filter(fecha__date=today, estado='COMPLETADA')
        ventas_mes = Venta.objects.filter(
            fecha__year=today.year, fecha__month=today.month, estado='COMPLETADA'
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
            'ultimas_ventas': list(
                Venta.objects.select_related('cliente', 'usuario')
                .order_by('-fecha')[:8]
                .values(
                    'id', 'numero', 'total', 'metodo_pago', 'fecha',
                    'cliente__nombre',
                    'usuario__first_name', 'usuario__username',
                )
            ),
        }
    except Exception:
        pass

    context = {
        **admin.site.each_context(request),
        'title': 'Panel de control',
        'app_list': admin.site.get_app_list(request),
        'dashboard_metrics': metrics,
    }
    return TemplateResponse(request, 'admin/index.html', context)
