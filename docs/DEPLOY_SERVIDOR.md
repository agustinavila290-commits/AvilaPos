# Despliegue del backend en servidor Ubuntu (DonWeb/Dattaweb)

Backend Django + PostgreSQL + Nginx en Ubuntu 24.04 usando un único script de setup.

## Requisitos

- Servidor Ubuntu 24.04 (ej. instalación mínima).
- Acceso root por SSH (ej. `ssh -p 5469 root@138.219.42.174`).

## Uso del script

1. **Copiar el script al servidor** (desde tu PC, en PowerShell o CMD):

   ```bash
   scp -P 5469 scripts/setup_servidor_ubuntu.sh root@138.219.42.174:/root/
   ```

2. **Conectarte por SSH y ejecutarlo**:

   ```bash
   ssh -p 5469 root@138.219.42.174
   chmod +x /root/setup_servidor_ubuntu.sh
   ./setup_servidor_ubuntu.sh
   ```

3. **Cuando el script pida**:
   - **Contraseña PostgreSQL**: elegir una segura para el usuario `avila`.
   - **SECRET_KEY**: generar una (por ejemplo con [djecrety](https://djecrety.ir/)) o dejar Enter para que se genere sola.
   - **ALLOWED_HOSTS**: IP del servidor y/o dominio, separados por coma (ej. `138.219.42.174,vps.dattaweb.com`).
   - Al final, **createsuperuser**: usuario, email y contraseña del admin Django.

4. **Guardar** la SECRET_KEY y la contraseña de PostgreSQL en un lugar seguro.

## Qué hace el script

- Actualiza el sistema e instala Python 3.12, PostgreSQL, Nginx, Git.
- Crea la base `casa_repuestos` y el usuario `avila`.
- Clona el repo en `/var/www/AvilaPos` (si no existe).
- Crea venv, instala dependencias, genera `.env` en la raíz del repo.
- Ejecuta migraciones y `collectstatic`.
- Crea el servicio systemd `avila` (Gunicorn) y configura Nginx como reverse proxy.
- Habilita UFW (puertos 80 y SSH).

## Levantar el frontend en el mismo servidor

Para servir la app React (POS) desde el mismo servidor (misma IP, sin CORS):

1. **Copiar el script** (desde tu PC, en la carpeta del proyecto):
   ```bash
   scp -P 5469 scripts/setup_frontend_servidor.sh root@138.219.42.174:/root/
   ```

2. **En el servidor** (si lo copiaste desde Windows, corregir saltos de línea y ejecutar):
   ```bash
   sed -i 's/\r$//' /root/setup_frontend_servidor.sh
   bash /root/setup_frontend_servidor.sh
   ```

   Si el repo está en `/root/AvilaPos` en lugar de `/var/www/AvilaPos`:
   ```bash
   APP_DIR=/root/AvilaPos bash /root/setup_frontend_servidor.sh
   ```

El script instala Node.js 20, hace `npm ci` y `npm run build` en `frontend/` (con `VITE_API_URL=/api`), y actualiza Nginx para servir la app en `/` y la API en `/api/`. Después de ejecutarlo, la app se abre en `http://TU_IP/`.

## Configurar dominios (POS y Web)

Se usan **dos dominios** en el mismo servidor:

- **POS (sistema):** `sistema.avilamotorepuesto.com.ar` y `www.sistema.avilamotorepuesto.com.ar` → app React (POS) + API.
- **Web pública:** `avilamotorepuesto.com.ar` y `www.avilamotorepuesto.com.ar` → sitio avila-web (landing, contacto, etc.).

### 1. DNS en tu proveedor del dominio

En el panel del dominio **avilamotorepuesto.com.ar**, creá estos registros apuntando a la IP del servidor (ej. **138.219.42.174**):

| Tipo | Nombre / Host | Valor / Apunta a |
|------|----------------|------------------|
| **A** | `@` (o vacío) | `138.219.42.174` |
| **A** | `www` | `138.219.42.174` |
| **A** | `sistema` | `138.219.42.174` |
| **A** | `www.sistema` | `138.219.42.174` |

(O, según el panel: subdominio `sistema` y `www.sistema` apuntando a la misma IP.) La propagación puede tardar unos minutos u horas.

### 2. Script en el servidor

Copiá el script al servidor y ejecutalo (corregir CRLF si lo copiaste desde Windows):

```bash
# Desde tu PC
scp -P 5469 scripts/configurar_dominio.sh root@138.219.42.174:/root/

# En el servidor
sed -i 's/\r$//' /root/configurar_dominio.sh
bash /root/configurar_dominio.sh
```

Si el repo está en `/root/AvilaPos`:

```bash
APP_DIR=/root/AvilaPos bash /root/configurar_dominio.sh
```

El script usa por defecto:
- **DOMINIO_POS** = `sistema.avilamotorepuesto.com.ar`
- **DOMINIO_WEB** = `avilamotorepuesto.com.ar`

Actualiza **ALLOWED_HOSTS** en el `.env` con los cuatro hosts, genera **dos server blocks** en Nginx (uno para POS, uno para la web), y si existe `avila-web` en el repo hace `npm run build` para la web. Al final puede configurar **HTTPS con Let's Encrypt** para los cuatro dominios.

Cuando el DNS esté activo:
- **POS:** `http://sistema.avilamotorepuesto.com.ar` (o con www)
- **Web:** `http://www.avilamotorepuesto.com.ar`

## Después del deploy

- **POS (sistema):** `https://sistema.avilamotorepuesto.com.ar` o `https://www.sistema.avilamotorepuesto.com.ar`
- **Web pública:** `https://www.avilamotorepuesto.com.ar` o `https://avilamotorepuesto.com.ar`
- **API (misma en ambos):** `https://sistema.avilamotorepuesto.com.ar/api/` (o desde el dominio que uses)
- **Admin Django:** `https://sistema.avilamotorepuesto.com.ar/admin/`

## Directorio por defecto

El script usa `/var/www/AvilaPos`. Para otro directorio:

```bash
APP_DIR=/ruta/alternativa ./setup_servidor_ubuntu.sh
```

## Actualizar solo el frontend

Después de hacer cambios en el frontend y `git push`, en el servidor ejecutá:

```bash
cd /var/www/AvilaPos
sed -i 's/\r$//' scripts/actualizar_frontend.sh   # solo si copiaste desde Windows
bash scripts/actualizar_frontend.sh
```

Si el repo está en `/root/AvilaPos`: `APP_DIR=/root/AvilaPos bash scripts/actualizar_frontend.sh`

El script hace `git pull` y `npm run build` en `frontend/`. No hace falta reiniciar el backend.

## Comandos útiles en el servidor

```bash
sudo systemctl status avila    # estado Gunicorn
sudo systemctl restart avila   # reiniciar backend
sudo systemctl status nginx    # estado Nginx
sudo tail -f /var/log/nginx/error.log
cd /var/www/AvilaPos/backend && source venv/bin/activate && python manage.py createsuperuser  # otro admin
```
