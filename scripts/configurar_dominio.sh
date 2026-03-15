#!/bin/bash
# Configurar dos dominios: POS (sistema) y Web pública.
# POS:  sistema.avilamotorepuesto.com.ar + www.sistema.avilamotorepuesto.com.ar
# Web:  avilamotorepuesto.com.ar + www.avilamotorepuesto.com.ar
# Ejecutar como root en el servidor.
# Uso: bash configurar_dominio.sh
#      (o definir DOMINIO_POS y DOMINIO_WEB si querés otros dominios)

set -e
APP_DIR="${APP_DIR:-/var/www/AvilaPos}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
AVILA_WEB_DIR="${AVILA_WEB_DIR:-$APP_DIR/avila-web}"
SOCKET_PATH="$BACKEND_DIR/gunicorn.sock"
ENV_FILE="$APP_DIR/.env"

# Dominio POS (sistema) - por defecto subdominio sistema
DOMINIO_POS="${DOMINIO_POS:-sistema.avilamotorepuesto.com.ar}"
# Dominio web pública - por defecto raíz del dominio
DOMINIO_WEB="${DOMINIO_WEB:-avilamotorepuesto.com.ar}"

POS_SERVER_NAMES="$DOMINIO_POS www.$DOMINIO_POS"
WEB_SERVER_NAMES="$DOMINIO_WEB www.$DOMINIO_WEB"
ALLOWED_HOSTS_LIST="$DOMINIO_POS,www.$DOMINIO_POS,$DOMINIO_WEB,www.$DOMINIO_WEB"

echo "=============================================="
echo "  Configurar dominios"
echo "  POS (sistema): $POS_SERVER_NAMES"
echo "  Web pública:  $WEB_SERVER_NAMES"
echo "=============================================="

if [ ! -f "$ENV_FILE" ]; then
  echo "No existe $ENV_FILE. ¿Corriste antes el setup del backend?"
  exit 1
fi

