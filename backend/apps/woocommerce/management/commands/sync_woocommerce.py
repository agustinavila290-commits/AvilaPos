"""
Comando: python manage.py sync_woocommerce
Sincroniza stock y precio web del POS hacia WooCommerce.
Requiere: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET en Configuración.
Solo actualiza productos que ya existen en WooCommerce con SKU = código de variante.
"""
from django.core.management.base import BaseCommand
from apps.woocommerce.services import run_sync
from apps.woocommerce.config import woocommerce_sync_configured


class Command(BaseCommand):
    help = 'Sincroniza productos y stock del POS hacia WooCommerce (solo actualiza productos existentes por SKU).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--deposito',
            type=int,
            default=None,
            help='ID del depósito (opcional; por defecto depósito principal)',
        )

    def handle(self, *args, **options):
        if not woocommerce_sync_configured():
            self.stdout.write(
                self.style.ERROR(
                    'Configuración incompleta. Configure WOOCOMMERCE_URL, '
                    'WOOCOMMERCE_CONSUMER_KEY y WOOCOMMERCE_CONSUMER_SECRET en Admin → Configuración.'
                )
            )
            return

        try:
            updated, err_count, errors = run_sync(deposito_id=options.get('deposito'))
            self.stdout.write(self.style.SUCCESS(f'[OK] Productos actualizados en WooCommerce: {updated}'))
            if err_count:
                self.stdout.write(self.style.WARNING(f'Errores: {err_count}'))
                for e in errors[:10]:
                    self.stdout.write(self.style.WARNING(f'  - {e}'))
                if len(errors) > 10:
                    self.stdout.write(self.style.WARNING(f'  ... y {len(errors) - 10} más'))
        except ValueError as e:
            self.stdout.write(self.style.ERROR(str(e)))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            raise
