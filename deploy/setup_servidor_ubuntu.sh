#!/bin/bash
# Setup servidor Ubuntu 24.04 - Django (Avila POS) + PostgreSQL + Nginx
# Ejecutar como root: bash setup_servidor_ubuntu.sh
# Requiere: haber clonado el repo en /var/www/AvilaPos (o editar APP_DIR más abajo)

set -e
APP_DIR="${APP_DIR:-/var/www/AvilaPos}"
BACKEND_DIR="$APP_DIR/backend"
SOCKET_PATH="$BACKEND_DIR/gunicorn.sock"

echo "=============================================="
echo "  Setup Avila POS - Ubuntu 24.04"
echo "  Directorio app: $APP_DIR"
echo "=============================================="

# --- Datos que el usuario debe ingresar ---
read -p "Contraseña para usuario PostgreSQL 'avila': " DB_PASS
read -p "SECRET_KEY para Django (o Enter para generar una): " SECRET_KEY_IN
read -p "ALLOWED_HOSTS (IP/dominio, ej: 138.219.42.174,vps.dattaweb.com): " ALLOWED_HOSTS

if [ -z "$SECRET_KEY_IN" ]; then
  SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 50)
else
  SECRET_KEY="$SECRET_KEY_IN"
fi

echo ""
echo "1. Actualizando sistema..."
apt update && apt upgrade -y

echo ""
echo "2. Instalando Python, PostgreSQL, Nginx, Git..."
apt install -y python3.12 python3.12-venv python3-pip build-essential libpq-dev pkg-config \
  postgresql postgresql-contrib nginx git

systemctl enable postgresql
systemctl start postgresql
systemctl enable nginx

echo ""
echo "3. Creando base de datos y usuario PostgreSQL..."
sudo -u postgres psql -c "CREATE USER avila WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "DROP DATABASE IF EXISTS casa_repuestos;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE casa_repuestos OWNER avila;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE casa_repuestos TO avila;"
sudo -u postgres psql -c "ALTER DATABASE casa_repuestos SET timezone TO 'America/Argentina/Buenos_Aires';"

echo ""
echo "4. Clonando repo (si no existe)..."
if [ ! -d "$APP_DIR" ]; then
  mkdir -p /var/www
  git clone https://github.com/agustinavila290-commits/AvilaPos.git "$APP_DIR"
else
  echo "   Ya existe $APP_DIR, omitiendo clone."
fi

echo ""
echo "5. Entorno virtual e dependencias..."
cd "$BACKEND_DIR"
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn "psycopg[binary]"

echo ""
echo "6. Creando .env (raíz del repo para que Django lo cargue)..."
cat > "$APP_DIR/.env" << EOF
SECRET_KEY=$SECRET_KEY
DEBUG=False
USE_SQLITE=False
DB_NAME=casa_repuestos
DB_USER=avila
DB_PASSWORD=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=$ALLOWED_HOSTS
EOF

echo ""
echo "7. Migraciones..."
cd "$BACKEND_DIR"
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

echo ""
echo "8. Crear superusuario (ingresa usuario, email y contraseña cuando pida)..."
python manage.py createsuperuser

echo ""
echo "9. Servicio systemd para Gunicorn..."
cat > /etc/systemd/system/avila.service << EOF
[Unit]
Description=Gunicorn Avila Django
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --workers 2 --bind unix:$SOCKET_PATH backend.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable avila
systemctl start avila

echo ""
echo "10. Configurando Nginx..."
SERVER_NAMES="${ALLOWED_HOSTS//,/ }"
cat > /etc/nginx/sites-available/avila << EOF
server {
    listen 80;
    server_name $SERVER_NAMES;
    client_max_body_size 10M;

    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
    }

    location /media/ {
        alias $BACKEND_DIR/media/;
    }

    location / {
        proxy_pass http://unix:$SOCKET_PATH;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/avila /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "11. Firewall (puertos 80 y SSH)..."
ufw allow 80
ufw allow OpenSSH
echo "y" | ufw enable 2>/dev/null || true

echo ""
echo "=============================================="
echo "  Setup completado."
echo "  API: http://$(curl -s ifconfig.me 2>/dev/null || echo 'TU_IP')/api/"
echo "  Admin: http://TU_IP/admin/"
echo "  Guarda SECRET_KEY y DB password en lugar seguro."
echo "=============================================="
