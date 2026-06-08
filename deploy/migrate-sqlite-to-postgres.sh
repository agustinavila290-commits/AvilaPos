#!/bin/bash
# ==============================================================
# migrate-sqlite-to-postgres.sh — Migrar datos de SQLite a PostgreSQL
# Ejecutar SOLO en el servidor, después de instalar PostgreSQL
# y ANTES de que el sistema entre en producción
# ==============================================================

set -euo pipefail

APP_DIR="/srv/avilapos"
VENV="$APP_DIR/venv"
SQLITE_DB="$APP_DIR/backend/db.sqlite3"

# Cargar variables
if [ -f "$APP_DIR/backend/.env" ]; then
    export $(grep -v '^#' "$APP_DIR/backend/.env" | xargs)
fi

echo "======================================================"
echo "  Migración SQLite → PostgreSQL"
echo "======================================================"
echo "ATENCIÓN: Esto sobreescribirá cualquier dato en PostgreSQL."
read -p "¿Confirmar? (s/N): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "Cancelado."
    exit 0
fi

# 1. Backup del SQLite (por si algo sale mal)
echo "[$(date)] Creando backup de SQLite..."
cp "$SQLITE_DB" "$SQLITE_DB.backup.$(date +%Y%m%d_%H%M%S)"

# 2. Exportar datos desde SQLite usando Django dumpdata
echo "[$(date)] Exportando datos desde SQLite..."
cd "$APP_DIR/backend"

# Temporalmente usar SQLite para exportar
export USE_SQLITE=True
"$VENV/bin/python" manage.py dumpdata \
    --natural-foreign \
    --natural-primary \
    --exclude auth.permission \
    --exclude contenttypes \
    --exclude admin.logentry \
    -o /tmp/avilapos_data_export.json

echo "[$(date)] Datos exportados: $(wc -l < /tmp/avilapos_data_export.json) líneas"

# 3. Aplicar esquema en PostgreSQL (sin datos)
echo "[$(date)] Aplicando migraciones en PostgreSQL..."
export USE_SQLITE=False
"$VENV/bin/python" manage.py migrate --noinput

# 4. Cargar datos en PostgreSQL
echo "[$(date)] Cargando datos en PostgreSQL..."
"$VENV/bin/python" manage.py loaddata /tmp/avilapos_data_export.json

echo "[$(date)] Migración completada."
echo "[$(date)] Verificar acceso con: python manage.py shell -c \"from apps.productos.models import ProductoBase; print(ProductoBase.objects.count(), 'productos')\""
