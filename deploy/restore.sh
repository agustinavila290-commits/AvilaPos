#!/bin/bash
# ==============================================================
# restore.sh — Restaurar backup de PostgreSQL + media
# Uso: ./restore.sh <archivo_db.sql.gz> [archivo_media.tar.gz]
# Ejemplo: ./restore.sh /srv/avilapos/backups/db/avilapos_2026-06-08_02-00-00.sql.gz
# ==============================================================

set -euo pipefail

DB_NAME="${DB_NAME:-avilapos}"
DB_USER="${DB_USER:-avilapos_user}"
MEDIA_DIR="/srv/avilapos/backend/media"

if [ $# -lt 1 ]; then
    echo "Uso: $0 <archivo_db.sql.gz> [archivo_media.tar.gz]"
    exit 1
fi

BACKUP_DB="$1"
BACKUP_MEDIA="${2:-}"

echo "[$(date)] ATENCIÓN: Esto sobreescribirá la base de datos actual."
read -p "¿Confirmar restauración? (s/N): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "Cancelado."
    exit 0
fi

# 1. Detener Gunicorn
echo "[$(date)] Deteniendo servicio..."
sudo systemctl stop avilapos

# 2. Restaurar base de datos
echo "[$(date)] Restaurando DB desde: $BACKUP_DB"
PGPASSWORD="$DB_PASSWORD" dropdb --if-exists -U "$DB_USER" -h localhost "$DB_NAME"
PGPASSWORD="$DB_PASSWORD" createdb -U "$DB_USER" -h localhost "$DB_NAME"
gunzip -c "$BACKUP_DB" | PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost "$DB_NAME"
echo "[$(date)] DB restaurada."

# 3. Restaurar media (si se indicó)
if [ -n "$BACKUP_MEDIA" ] && [ -f "$BACKUP_MEDIA" ]; then
    echo "[$(date)] Restaurando media desde: $BACKUP_MEDIA"
    rm -rf "$MEDIA_DIR"
    tar -xzf "$BACKUP_MEDIA" -C "$(dirname $MEDIA_DIR)"
    echo "[$(date)] Media restaurado."
fi

# 4. Reiniciar servicio
echo "[$(date)] Reiniciando servicio..."
sudo systemctl start avilapos

echo "[$(date)] Restauración completada."
