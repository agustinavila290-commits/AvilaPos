#!/bin/bash
# ==============================================================
# update.sh — Actualizar AvilaPOS en el servidor
# Uso: sudo -u avilapos /srv/avilapos/deploy/update.sh
# O para actualizar desde git: bash update.sh --git
# ==============================================================

set -euo pipefail

APP_DIR="/srv/avilapos"
VENV="$APP_DIR/venv"

echo "[$(date)] Iniciando actualización de AvilaPOS..."

# Cargar variables de entorno
if [ -f "$APP_DIR/backend/.env" ]; then
    export $(grep -v '^#' "$APP_DIR/backend/.env" | xargs)
fi

# Opcional: pull desde git
if [[ "${1:-}" == "--git" ]]; then
    echo "[$(date)] Actualizando código desde git..."
    cd "$APP_DIR"
    git pull origin main
fi

# 1. Instalar/actualizar dependencias Python
echo "[$(date)] Actualizando dependencias Python..."
"$VENV/bin/pip" install -r "$APP_DIR/backend/requirements.txt" -q

# 2. Aplicar migraciones de base de datos
echo "[$(date)] Aplicando migraciones..."
cd "$APP_DIR/backend"
"$VENV/bin/python" manage.py migrate --noinput

# 3. Recopilar archivos estáticos
echo "[$(date)] Recopilando archivos estáticos..."
"$VENV/bin/python" manage.py collectstatic --noinput -q

# 4. Compilar frontend tienda web (avila-web)
if [ -d "$APP_DIR/avila-web" ] && [ -f "$APP_DIR/avila-web/package.json" ]; then
    echo "[$(date)] Compilando tienda web (avila-web)..."
    cd "$APP_DIR/avila-web"
    npm install --silent
    npm run build
fi

# 5. Compilar frontend POS
if [ -d "$APP_DIR/frontend" ] && [ -f "$APP_DIR/frontend/package.json" ]; then
    echo "[$(date)] Compilando frontend POS..."
    cd "$APP_DIR/frontend"
    npm install --silent
    npm run build:web
fi

# 6. Reiniciar Gunicorn
echo "[$(date)] Reiniciando servicio Gunicorn..."
sudo systemctl restart avilapos

# 7. Recargar Nginx (por si cambió la config)
sudo nginx -t && sudo systemctl reload nginx

echo "[$(date)] Actualización completada exitosamente."
echo "[$(date)] Estado del servicio:"
sudo systemctl status avilapos --no-pager -l | head -20
