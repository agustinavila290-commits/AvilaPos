# AvilaPOS — Guía de Deploy a Producción

**Dominio:** avilamotorepuesto.com.ar  
**Stack:** Django 5 + Gunicorn + Nginx + PostgreSQL + React (Vite)

## Datos del servidor (VPS Dattaweb)

| Campo      | Valor                        |
|------------|------------------------------|
| IP         | 168.197.49.221               |
| Host       | vps-6056687-x.dattaweb.com   |
| Usuario    | root                         |
| Puerto SSH | 5684                         |

```bash
# Conexión SSH desde Windows:
ssh -p 5684 root@168.197.49.221
```

---

## Arquitectura final

```
Internet
   │
   ├── avilamotorepuesto.com.ar ──────── Nginx ──→ avila-web/dist/  (React estático)
   │       └── /api/ ─────────────────────────────→ Gunicorn:8000   (Django)
   │
   └── pos.avilamotorepuesto.com.ar ─── Nginx ──→ frontend/dist/   (React estático POS)
           ├── /api/ ──────────────────────────────→ Gunicorn:8000  (Django)
           └── /admin/ ────────────────────────────→ Gunicorn:8000  (Django)
```

---

## Servidor recomendado

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| vCPU    | 2      | 2           |
| RAM     | 4 GB   | 8 GB        |
| Disco   | 50 GB  | 100 GB NVMe |
| OS      | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

---

## PASO 1 — Preparar el servidor

```bash
# Como root en el servidor Ubuntu:
sudo bash /srv/avilapos/deploy/install-servidor.sh
```

Este script:
- Instala Nginx, PostgreSQL, Python 3.11, Certbot, UFW, fail2ban
- Crea usuario `avilapos` del sistema
- Configura el firewall (puertos 22, 80, 443)
- Crea la base de datos y usuario PostgreSQL
- Configura Nginx, systemd, cron de backups

---

## PASO 2 — Subir el código al servidor

El código se clona automáticamente desde GitHub durante la instalación.
Solo hay que asegurarse de que los últimos cambios estén pusheados antes de instalar.

```powershell
# Desde Windows, en el proyecto:
git add -A
git commit -m "deploy: preparación para producción"
git push origin main
```

Si el repositorio es privado y el servidor no tiene acceso, crear un Personal Access Token
en GitHub → Settings → Developer settings → Personal access tokens, y usar:
```bash
git clone https://TU_TOKEN@github.com/agustinavila290-commits/AvilaPos.git /srv/avilapos
```

---

## PASO 3 — Configurar variables de entorno

```bash
# En el servidor:
cp /srv/avilapos/backend/.env.production.example /srv/avilapos/backend/.env
nano /srv/avilapos/backend/.env
```

Completar obligatoriamente:
- `SECRET_KEY` — generar con: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- `DB_PASSWORD` — contraseña fuerte para PostgreSQL
- `DB_USER`, `DB_NAME` — deben coincidir con los creados en PostgreSQL

---

## PASO 4 — Primera instalación de la aplicación

```bash
# Como usuario avilapos:
sudo -u avilapos /srv/avilapos/deploy/update.sh
```

Este script:
1. Instala dependencias Python (requirements.txt)
2. Aplica migraciones de base de datos
3. Ejecuta collectstatic
4. Compila avila-web (tienda pública)
5. Compila frontend POS
6. Reinicia Gunicorn y Nginx

---

## PASO 5 — Crear superusuario Django

```bash
sudo -u avilapos /srv/avilapos/venv/bin/python /srv/avilapos/backend/manage.py createsuperuser
```

---

## PASO 6 — Migrar datos desde SQLite (si ya hay datos de desarrollo)

```bash
# SOLO si querés importar datos del SQLite local al PostgreSQL del servidor:
sudo -u avilapos bash /srv/avilapos/deploy/migrate-sqlite-to-postgres.sh
```

---

## PASO 7 — Configurar HTTPS (Let's Encrypt)

```bash
# Web pública (avilamotorepuesto.com.ar y www):
sudo certbot --nginx \
    -d avilamotorepuesto.com.ar \
    -d www.avilamotorepuesto.com.ar \
    --email agustinavila290@gmail.com \
    --agree-tos \
    --non-interactive

# POS privado:
sudo certbot --nginx \
    -d pos.avilamotorepuesto.com.ar \
    --email agustinavila290@gmail.com \
    --agree-tos \
    --non-interactive
```

Certbot renueva automáticamente (cronjob incluido). Verificar renovación:
```bash
sudo certbot renew --dry-run
```

---

## PASO 8 — Iniciar el servicio

```bash
sudo systemctl start avilapos
sudo systemctl status avilapos
```

---

## PASO 9 — Verificar que todo funciona

