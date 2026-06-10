#!/bin/bash
# Agrega location /admin/ al Nginx para que el admin de Django cargue.
# Ejecutar como root en el servidor: bash agregar_admin_nginx.sh
# Si ya existe location /admin/, no hace nada.

set -e
CONF="/etc/nginx/sites-available/avila"

if [ ! -f "$CONF" ]; then
  echo "No existe $CONF. ¿Ejecutaste antes configurar_dominio.sh?"
  exit 1
fi

if grep -q "location /admin/" "$CONF"; then
  echo "location /admin/ ya existe en la config. Nada que hacer."
  nginx -t && systemctl reload nginx
  exit 0
fi

# Extraer la ruta del socket del bloque location /api/
SOCKET=$(grep -A 5 "location /api/" "$CONF" | grep "proxy_pass" | head -1 | sed 's/.*unix:\([^;]*\).*/\1/' | tr -d ' ')
if [ -z "$SOCKET" ]; then
  echo "No se pudo detectar la ruta del socket en $CONF"
  exit 1
fi

echo "Socket detectado: $SOCKET"
echo "Insertando location /admin/..."

# Respaldo
cp "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"

# Insertar bloque /admin/ antes de la primera "location / {" que tenga try_files
# (sirve para el primer server block; si hay dos server blocks, el segundo ya tendrá /admin/ al reejecutar configurar_dominio)
awk -v sock="$SOCKET" '
  /^[[:space:]]*location \/ \{[[:space:]]*$/ && !inserted {
    print "    location /admin/ {"
    print "        proxy_pass http://unix:" sock ";"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "    }"
    print ""
    inserted = 1
  }
  { print }
' "$CONF" > "${CONF}.tmp" && mv "${CONF}.tmp" "$CONF"

nginx -t && systemctl reload nginx
echo "Listo. Probá https://sistema.avilamotorepuesto.com.ar/admin/"
