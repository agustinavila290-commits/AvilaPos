"""
Comando: agregar N unidades de stock a todas las variantes en el depósito principal.
Uso: python manage.py agregar_stock_productos [cantidad]
Por defecto cantidad=5.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.inventario.models import Deposito, Stock
from apps.productos.models import VarianteProducto


class Command(BaseCommand):
    help = 'Agrega N unidades de stock a todos los productos (variantes) en el depósito principal. Por defecto N=5.'

    def add_arguments(self, parser):
        parser.add_argument(
            'cantidad',
            nargs='?',
            type=int,
            default=5,
            help='Unidades a sumar por variante (default: 5)',
        )

    def handle(self, *args, **options):
        cantidad = options['cantidad']
        if cantidad <= 0:
            self.stdout.write(self.style.ERROR('La cantidad debe ser mayor que 0.'))
            return

        deposito = Deposito.objects.filter(es_principal=True, activo=True).first()
        if not deposito:
            self.stdout.write(self.style.ERROR('No hay depósito principal activo. Ejecutá: python manage.py crear_deposito_principal'))
            return

        variantes = VarianteProducto.objects.all().order_by('id')
        total = variantes.count()
        if total == 0:
            self.stdout.write(self.style.WARNING('No hay variantes de producto en el sistema.'))
            return

        self.stdout.write(f'Depósito: {deposito.nombre}')
        self.stdout.write(f'Variantes a actualizar: {total}')
        self.stdout.write(f'Sumando {cantidad} unidad(es) por variante...')

        actualizados = 0
        creados = 0
        with transaction.atomic():
            for variante in variantes:
                stock, created = Stock.objects.get_or_create(
                    variante=variante,
                    deposito=deposito,
                    defaults={'cantidad': 0},
                )
                stock.cantidad += cantidad
                stock.save()
                if created:
                    creados += 1
                else:
                    actualizados += 1

        self.stdout.write(self.style.SUCCESS(
            f'[OK] Listo. Actualizados: {actualizados}, creados: {creados}. Total variantes: {total}'
        ))
