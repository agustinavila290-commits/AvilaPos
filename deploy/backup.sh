#!/bin/bash
# ==============================================================
# backup.sh — Backup automático de PostgreSQL + media
# Configurar como cron diario:
#   crontab -e
#   0 2 * * * /srv/avilapos/deploy/backup.sh >> /srv/avilapos/logs/backup.log 2>&1
# ==============================================================

set -euo pipefail

# Configuración (ajustar según el .env del servidor)
DB_NAME="${DB_NAME:-avilapos}"
DB_USER="${DB_USER:-avilapos_user}"
BACKUP_DIR="/srv/avilapos/backups"
MEDIA_DIR="/srv/avilapos/backend/media"
MAX_BACKUPS=30  # días de historial

# Fecha para nombre de archivo
FECHA=$(date +"%Y-%m-%d_%H-%M-%S")

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR/db"
mkdir -p "$BACKUP_DIR/media"

echo "[$(date)] Iniciando backup..."

# 1. Backup PostgreSQL
BACKUP_DB="$BACKUP_DIR/db/avilapos_${FECHA}.sql.gz"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -U "$DB_USER" \
    -h localhost \
    "$DB_NAME" | gzip > "$BACKUP_DB"

echo "[$(date)] DB backup: $BACKUP_DB ($(du -sh "$BACKUP_DB" | cut -f1))"

# 2. Backup media (imágenes, comprobantes, presupuestos)
BACKUP_MEDIA="$BACKUP_DIR/media/media_${FECHA}.tar.gz"
if [ -d "$MEDIA_DIR" ] && [ "$(ls -A $MEDIA_DIR 2>/dev/null)" ]; then
    tar -czf "$BACKUP_MEDIA" -C "$(dirname $MEDIA_DIR)" "$(basename $MEDIA_DIR)"
    echo "[$(date)] Media backup: $BACKUP_MEDIA ($(du -sh "$BACKUP_MEDIA" | cut -f1))"
else
    echo "[$(date)] Media vacío, sin backup de media."
fi

# 3. Limpiar backups antiguos (más de MAX_BACKUPS días)
find "$BACKUP_DIR/db"    -name "*.sql.gz"   -mtime +$MAX_BACKUPS -delete
find "$BACKUP_DIR/media" -name "*.tar.gz"   -mtime +$MAX_BACKUPS -delete

echo "[$(date)] Backup completado. Backups en: $BACKUP_DIR"
echo "[$(date)] DB recientes: $(ls $BACKUP_DIR/db | wc -l)"
