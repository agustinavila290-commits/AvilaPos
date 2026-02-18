# 📦 Guía de Instalación - Casa de Repuestos

Esta guía te ayudará a configurar el proyecto desde cero en tu máquina local.

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.11 o superior** - [Descargar Python](https://www.python.org/downloads/)
- **Node.js 18 o superior** - [Descargar Node.js](https://nodejs.org/)
- **PostgreSQL 15 o superior** - [Descargar PostgreSQL](https://www.postgresql.org/download/)
  - Alternativa: Docker Desktop para usar Docker Compose
- **Git** - [Descargar Git](https://git-scm.com/)

### Verificar instalaciones

```bash
# Verificar Python
python --version  # Debe mostrar 3.11 o superior

# Verificar Node.js
node --version  # Debe mostrar 18.x o superior

# Verificar PostgreSQL
psql --version  # Debe mostrar 15.x o superior

# Verificar Git
git --version
```

---

## 🚀 Instalación Rápida

### Opción 1: Script Automático (Recomendado)

#### En Windows (PowerShell):
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup.ps1
```

#### En Linux/Mac:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

### Opción 2: Instalación Manual

#### Paso 1: Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd casa-repuestos
```

#### Paso 2: Configurar Backend

```bash
# Navegar a backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt
```

#### Paso 3: Configurar variables de entorno

```bash
# Volver a la raíz del proyecto
cd ..

# Copiar archivo de ejemplo
# En Windows:
copy .env.example .env
# En Linux/Mac:
cp .env.example .env

# Editar .env con tus credenciales
# Usa tu editor favorito (notepad, nano, vim, code, etc.)
```

#### Paso 4: Configurar Base de Datos

**Opción A: Usar Docker (Recomendado)**
```bash
# Iniciar PostgreSQL con Docker
docker-compose up -d db

# Verificar que esté corriendo
docker-compose ps
```

**Opción B: Usar PostgreSQL local**
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE casa_repuestos;

# Salir
\q
```

#### Paso 5: Aplicar migraciones

```bash
cd backend

# Activar entorno virtual si no está activo
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (admin)
python manage.py createsuperuser
# Sigue las instrucciones en pantalla
```

#### Paso 6: Configurar Frontend

```bash
# Navegar a frontend
cd ../frontend

# Instalar dependencias
npm install

# Volver a la raíz
cd ..
```

---

## ▶️ Ejecutar el Proyecto

Necesitarás **dos terminales** abiertas simultáneamente:

### Terminal 1: Backend
```bash
cd backend

# Activar entorno virtual
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Iniciar servidor
python manage.py runserver

# Deberías ver:
# Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: Frontend
```bash
cd frontend

# Iniciar servidor de desarrollo
npm run dev

# Deberías ver:
# VITE ready in XXX ms
# Local: http://localhost:5173/
```

---

## 🌐 Acceder a la Aplicación

Una vez que ambos servidores estén corriendo:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs (futuro)

---

## ✅ Verificar Instalación

### 1. Verificar Backend
```bash
# Abrir en navegador
http://localhost:8000/admin

# Deberías ver la página de login del admin de Django
# Usa las credenciales del superusuario que creaste
```

### 2. Verificar Frontend
```bash
# Abrir en navegador
http://localhost:5173

# Deberías ver la página principal del sistema
```

### 3. Verificar Base de Datos
```bash
# Conectar a PostgreSQL
# Con Docker:
docker exec -it casa_repuestos_db psql -U postgres -d casa_repuestos

# Sin Docker:
psql -U postgres -d casa_repuestos

# Listar tablas
\dt

# Deberías ver las tablas de Django (auth_user, etc.)
```

---

## 🐛 Solución de Problemas

### Error: "No module named 'django'"
```bash
# Asegúrate de tener el entorno virtual activado
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: "Port 8000 is already in use"
```bash
# Encontrar proceso usando el puerto
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

### Error: "Could not connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
# Con Docker:
docker-compose ps

# Sin Docker (Windows):
Get-Service postgresql*

# Sin Docker (Linux):
sudo systemctl status postgresql
```

### Error: "npm: command not found"
```bash
# Instalar Node.js desde https://nodejs.org/
# Después, cerrar y reabrir la terminal
```

### Error: Migraciones pendientes
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

## 🔄 Comandos Útiles

### Backend
```bash
# Crear nuevas migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell de Django
python manage.py shell

# Limpiar base de datos (CUIDADO!)
python manage.py flush

# Crear app nueva
python manage.py startapp nombre_app
```

### Frontend
```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Remover dependencia
npm uninstall nombre-paquete

# Limpiar node_modules
rm -rf node_modules
npm install

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Docker
```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar servicio específico
docker-compose restart db

# Entrar al contenedor de la BD
docker exec -it casa_repuestos_db bash
```

---

## 📚 Próximos Pasos

Una vez que la instalación esté completa:

1. ✅ **ETAPA 0 completada**: Setup inicial
2. ⏭️ **Próximo**: Implementar **MÓDULO 1 - Usuarios y Autenticación**

Consulta el `README.md` principal para ver el plan completo de desarrollo.

---

## 🆘 Ayuda Adicional

Si encuentras problemas durante la instalación:

1. Verifica que todos los requisitos previos estén instalados correctamente
2. Revisa que las variables de entorno en `.env` sean correctas
3. Consulta la sección de "Solución de Problemas" arriba
4. Revisa los logs en `backend/logs/django.log`

---

**¡Listo! Ahora puedes empezar a desarrollar el sistema.** 🎉
