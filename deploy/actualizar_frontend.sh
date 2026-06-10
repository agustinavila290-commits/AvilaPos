#!/bin/bash
# Actualizar frontend en el servidor: pull + build.
# Ejecutar en el servidor (por SSH o consola): bash actualizar_frontend.sh
# Opcional: APP_DIR=/root/AvilaPos bash actualizar_frontend.sh

set -e
APP_DIR="${APP_DIR:-/var/www/AvilaPos}"
FRONTEND_DIR="$APP_DIR/frontend"

echo "=============================================="
echo "  Actualizar frontend - $APP_DIR"
echo "=============================================="

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "No existe $FRONTEND_DIR"
  exit 1
fi

cd "$APP_DIR"
echo ""
echo "1. git pull..."
git pull origin main

cd "$FRONTEND_DIR"
echo ""
echo "2. npm run build (VITE_API_URL=/api)..."
export VITE_API_URL=/api
npm ci 2>/dev/null || npm install
npm run build

echo ""
echo "=============================================="
echo "  Listo. Recargá la página en el navegador."
echo "=============================================="
