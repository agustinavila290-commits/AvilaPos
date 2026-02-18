"""
Comando para crear backup de la base de datos
Uso: python manage.py backup_database
"""
from django.core.management.base import BaseCommand
from apps.sistema.backup_manager import BackupManager


class Command(BaseCommand):
    help = 'Crea un backup de la base de datos'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando backup...'))
        
        manager = BackupManager()
        success, mensaje, backup_log = manager.crear_backup()
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ {mensaje}'))
            self.stdout.write(f'  Tamaño: {backup_log.tamanio / (1024*1024):.2f} MB')
            self.stdout.write(f'  Duración: {backup_log.duracion:.2f} segundos')
        else:
            self.stdout.write(self.style.ERROR(f'✗ {mensaje}'))
