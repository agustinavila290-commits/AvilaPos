"""
Gestor de backups para AvilaPOS.
Soporta SQLite (desarrollo) y crea ZIPs que incluyen BD + archivos media.
"""
import os
import sqlite3
import shutil
import zipfile
import json
from datetime import datetime, timedelta
from pathlib import Path
from django.conf import settings
from django.utils import timezone


def _is_sqlite():
    engine = settings.DATABASES['default'].get('ENGINE', '')
    return 'sqlite3' in engine


def _get_backup_dir():
    d = Path(settings.BASE_DIR) / 'backups'
    d.mkdir(exist_ok=True)
    return d


def _get_media_dir():
    return Path(settings.MEDIA_ROOT) if hasattr(settings, 'MEDIA_ROOT') else None


class BackupManager:
    """Gestiona backups de SQLite + media files."""

    def __init__(self):
        self.backup_dir = _get_backup_dir()
        self.media_dir = _get_media_dir()

    # ─── Creación ────────────────────────────────────────────────────────────

    def crear_backup(self, usuario=None, etiqueta='manual'):
        """
        Crea un backup completo en formato ZIP:
          - base de datos SQLite
          - directorio media/ (facturas, imágenes de productos, adjuntos)
          - metadata.json con info del backup

        Returns: (success: bool, mensaje: str, BackupLog)
        """
        from .models import BackupLog

        backup_log = BackupLog.objects.create(
            estado=BackupLog.EstadoChoices.EN_PROGRESO,
            usuario=usuario,
        )

        try:
            inicio = datetime.now()
            timestamp = inicio.strftime('%Y%m%d_%H%M%S')
            zip_name = f"backup_{etiqueta}_{timestamp}.zip"
            zip_path = self.backup_dir / zip_name

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
                # 1. Base de datos SQLite
                if _is_sqlite():
                    db_path = Path(settings.DATABASES['default']['NAME'])
                    if db_path.exists():
                        tmp_db = self.backup_dir / f'_tmp_backup_{timestamp}.db'
                        self._backup_sqlite(db_path, tmp_db)
                        zf.write(tmp_db, 'database/db.sqlite3')
                        tmp_db.unlink(missing_ok=True)

                # 2. Media (facturas, imágenes)
                if self.media_dir and self.media_dir.exists():
                    for file_path in self.media_dir.rglob('*'):
                        if file_path.is_file():
                            arcname = 'media/' + str(file_path.relative_to(self.media_dir))
                            zf.write(file_path, arcname)

                # 3. Metadata
                meta = {
                    'version': '1.0',
                    'tipo': etiqueta,
                    'fecha': inicio.isoformat(),
                    'usuario': str(usuario) if usuario else 'sistema',
                    'base_de_datos': 'sqlite3' if _is_sqlite() else 'postgresql',
                }
                zf.writestr('metadata.json', json.dumps(meta, ensure_ascii=False, indent=2))

            tamanio = zip_path.stat().st_size
            duracion = (datetime.now() - inicio).total_seconds()

            backup_log.estado = BackupLog.EstadoChoices.EXITOSO
            backup_log.archivo = zip_name
            backup_log.tamanio = tamanio
            backup_log.duracion = duracion
            backup_log.save()

            self._limpiar_backups_antiguos()

            return True, f"Backup creado: {zip_name} ({tamanio / 1024 / 1024:.2f} MB en {duracion:.1f}s)", backup_log

        except Exception as e:
            backup_log.estado = BackupLog.EstadoChoices.FALLIDO
            backup_log.error = str(e)
            backup_log.save()
            return False, f"Error al crear backup: {e}", backup_log

    def _backup_sqlite(self, source: Path, dest: Path):
        """Copia hot de SQLite usando la API de backup de sqlite3."""
        src = sqlite3.connect(str(source))
        dst = sqlite3.connect(str(dest))
        try:
            src.backup(dst)
        finally:
            src.close()
            dst.close()

    # ─── Restauración ────────────────────────────────────────────────────────

    def restaurar_backup(self, filename, usuario=None):
        """
        Restaura un backup desde un ZIP.
        - Reemplaza la BD SQLite
        - Restaura los archivos media/
        """
        try:
            zip_path = self.backup_dir / filename

            if not zip_path.exists():
                return False, f"Archivo de backup no encontrado: {filename}"

            if not zipfile.is_zipfile(zip_path):
                return False, f"El archivo no es un ZIP válido: {filename}"

            with zipfile.ZipFile(zip_path, 'r') as zf:
                nombres = zf.namelist()

                # Restaurar BD SQLite
                db_entry = next((n for n in nombres if n.endswith('db.sqlite3')), None)
                if db_entry and _is_sqlite():
                    db_path = Path(settings.DATABASES['default']['NAME'])
                    tmp_restore = self.backup_dir / '_tmp_restore.db'
                    with zf.open(db_entry) as src, open(tmp_restore, 'wb') as dst:
                        shutil.copyfileobj(src, dst)
                    # Reemplazar BD activa — el servidor debe reiniciarse después
                    shutil.copy2(tmp_restore, db_path)
                    tmp_restore.unlink(missing_ok=True)

                # Restaurar media
                if self.media_dir:
                    media_entries = [n for n in nombres if n.startswith('media/')]
                    for entry in media_entries:
                        dest = self.media_dir / entry[len('media/'):]
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        with zf.open(entry) as src_f, open(dest, 'wb') as dst_f:
                            shutil.copyfileobj(src_f, dst_f)

            return True, f"Backup restaurado correctamente desde: {filename}. Reiniciá el servidor para que los cambios en la BD tomen efecto."

        except Exception as e:
            return False, f"Error al restaurar backup: {e}"

    # ─── Listado y gestión ───────────────────────────────────────────────────

    def listar_backups(self):
        """Lista todos los archivos de backup disponibles."""
        backups = []
        for fp in sorted(self.backup_dir.glob('backup_*.zip'), reverse=True):
            stat = fp.stat()
            # Leer metadata del ZIP si existe
            tipo = 'manual'
            try:
                with zipfile.ZipFile(fp, 'r') as zf:
                    if 'metadata.json' in zf.namelist():
                        meta = json.loads(zf.read('metadata.json'))
                        tipo = meta.get('tipo', 'manual')
            except Exception:
                pass
            backups.append({
                'nombre': fp.name,
                'tamanio': stat.st_size,
                'fecha': datetime.fromtimestamp(stat.st_mtime),
                'ruta': str(fp),
                'tipo': tipo,
            })
        return backups

    def eliminar_backup(self, filename):
        """Elimina un archivo de backup."""
        try:
            fp = self.backup_dir / filename
            if not fp.exists():
                return False, f"Archivo no encontrado: {filename}"
            fp.unlink()
            return True, f"Backup eliminado: {filename}"
        except Exception as e:
            return False, f"Error al eliminar: {e}"

    def estadisticas(self):
        """Retorna estadísticas de backups."""
        from .models import BackupLog
        backups = self.listar_backups()
        logs = BackupLog.objects.all()
        ultimo_auto = BackupLog.objects.filter(
            estado=BackupLog.EstadoChoices.EXITOSO,
            usuario__isnull=True,
        ).order_by('-fecha').first()

        return {
            'total_backups': len(backups),
            'tamanio_total': sum(b['tamanio'] for b in backups),
            'ultimo_backup': backups[0]['fecha'] if backups else None,
            'backups_exitosos': logs.filter(estado=BackupLog.EstadoChoices.EXITOSO).count(),
            'backups_fallidos': logs.filter(estado=BackupLog.EstadoChoices.FALLIDO).count(),
            'ultimo_backup_automatico': ultimo_auto.fecha.isoformat() if ultimo_auto else None,
            'scheduler_activo': _scheduler_running(),
        }

    def _limpiar_backups_antiguos(self, dias_mantener=30):
        """Elimina backups manuales > 30 días y diarios > 7 días."""
        fecha_limite_manual = datetime.now() - timedelta(days=dias_mantener)
        fecha_limite_auto = datetime.now() - timedelta(days=7)

        for fp in self.backup_dir.glob('backup_*.zip'):
            fecha = datetime.fromtimestamp(fp.stat().st_mtime)
            es_auto = 'automatico' in fp.name or 'diario' in fp.name
            limite = fecha_limite_auto if es_auto else fecha_limite_manual
            if fecha < limite:
                try:
                    fp.unlink()
                except Exception:
                    pass


