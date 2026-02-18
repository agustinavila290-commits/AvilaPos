"""
Gestor de backups automáticos de la base de datos
"""
import os
import subprocess
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from django.conf import settings
from .models import BackupLog


class BackupManager:
    """Gestiona backups de PostgreSQL"""
    
    def __init__(self):
        self.backup_dir = Path(settings.BASE_DIR) / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
        
        # Configuración de PostgreSQL desde settings
        self.db_config = settings.DATABASES['default']
        self.db_name = self.db_config['NAME']
        self.db_user = self.db_config['USER']
        self.db_password = self.db_config['PASSWORD']
        self.db_host = self.db_config.get('HOST', 'localhost')
        self.db_port = self.db_config.get('PORT', '5432')
    
    def crear_backup(self, usuario=None):
        """
        Crea un backup de la base de datos
        
        Returns:
            tuple: (success: bool, mensaje: str, backup_log: BackupLog)
        """
        # Crear registro de backup
        backup_log = BackupLog.objects.create(
            estado=BackupLog.EstadoChoices.EN_PROGRESO,
            usuario=usuario
        )
        
        try:
            inicio = datetime.now()
            
            # Nombre del archivo
            timestamp = inicio.strftime('%Y%m%d_%H%M%S')
            filename = f"backup_{self.db_name}_{timestamp}.sql"
            filepath = self.backup_dir / filename
            
            # Comando pg_dump
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            cmd = [
                'pg_dump',
                '-h', self.db_host,
                '-p', str(self.db_port),
                '-U', self.db_user,
                '-F', 'c',  # Formato custom (comprimido)
                '-f', str(filepath),
                self.db_name
            ]
            
            # Ejecutar backup
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Error en pg_dump: {result.stderr}")
            
            # Calcular tamaño y duración
            tamanio = filepath.stat().st_size
            duracion = (datetime.now() - inicio).total_seconds()
            
            # Actualizar log
            backup_log.estado = BackupLog.EstadoChoices.EXITOSO
            backup_log.archivo = filename
            backup_log.tamanio = tamanio
            backup_log.duracion = duracion
            backup_log.save()
            
            # Limpiar backups antiguos
            self._limpiar_backups_antiguos()
            
            return True, f"Backup creado exitosamente: {filename}", backup_log
            
        except Exception as e:
            # Registrar error
            backup_log.estado = BackupLog.EstadoChoices.FALLIDO
            backup_log.error = str(e)
            backup_log.save()
            
            return False, f"Error al crear backup: {str(e)}", backup_log
    
    def restaurar_backup(self, filename, usuario=None):
        """
        Restaura un backup de la base de datos
        
        Args:
            filename: Nombre del archivo de backup
            usuario: Usuario que ejecuta la restauración
        
        Returns:
            tuple: (success: bool, mensaje: str)
        """
        try:
            filepath = self.backup_dir / filename
            
            if not filepath.exists():
                return False, f"Archivo de backup no encontrado: {filename}"
            
            # Comando pg_restore
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            cmd = [
                'pg_restore',
                '-h', self.db_host,
                '-p', str(self.db_port),
                '-U', self.db_user,
                '-d', self.db_name,
                '-c',  # Drop objetos antes de crearlos
                '-F', 'c',  # Formato custom
                str(filepath)
            ]
            
            # Ejecutar restauración
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                # pg_restore puede retornar warnings que no son errores
                if "error" in result.stderr.lower():
                    return False, f"Error en pg_restore: {result.stderr}"
            
            return True, f"Backup restaurado exitosamente desde: {filename}"
            
        except Exception as e:
            return False, f"Error al restaurar backup: {str(e)}"
    
    def listar_backups(self):
        """
        Lista todos los backups disponibles
        
        Returns:
            list: Lista de diccionarios con info de cada backup
        """
        backups = []
        
        for filepath in sorted(self.backup_dir.glob('backup_*.sql'), reverse=True):
            stat = filepath.stat()
            backups.append({
                'nombre': filepath.name,
                'tamanio': stat.st_size,
                'fecha': datetime.fromtimestamp(stat.st_mtime),
                'ruta': str(filepath)
            })
        
        return backups
    
    def eliminar_backup(self, filename):
        """
        Elimina un archivo de backup
        
        Args:
            filename: Nombre del archivo
        
        Returns:
            tuple: (success: bool, mensaje: str)
        """
        try:
            filepath = self.backup_dir / filename
            
            if not filepath.exists():
                return False, f"Archivo no encontrado: {filename}"
            
            filepath.unlink()
            return True, f"Backup eliminado: {filename}"
            
        except Exception as e:
            return False, f"Error al eliminar backup: {str(e)}"
    
    def _limpiar_backups_antiguos(self, dias_mantener=7):
        """
        Elimina backups más antiguos que X días
        
        Args:
            dias_mantener: Días de backups a mantener
        """
        fecha_limite = datetime.now() - timedelta(days=dias_mantener)
        
        for filepath in self.backup_dir.glob('backup_*.sql'):
            fecha_backup = datetime.fromtimestamp(filepath.stat().st_mtime)
            
            if fecha_backup < fecha_limite:
                try:
                    filepath.unlink()
                    print(f"Backup antiguo eliminado: {filepath.name}")
                except Exception as e:
                    print(f"Error al eliminar {filepath.name}: {e}")
    
    def estadisticas(self):
        """
        Retorna estadísticas de backups
        
        Returns:
            dict: Estadísticas
        """
        backups = self.listar_backups()
        logs = BackupLog.objects.all()
        
        return {
            'total_backups': len(backups),
            'tamanio_total': sum(b['tamanio'] for b in backups),
            'ultimo_backup': backups[0]['fecha'] if backups else None,
            'backups_exitosos': logs.filter(estado=BackupLog.EstadoChoices.EXITOSO).count(),
            'backups_fallidos': logs.filter(estado=BackupLog.EstadoChoices.FALLIDO).count(),
        }