echo ""
echo "1. Actualizando ALLOWED_HOSTS en .env..."
CURRENT=$(grep -E '^ALLOWED_HOSTS=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
FINAL="$CURRENT"
for h in $(echo "$ALLOWED_HOSTS_LIST" | tr ',' ' '); do
  echo "$FINAL" | grep -q "$h" || FINAL="${FINAL:+$FINAL,}$h"
done
FINAL=$(echo "$FINAL" | sed 's/^,\+//')
if grep -q '^ALLOWED_HOSTS=' "$ENV_FILE"; then
  sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$FINAL|" "$ENV_FILE"
else
  echo "ALLOWED_HOSTS=$FINAL" >> "$ENV_FILE"
fi

echo ""
echo "2. Generando configuración Nginx (dos server blocks)..."

# ¿Tenemos build del frontend POS?
HAS_POS_BUILD=0
[ -d "$FRONTEND_DIR/dist" ] && [ -f "$FRONTEND_DIR/dist/index.html" ] && HAS_POS_BUILD=1

# ¿Tenemos build de avila-web?
HAS_WEB_BUILD=0
[ -d "$AVILA_WEB_DIR/dist" ] && [ -f "$AVILA_WEB_DIR/dist/index.html" ] && HAS_WEB_BUILD=1
if [ "$HAS_WEB_BUILD" = "0" ] && [ -d "$AVILA_WEB_DIR" ]; then
  echo "   Build de avila-web no encontrado. Ejecutando npm run build..."
  (cd "$AVILA_WEB_DIR" && npm ci && npm run build) && HAS_WEB_BUILD=1
fi
if [ "$HAS_WEB_BUILD" = "0" ] && [ -d "$AVILA_WEB_DIR" ]; then
  echo "   [AVISO] No se pudo generar avila-web/dist. El bloque Web usará el mismo root hasta que hagas build."
fi

# Generar config Nginx: siempre bloque POS; bloque Web solo si hay build o carpeta
{
  echo "# POS (sistema): $DOMINIO_POS + www.$DOMINIO_POS"
  echo "server {"
  echo "    listen 80;"
  echo "    server_name $POS_SERVER_NAMES;"
  echo "    client_max_body_size 10M;"
  echo "    location /static/ { alias $BACKEND_DIR/staticfiles/; }"
  echo "    location /media/ { alias $BACKEND_DIR/media/; }"
  echo "    location /api/ {"
  echo "        proxy_pass http://unix:$SOCKET_PATH;"
  echo "        proxy_set_header Host \$host;"
  echo "        proxy_set_header X-Real-IP \$remote_addr;"
  echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
  echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
  echo "    }"
  echo "    location /admin/ {"
  echo "        proxy_pass http://unix:$SOCKET_PATH;"
  echo "        proxy_set_header Host \$host;"
  echo "        proxy_set_header X-Real-IP \$remote_addr;"
  echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
  echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
  echo "    }"
  echo "    location / {"
  echo "        root $FRONTEND_DIR/dist;"
  echo "        try_files \$uri \$uri/ /index.html;"
  echo "    }"
  echo "}"

  if [ "$HAS_WEB_BUILD" = "1" ]; then
    echo ""
    echo "# Web pública: $DOMINIO_WEB + www.$DOMINIO_WEB"
    echo "server {"
    echo "    listen 80;"
    echo "    server_name $WEB_SERVER_NAMES;"
    echo "    client_max_body_size 10M;"
    echo "    location /static/ { alias $BACKEND_DIR/staticfiles/; }"
    echo "    location /media/ { alias $BACKEND_DIR/media/; }"
    echo "    location /api/ {"
    echo "        proxy_pass http://unix:$SOCKET_PATH;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
    echo "    location /admin/ {"
    echo "        proxy_pass http://unix:$SOCKET_PATH;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "    }"
    echo "    location / {"
    echo "        root $AVILA_WEB_DIR/dist;"
    echo "        try_files \$uri \$uri/ /index.html;"
    echo "    }"
    echo "}"
  else
    echo ""
    echo "# Web pública: $DOMINIO_WEB (sin build de avila-web aún; agregar otro server block cuando exista dist)"
  fi
} > /etc/nginx/sites-available/avila

nginx -t && systemctl reload nginx
systemctl restart avila

echo ""
echo "3. Dominios configurados."
echo "   DNS necesarios (todos apuntando a la IP del servidor, ej. 138.219.42.174):"
echo "   - A  sistema.avilamotorepuesto.com.ar"
echo "   - A  www.sistema.avilamotorepuesto.com.ar"
echo "   - A  avilamotorepuesto.com.ar"
echo "   - A  www.avilamotorepuesto.com.ar"
echo ""
read -p "¿Configurar HTTPS con Let's Encrypt (certbot)? [s/N]: " CONFIGURAR_SSL
if [ "$CONFIGURAR_SSL" = "s" ] || [ "$CONFIGURAR_SSL" = "S" ]; then
  if ! command -v certbot &>/dev/null; then
    apt update && apt install -y certbot python3-certbot-nginx
  fi
  CERTBOT_DOMAINS="-d $DOMINIO_POS -d www.$DOMINIO_POS"
  [ "$HAS_WEB_BUILD" = "1" ] && CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d $DOMINIO_WEB -d www.$DOMINIO_WEB"
  certbot --nginx $CERTBOT_DOMAINS --non-interactive --agree-tos --register-unsafely-without-email || certbot --nginx $CERTBOT_DOMAINS
  echo "HTTPS configurado. POS: https://$DOMINIO_POS"
  [ "$HAS_WEB_BUILD" = "1" ] && echo "  Web: https://$DOMINIO_WEB"
else
  echo "Cuando el DNS esté activo: POS: http://$DOMINIO_POS"
  [ "$HAS_WEB_BUILD" = "1" ] && echo "  Web: http://$DOMINIO_WEB"
fi
echo ""
echo "=============================================="
