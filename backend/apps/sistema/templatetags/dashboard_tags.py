from django import template
from django.utils import timezone
from django.db.models import Sum

register = template.Library()


@register.simple_tag
def get_dashboard_metrics():
    """Retorna métricas del negocio para mostrar en el dashboard del admin."""
    try:
        from apps.ventas.models import Venta
        from apps.inventario.models import Stock
        from apps.facturacion.models import Factura
        from apps.clientes.models import Cliente
        from apps.compras.models import Compra

        today = timezone.localdate()

        ventas_hoy = Venta.objects.filter(fecha__date=today, estado='COMPLETADA')
        ventas_mes = Venta.objects.filter(
            fecha__year=today.year, fecha__month=today.month, estado='COMPLETADA'
        )

        monto_hoy = ventas_hoy.aggregate(t=Sum('total'))['t'] or 0
        monto_mes = ventas_mes.aggregate(t=Sum('total'))['t'] or 0

        stock_critico = Stock.objects.filter(cantidad__gt=0, cantidad__lte=2).count()
        stock_agotado = Stock.objects.filter(cantidad__lte=0).count()

        facturas_pendientes = Factura.objects.filter(estado='BORRADOR').count()
        facturas_rechazadas = Factura.objects.filter(estado='RECHAZADA').count()

        clientes_total = Cliente.objects.filter(activo=True).count()

        ultimas_ventas = Venta.objects.select_related('cliente', 'usuario').order_by('-fecha')[:8]

        return {
            'ventas_hoy_count': ventas_hoy.count(),
            'ventas_hoy_monto': float(monto_hoy),
            'ventas_mes_count': ventas_mes.count(),
            'ventas_mes_monto': float(monto_mes),
            'stock_critico': stock_critico,
            'stock_agotado': stock_agotado,
            'facturas_pendientes': facturas_pendientes,
            'facturas_rechazadas': facturas_rechazadas,
            'clientes_total': clientes_total,
            'ultimas_ventas': ultimas_ventas,
        }
    except Exception:
        return {}
