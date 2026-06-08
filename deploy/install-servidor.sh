#!/bin/bash
# ==============================================================
# install-servidor.sh — Instalación inicial en VPS Ubuntu Server LTS
# Ejecutar como root o con sudo
# Uso: sudo bash install-servidor.sh
# ==============================================================

set -euo pipefail

APP_DIR="/srv/avilapos"
APP_USER="avilapos"
PYTHON_VERSION="3.11"

echo "======================================================"
echo "  AvilaPOS — Instalación en servidor"
echo "======================================================"

# 1. Actualizar sistema
echo "[1/10] Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Instalar dependencias del sistema
echo "[2/10] Instalando dependencias del sistema..."
apt-get install -y -qq \
    nginx \
    postgresql postgresql-contrib \
    python${PYTHON_VERSION} python${PYTHON_VERSION}-venv python3-pip \
    git \
    certbot python3-certbot-nginx \
    curl \
    unzip \
    ufw \
    fail2ban

# Instalar Node.js 20 LTS via NodeSource
echo "[2b/10] Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node $(node -v), npm $(npm -v)"

# 3. Crear usuario del sistema para la aplicación
echo "[3/10] Creando usuario de sistema..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --shell /bin/bash --home "$APP_DIR" --create-home "$APP_USER"
fi

# 4. Configurar firewall
echo "[4/10] Configurando firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 5684/tcp   # SSH puerto no estándar del VPS Dattaweb
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Configurar PostgreSQL
echo "[5/10] Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Leer variables del .env si existe
if [ -f "$APP_DIR/backend/.env" ]; then
    source "$APP_DIR/backend/.env"
fi

DB_NAME="${DB_NAME:-avilapos}"
DB_USER="${DB_USER:-avilapos_user}"
DB_PASSWORD="${DB_PASSWORD:-CAMBIAR-ESTA-PASSWORD}"

sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# 6. Clonar o copiar el proyecto
echo "[6/10] Preparando directorio de aplicación..."
mkdir -p "$APP_DIR"

# Si el directorio está vacío, clonar desde GitHub
if [ -z "$(ls -A $APP_DIR 2>/dev/null)" ]; then
    echo "  Clonando repositorio desde GitHub..."
    git clone https://github.com/agustinavila290-commits/AvilaPos.git "$APP_DIR"
else
    echo "  Código ya presente en $APP_DIR, omitiendo clone."
fi

chown -R "$APP_USER:www-data" "$APP_DIR"
chmod -R 750 "$APP_DIR"

# 7. Crear entorno virtual Python e instalar dependencias
echo "[7/10] Instalando dependencias Python..."
sudo -u "$APP_USER" python${PYTHON_VERSION} -m venv "$APP_DIR/venv"
sudo -u "$APP_USER" "$APP_DIR/venv/bin/pip" install --upgrade pip -q
sudo -u "$APP_USER" "$APP_DIR/venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt" -q

# 8. Configurar permisos de carpetas de datos
echo "[8/10] Configurando permisos..."
mkdir -p "$APP_DIR/backend/media"
mkdir -p "$APP_DIR/backend/staticfiles"
mkdir -p "$APP_DIR/backend/logs"
mkdir -p "$APP_DIR/backups/db"
mkdir -p "$APP_DIR/backups/media"
mkdir -p /var/log/avilapos
chown -R "$APP_USER:www-data" "$APP_DIR/backend/media"
chown -R "$APP_USER:www-data" "$APP_DIR/backend/staticfiles"
chown -R "$APP_USER:www-data" "$APP_DIR/backend/logs"
chown -R "$APP_USER:www-data" "$APP_DIR/backups"
chmod -R 755 "$APP_DIR/backend/media"
chmod -R 755 "$APP_DIR/backend/staticfiles"

# 9. Configurar Nginx
echo "[9/10] Configurando Nginx..."
cp "$APP_DIR/deploy/nginx-avilamotorepuesto.conf" /etc/nginx/sites-available/avilamotorepuesto
ln -sf /etc/nginx/sites-available/avilamotorepuesto /etc/nginx/sites-enabled/avilamotorepuesto
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 10. Configurar systemd
echo "[10/10] Configurando servicio systemd..."
cp "$APP_DIR/deploy/avilapos.service" /etc/systemd/system/avilapos.service
systemctl daemon-reload
systemctl enable avilapos

# 11. Configurar cron para backups
echo "Configurando backup automático diario (2 AM)..."
(crontab -u "$APP_USER" -l 2>/dev/null; echo "0 2 * * * /srv/avilapos/deploy/backup.sh >> /var/log/avilapos/backup.log 2>&1") | crontab -u "$APP_USER" -
chmod +x "$APP_DIR/deploy/backup.sh"
chmod +x "$APP_DIR/deploy/restore.sh"
chmod +x "$APP_DIR/deploy/update.sh"

echo "======================================================"
echo "  Instalación base completada."
echo ""
echo "  PRÓXIMOS PASOS:"
echo "  1. Copiar backend/.env.production.example a backend/.env"
echo "     y completar con valores reales"
echo "  2. Ejecutar: sudo -u avilapos /srv/avilapos/deploy/update.sh"
echo "  3. Configurar SSL:"
echo "     certbot --nginx -d avilamotorepuesto.com.ar -d www.avilamotorepuesto.com.ar"
echo "     certbot --nginx -d pos.avilamotorepuesto.com.ar"
echo "  4. Iniciar servicio: sudo systemctl start avilapos"
echo "======================================================"