# ─── Scheduler de backups automáticos ────────────────────────────────────────

_scheduler_instance = None


def _scheduler_running():
    return _scheduler_instance is not None and _scheduler_instance.running


def _ejecutar_backup_automatico():
    """Función ejecutada por el scheduler diariamente."""
    try:
        manager = BackupManager()
        success, msg, _ = manager.crear_backup(usuario=None, etiqueta='automatico')
        if success:
            print(f"[Backup automático] {msg}")
        else:
            print(f"[Backup automático] ERROR: {msg}")
    except Exception as e:
        print(f"[Backup automático] Excepción: {e}")


def iniciar_scheduler():
    """Inicia el scheduler de backups automáticos. Se llama desde AppConfig.ready()."""
    global _scheduler_instance
    if _scheduler_instance is not None:
        return

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger

        scheduler = BackgroundScheduler(timezone='America/Argentina/Cordoba')
        scheduler.add_job(
            _ejecutar_backup_automatico,
            trigger=CronTrigger(hour=2, minute=0),  # 2:00 AM todos los días
            id='backup_diario',
            replace_existing=True,
            misfire_grace_time=3600,
        )
        scheduler.start()
        _scheduler_instance = scheduler
        print("[AvilaPOS] Scheduler de backups automáticos iniciado (2:00 AM diario)")
    except Exception as e:
        print(f"[AvilaPOS] No se pudo iniciar el scheduler: {e}")
