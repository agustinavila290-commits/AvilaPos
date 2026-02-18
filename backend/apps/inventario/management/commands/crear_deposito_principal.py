from django.core.management.base import BaseCommand
from apps.inventario.models import Deposito


class Command(BaseCommand):
    help = 'Crea o verifica el depósito principal'

    def handle(self, *args, **options):
        # Verificar depósito principal
        deposito = Deposito.objects.filter(es_principal=True, activo=True).first()
        
        if deposito:
            self.stdout.write(self.style.SUCCESS(f'[OK] Depósito principal: {deposito.nombre}'))
            return
        
        self.stdout.write(self.style.WARNING('[ADVERTENCIA] No hay depósito principal configurado'))
        
        # Verificar si hay depósitos
        total = Deposito.objects.count()
        self.stdout.write(f'Total de depósitos: {total}')
        
        if total == 0:
            # Crear depósito principal
            self.stdout.write('[CREANDO] Depósito principal...')
            deposito = Deposito.objects.create(
                nombre='Depósito Principal',
                direccion='Dirección del negocio',
                es_principal=True,
                activo=True
            )
            self.stdout.write(self.style.SUCCESS(f'[OK] Depósito creado: {deposito.nombre}'))
        else:
            # Marcar el primero como principal
            primer_deposito = Deposito.objects.first()
            primer_deposito.es_principal = True
            primer_deposito.save()
            self.stdout.write(self.style.SUCCESS(f'[OK] Depósito "{primer_deposito.nombre}" marcado como principal'))