```bash
# 1. Django responde
curl -s http://127.0.0.1:8000/api/tienda/categorias/ | head -50

# 2. Nginx sirve la tienda web
curl -sk https://avilamotorepuesto.com.ar | grep -i "avila"

# 3. POS requiere login
curl -sk https://pos.avilamotorepuesto.com.ar/ | head -10

# 4. HTTPS activo
curl -I https://avilamotorepuesto.com.ar 2>/dev/null | grep -i "HTTP\|strict"

# 5. robots.txt del POS bloquea indexación
curl -sk https://pos.avilamotorepuesto.com.ar/robots.txt

# 6. DEBUG=False (no debe mostrar traceback)
curl -sk https://pos.avilamotorepuesto.com.ar/api/no-existe/ | python3 -m json.tool
```

---

## Comandos del servicio Gunicorn

```bash
# Estado
sudo systemctl status avilapos

# Iniciar
sudo systemctl start avilapos

# Detener
sudo systemctl stop avilapos

# Reiniciar
sudo systemctl restart avilapos

# Logs en tiempo real
sudo journalctl -u avilapos -f

# Logs de acceso Gunicorn
tail -f /srv/avilapos/backend/logs/gunicorn-access.log

# Logs de error Gunicorn
tail -f /srv/avilapos/backend/logs/gunicorn-error.log

# Logs de error Django
tail -f /srv/avilapos/backend/logs/django.log

# Logs de Nginx
sudo tail -f /var/log/nginx/avila-web-error.log
sudo tail -f /var/log/nginx/pos-error.log
```

---

## Actualizar el sistema

```bash
# Actualizar código y reiniciar (si usás git):
sudo -u avilapos /srv/avilapos/deploy/update.sh --git

# Actualizar solo la app (sin git pull):
sudo -u avilapos /srv/avilapos/deploy/update.sh
```

---

## Backups

**Backup manual:**
```bash
sudo -u avilapos /srv/avilapos/deploy/backup.sh
```

**Backups automáticos:** ya configurados en cron (cada día a las 2 AM).

**Ver backups disponibles:**
```bash
ls -lh /srv/avilapos/backups/db/
ls -lh /srv/avilapos/backups/media/
```

**Restaurar backup:**
```bash
sudo -u avilapos /srv/avilapos/deploy/restore.sh \
    /srv/avilapos/backups/db/avilapos_2026-06-08_02-00-00.sql.gz \
    /srv/avilapos/backups/media/media_2026-06-08_02-00-00.tar.gz
```

---

## Archivos modificados en esta fase

| Archivo | Cambio |
|---------|--------|
| `backend/backend/settings.py` | WhiteNoiseMiddleware, CORS producción, security headers, STATIC_URL con `/` |
| `frontend/package.json` | Nuevo script `build:web` con `--base /` |
| `avila-web/.env.production` | VITE_API_URL vacío (usa ruta relativa) |
| `backend/.env.production.example` | Template completo de variables de entorno |
| `.gitignore` | Protección de certificados, backups, .env.production |
| `deploy/nginx-avilamotorepuesto.conf` | Config Nginx completa |
| `deploy/avilapos.service` | Servicio systemd para Gunicorn |
| `deploy/backup.sh` | Script backup automático |
| `deploy/restore.sh` | Script restauración de backup |
| `deploy/install-servidor.sh` | Instalación inicial en VPS |
| `deploy/update.sh` | Actualización incremental del sistema |
| `deploy/migrate-sqlite-to-postgres.sh` | Migración SQLite → PostgreSQL |

---

## Pruebas mínimas post-deploy

- [ ] `https://pos.avilamotorepuesto.com.ar` abre el POS
- [ ] Login del POS funciona (usuario: admin)
- [ ] `https://avilamotorepuesto.com.ar` abre la tienda web
- [ ] Catálogo carga productos
- [ ] Imágenes/media se cargan correctamente
- [ ] HTTPS activo en ambos dominios
- [ ] HTTP redirige a HTTPS
- [ ] `https://pos.avilamotorepuesto.com.ar/robots.txt` devuelve `Disallow: /`
- [ ] Acceso directo a `/admin/` sin login redirige al login
- [ ] DEBUG=False (no hay traceback en errores 500)
- [ ] Logs funcionando (`/srv/avilapos/backend/logs/`)
- [ ] Backup se ejecuta sin errores

---

## Seguridad — No exponer

- `/srv/avilapos/backend/.env` — variables de entorno
- `/srv/avilapos/backend/certs/` — certificados AFIP
- `/srv/avilapos/backups/` — backups de base de datos
- `/srv/avilapos/backend/db.sqlite3` — solo en dev, no existe en prod

---

## DNS — Configuración requerida en el registrar

Antes del deploy, configurar en el panel DNS de tu registrar (donde compraste el dominio):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A    | `@`    | IP del VPS |
| A    | `www`  | IP del VPS |
| A    | `pos`  | IP del VPS |

Propagar DNS tarda entre 5 minutos y 48 horas.
