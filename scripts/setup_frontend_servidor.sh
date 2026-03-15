#!/bin/bash
# Levantar frontend (React/Vite) en el mismo servidor que el backend.
# Ejecutar como root en el servidor, DESPUÉS de haber corrido setup_servidor_ubuntu.sh.
# Usa el mismo APP_DIR (por defecto /var/www/AvilaPos).

set -e
APP_DIR="${APP_DIR:-/var/www/AvilaPos}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
SOCKET_PATH="$BACKEND_DIR/gunicorn.sock"

echo "=============================================="
echo "  Setup Frontend Avila POS en el servidor"
echo "  Directorio: $APP_DIR"
echo "=============================================="

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "No existe $FRONTEND_DIR. ¿Clonaste el repo completo? (debe incluir carpeta frontend)"
  exit 1
fi

echo ""
echo "1. Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
node -v
npm -v

echo ""
echo "2. Instalando dependencias y compilando frontend..."
echo "   (API se usará como /api en el mismo servidor)"
cd "$FRONTEND_DIR"
export VITE_API_URL=/api
npm ci
npm run build

if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "Error: no se generó dist/index.html"
  exit 1
fi

echo ""
echo "3. Actualizando Nginx para servir frontend + backend..."

# Obtener server_name actual del config existente o usar default
SERVER_NAMES="_"
if [ -f /etc/nginx/sites-available/avila ]; then
  CURRENT=$(grep -E '^\s*server_name\s+' /etc/nginx/sites-available/avila | head -1 | sed 's/.*server_name\s*//;s/;//')
  [ -n "$CURRENT" ] && SERVER_NAMES="$CURRENT"
fi

cat > /etc/nginx/sites-available/avila << 'NGINX_EOF'
server {
    listen 80;
    server_name SERVER_NAMES_PLACEHOLDER;
    client_max_body_size 10M;

    location /static/ {
        alias BACKEND_STATIC_PLACEHOLDER;
    }

    location /media/ {
        alias BACKEND_MEDIA_PLACEHOLDER;
    }

    location /api/ {
        proxy_pass http://unix:SOCKET_PLACEHOLDER;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root FRONTEND_DIST_PLACEHOLDER;
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

sed -i "s|SERVER_NAMES_PLACEHOLDER|$SERVER_NAMES|" /etc/nginx/sites-available/avila
sed -i "s|BACKEND_STATIC_PLACEHOLDER|$BACKEND_DIR/staticfiles/|" /etc/nginx/sites-available/avila
sed -i "s|BACKEND_MEDIA_PLACEHOLDER|$BACKEND_DIR/media/|" /etc/nginx/sites-available/avila
sed -i "s|SOCKET_PLACEHOLDER|$SOCKET_PATH|" /etc/nginx/sites-available/avila
sed -i "s|FRONTEND_DIST_PLACEHOLDER|$FRONTEND_DIR/dist|" /etc/nginx/sites-available/avila

nginx -t && systemctl reload nginx

echo ""
echo "=============================================="
echo "  Frontend listo."
echo "  Abrí http://TU_IP/ en el navegador (mismo servidor que la API)."
echo "=============================================="
