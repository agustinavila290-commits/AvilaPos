# 🚀 Guía de Migración a Otra PC

**Cómo transportar el sistema de Casa de Repuestos desde tu PC de desarrollo a la PC del negocio**

---

## 📋 Índice

1. [Preparación en PC de Casa](#1-preparación-en-pc-de-casa)
2. [Métodos de Transporte](#2-métodos-de-transporte)
3. [Instalación en PC del Negocio](#3-instalación-en-pc-del-negocio)
4. [Configuración Final](#4-configuración-final)
5. [Migración de Base de Datos](#5-migración-de-base-de-datos)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Preparación en PC de Casa

### Opción A: Exportar Todo el Proyecto ⭐ (RECOMENDADO)

#### Paso 1: Crear Backup de la Base de Datos

```bash
# Abrir PowerShell en: C:\Users\Agustin\Avila\backend
cd C:\Users\Agustin\Avila\backend
.\venv\Scripts\activate
python manage.py backup_database
```

**Resultado**: Se crea archivo en `backend/backups/backup_YYYYMMDD_HHMMSS.sql`

#### Paso 2: Crear archivo de exportación

Crear carpeta temporal para exportar:

```powershell
# En C:\Users\Agustin\Avila
New-Item -Path "C:\CasaRepuestos_Export" -ItemType Directory -Force
```

#### Paso 3: Copiar archivos necesarios

```powershell
# Copiar proyecto (SIN venv y node_modules)
Copy-Item -Path "C:\Users\Agustin\Avila\*" -Destination "C:\CasaRepuestos_Export\" -Recurse -Exclude "venv","node_modules",".git","__pycache__","*.pyc","dist","build"
```

**Archivos que se copian:**
```
C:\CasaRepuestos_Export\
├── backend/
│   ├── apps/
│   ├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env (⚠️ IMPORTANTE)
│   └── backups/ (con el backup)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── scripts/
├── README.md
├── INSTALL.md
└── todos los .md
```

#### Paso 4: Verificar tamaño

```powershell
# Ver tamaño de la carpeta (debería ser ~50-100 MB sin venv/node_modules)
Get-ChildItem -Path "C:\CasaRepuestos_Export" -Recurse | Measure-Object -Property Length -Sum
```

---

### Opción B: Usar Git (Si tenés repositorio) 🔧

Si ya usás Git:

```bash
# Hacer commit de todos los cambios
git add .
git commit -m "Sistema completo con Módulo F"
git push origin main

# En la PC del negocio solo hacer:
git clone [url-del-repositorio]
```

**Ventaja**: Más fácil para futuras actualizaciones  
**Desventaja**: Necesitás cuenta GitHub/GitLab

---

## 2. Métodos de Transporte

### Método 1: USB/Pendrive ⭐ (MÁS SIMPLE)

1. **Comprimir la carpeta**:
   ```powershell
   # Crear ZIP
   Compress-Archive -Path "C:\CasaRepuestos_Export\*" -DestinationPath "C:\CasaRepuestos.zip"
   ```

2. **Copiar a USB**: 
   - Archivo `CasaRepuestos.zip` (~50-100 MB)
   
3. **Llevar al negocio**: 
   - Conectar USB en PC del negocio
   - Copiar archivo

### Método 2: Red Local / Carpeta Compartida

Si ambas PCs están en la misma red:

1. **Compartir carpeta en PC de casa**:
   - Click derecho en `C:\CasaRepuestos_Export`
   - Propiedades → Compartir → Compartir...
   - Agregar "Todos" con permisos de lectura

2. **Acceder desde PC del negocio**:
   ```
   \\[IP-PC-CASA]\CasaRepuestos_Export
   ```

### Método 3: Google Drive / OneDrive ☁️

1. Subir `CasaRepuestos.zip` a la nube
2. Descargar en PC del negocio
3. Descomprimir

### Método 4: Cable Ethernet Directo

Si tenés cable de red:
- Conectar ambas PCs directamente
- Configurar IPs manuales
- Transferir archivos

---

## 3. Instalación en PC del Negocio

### Requisitos Previos en PC del Negocio

Instalar todo lo necesario (si no está instalado):

#### 3.1. Python 3.13

1. Descargar: https://www.python.org/downloads/
2. Instalar marcando **"Add Python to PATH"**
3. Verificar:
   ```powershell
   python --version
   # Debe mostrar: Python 3.13.x
   ```

#### 3.2. Node.js

1. Descargar: https://nodejs.org/ (versión LTS)
2. Instalar (siguiente, siguiente...)
3. Verificar:
   ```powershell
   node --version
   npm --version
   ```

#### 3.3. PostgreSQL

1. Descargar: https://www.postgresql.org/download/windows/
2. Instalar (anotar contraseña de postgres)
3. Verificar:
   ```powershell
   psql --version
   ```

**IMPORTANTE**: Anotar la contraseña que pongas para el usuario `postgres`

---

### Pasos de Instalación

#### Paso 1: Descomprimir proyecto

```powershell
# Si trajiste ZIP
Expand-Archive -Path "C:\Users\[Usuario]\Desktop\CasaRepuestos.zip" -DestinationPath "C:\CasaRepuestos"

# Navegar
cd C:\CasaRepuestos
```

#### Paso 2: Crear base de datos PostgreSQL

```powershell
# Abrir psql (pedirá contraseña de postgres)
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE casarepuestos;
CREATE USER casarepuestos_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE casarepuestos TO casarepuestos_user;
\q
```

#### Paso 3: Configurar Backend

```powershell
cd C:\CasaRepuestos\backend

# Crear entorno virtual
python -m venv venv

# Activar
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

**⏱️ Tiempo**: ~5-10 minutos

#### Paso 4: Configurar archivo .env

Editar `backend/.env` con los datos de la PC del negocio:

```env
# Base de datos
DB_NAME=casarepuestos
DB_USER=casarepuestos_user
DB_PASSWORD=tu_password_segura  # ⚠️ La que pusiste arriba
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True  # Cambiar a False en producción

# URLs permitidos
ALLOWED_HOSTS=localhost,127.0.0.1,[IP-PC-NEGOCIO]
```

#### Paso 5: Restaurar Base de Datos

```powershell
# Opción A: Restaurar backup (si trajiste datos)
cd C:\CasaRepuestos\backend
.\venv\Scripts\activate

# Encontrar el archivo de backup
dir backups\

# Restaurar (reemplazar nombre del archivo)
$env:PGPASSWORD="tu_password_segura"
pg_restore -h localhost -p 5432 -U casarepuestos_user -d casarepuestos -c backups\backup_YYYYMMDD_HHMMSS.sql
```

O

```powershell
# Opción B: Crear base de datos nueva (sin datos)
python manage.py migrate
python manage.py createsuperuser
# Crear usuario admin cuando pida
```

#### Paso 6: Instalar Frontend

```powershell
# Abrir NUEVA ventana PowerShell
cd C:\CasaRepuestos\frontend

# Instalar dependencias
npm install
```

**⏱️ Tiempo**: ~10-15 minutos

---

## 4. Configuración Final

### Actualizar IP del Frontend

Editar `frontend/src/services/api.js`:

```javascript
// Si backend está en la misma PC:
baseURL: 'http://localhost:8000'

// Si backend está en otra PC de la red:
baseURL: 'http://[IP-PC-BACKEND]:8000'
```

### Configurar Firewall (Para acceso desde otras PCs)

```powershell
# Permitir puerto 8000 (Django)
New-NetFirewallRule -DisplayName "Django Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow

# Permitir puerto 5173 (Vite)
New-NetFirewallRule -DisplayName "Vite Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

---

## 5. Iniciar el Sistema

### Opción A: Usar Scripts Automáticos

```powershell
# Si trajiste los scripts
cd C:\CasaRepuestos
.\iniciar_sistema.bat
```

### Opción B: Iniciar Manualmente

**Terminal 1 - Backend:**
```powershell
cd C:\CasaRepuestos\backend
.\venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd C:\CasaRepuestos\frontend
npm run dev
```

**Acceder**: http://localhost:5173

---

## 6. Migración de Base de Datos

### Si querés traer TODOS los datos (clientes, productos, ventas)

#### En PC de Casa:

```powershell
cd C:\Users\Agustin\Avila\backend
.\venv\Scripts\activate

# Crear backup completo
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > datos_completos.json
```

#### En PC del Negocio:

```powershell
cd C:\CasaRepuestos\backend
.\venv\Scripts\activate

# Importar datos
python manage.py loaddata datos_completos.json
```

---

## 7. Verificación Post-Instalación

### Checklist de Verificación

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Puedo hacer login
- [ ] Aparecen los datos migrados (si corresponde)
- [ ] Puedo crear una venta de prueba
- [ ] El sistema es accesible desde otras PCs de la red (si aplica)

### Comandos de Verificación

```powershell
# Verificar base de datos
psql -U casarepuestos_user -d casarepuestos
\dt  # Ver tablas
\q

# Verificar migraciones
cd C:\CasaRepuestos\backend
.\venv\Scripts\activate
python manage.py showmigrations
```

---

## 8. Troubleshooting

### Problema: "pg_restore: error"

**Solución**: Verificar que la contraseña de PostgreSQL sea correcta

```powershell
$env:PGPASSWORD="tu_password_aqui"
# Reintentar
```

### Problema: "Module not found"

**Solución**: Reinstalar dependencias

```powershell
# Backend
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend
rm -r node_modules
npm install
```

### Problema: "Port already in use"

**Solución**: Cambiar puertos o matar proceso

```powershell
# Ver qué está usando el puerto 8000
netstat -ano | findstr :8000

# Matar proceso (reemplazar PID)
taskkill /PID [numero] /F
```

### Problema: No puedo acceder desde otra PC

**Solución**: 
1. Verificar firewall (ver sección 4)
2. Usar IP local en vez de localhost
3. Agregar IP a ALLOWED_HOSTS en .env

---

## 9. Configuración para Producción (PC del Negocio)

### Cambios Recomendados en .env

```env
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,[IP-PC-NEGOCIO],casa-repuestos.local

# Cambiar SECRET_KEY por una nueva
SECRET_KEY=nueva-clave-super-secreta-diferente-123456
```

### Iniciar Automáticamente al Encender PC

#### Opción 1: Crear Acceso Directo en Inicio

1. Crear archivo `iniciar_sistema.bat` en `C:\CasaRepuestos\`
2. Click derecho → Crear acceso directo
3. Mover acceso directo a:
   ```
   C:\Users\[Usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
   ```

#### Opción 2: Servicio de Windows (Avanzado)

Usar `NSSM` (Non-Sucking Service Manager) para crear servicios:
- Descargar: https://nssm.cc/download
- Crear servicio para backend
- Crear servicio para frontend

---

## 10. Actualizaciones Futuras

### Cuando hagas cambios en PC de Casa

1. **Exportar solo cambios**:
   ```powershell
   # Backup de DB actualizada
   cd backend
   .\venv\Scripts\activate
   python manage.py backup_database
   
   # Copiar archivos modificados
   ```

2. **Llevar al negocio**:
   - USB con backup nuevo
   - Archivos .py modificados

3. **En PC del negocio**:
   ```powershell
   # Actualizar código
   # Restaurar backup si hay cambios de DB
   # Reiniciar sistema
   ```

---

## 📦 Resumen Rápido

### Preparación (PC Casa)
1. ✅ Crear backup: `python manage.py backup_database`
2. ✅ Copiar proyecto (sin venv/node_modules)
3. ✅ Comprimir: `Compress-Archive`
4. ✅ Llevar en USB al negocio

### Instalación (PC Negocio)
1. ✅ Instalar Python, Node.js, PostgreSQL
2. ✅ Descomprimir proyecto
3. ✅ Crear base de datos PostgreSQL
4. ✅ Configurar .env
5. ✅ `pip install -r requirements.txt`
6. ✅ Restaurar backup o `migrate`
7. ✅ `npm install`
8. ✅ Iniciar sistema

### Tiempo Total Estimado
- **Con experiencia**: 30-45 minutos
- **Primera vez**: 1-2 horas
- **Problemas**: +30 minutos

---

## 💡 Recomendaciones

### ✅ HACER
- ✅ Probar TODO en PC del negocio antes de usar en producción
- ✅ Hacer backup antes de cualquier cambio importante
- ✅ Anotar todas las contraseñas en lugar seguro
- ✅ Documentar configuración específica de la PC del negocio

### ❌ NO HACER
- ❌ Copiar carpetas venv o node_modules (ocupan mucho espacio)
- ❌ Compartir .env en repositorio público
- ❌ Usar contraseñas débiles en producción
- ❌ Olvidar hacer backup antes de migrar

---

## 📞 Contactos Útiles

- **Python**: https://www.python.org/
- **Node.js**: https://nodejs.org/
- **PostgreSQL**: https://www.postgresql.org/
- **Documentación Django**: https://docs.djangoproject.com/

---

**Última actualización**: 11/02/2026  
**Versión del sistema**: Completo con Módulo F

**¿Dudas?** Revisar sección de Troubleshooting o documentación adicional.
