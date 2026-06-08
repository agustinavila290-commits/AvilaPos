from django.apps import AppConfig


class SistemaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sistema'
    verbose_name = 'Sistema'

    def ready(self):
        """Inicia el scheduler de backups y aplica el patch del dashboard admin."""
        import os, sys

        # Dashboard admin — inyecta métricas en el índice del admin
        try:
            import types
            from django.contrib import admin as admin_module
            from django.db.models import Sum
            from pathlib import Path

            # Forzar nuestra plantilla personalizada en la INSTANCIA
            templates_dir = Path(__file__).resolve().parent.parent.parent / 'templates'
            template_path = str(templates_dir / 'admin' / 'index.html')
            # Activar el LazyObject accediendo a un atributo real (dispara _setup())
            _ = admin_module.site.name  # noqa: F841 — trigger _setup()
            inner = admin_module.site._wrapped  # ahora sí es el AdminSite real
            inner.index_template = template_path

            _original_index = inner.index.__func__

            def _dashboard_index(self, request, extra_context=None):
                metrics = {}
                try:
                    from django.utils import timezone
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
                ctx = extra_context or {}
                ctx['dashboard_metrics'] = metrics
                return _original_index(self, request, ctx)

            # Setear en la instancia interna para bypasear el LazyObject
            inner.index = types.MethodType(_dashboard_index, inner)
            print("[AvilaPOS] Dashboard admin activo en:", template_path)
        except Exception as e:
            print(f"[Sistema] Error al parchear admin dashboard: {e}")

        # Scheduler de backups automáticos al arrancar Django
        # En desarrollo con autoreload: RUN_MAIN='true' en el proceso worker real.
        # En producción (gunicorn, uvicorn, etc.): RUN_MAIN no está seteado.
        in_worker = os.environ.get('RUN_MAIN') == 'true'
        in_production = 'runserver' not in sys.argv
        if in_worker or in_production:
            try:
                from .backup_manager import iniciar_scheduler
                iniciar_scheduler()
            except Exception as e:
                print(f"[Sistema] Error al iniciar scheduler: {e}")
