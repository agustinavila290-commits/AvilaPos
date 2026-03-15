# Guía: Ejecutar Sistema POS y Web en Windows Server 2016

Este documento describe cómo instalar y ejecutar el **Sistema POS** (backend Django + frontend React) y opcionalmente el **sitio público avila-web** en un servidor Windows Server 2016.

---

## Resumen

| Componente | Puerto | URL local | Descripción |
|------------|--------|-----------|-------------|
| **Backend (API Django)** | 8000 | http://localhost:8000 | API REST del sistema |
| **Frontend (POS React)** | 5173 | http://localhost:5173 | Aplicación de punto de venta |
| **avila-web** (sitio público) | 5174 | http://localhost:5174 | Landing, privacidad, términos, contacto |

---

## Requisitos previos

- **Sistema operativo:** Windows Server 2016
- **Permisos:** Administrador para instalar software
- **Espacio:** ~2 GB libres (Python, Node.js, dependencias)
- **Red:** Puerto 80/443 si se expone a Internet (opcional)

> **Nota:** En Windows Server 2016 **no está disponible winget**. Deberás instalar Python y Node.js manualmente.

---

## Parte 1: Instalar Python 3.11

### 1.1 Descargar Python

1. Ir a: https://www.python.org/downloads/release/python-3119/
2. Descargar **Windows installer (64-bit)**:
   - `python-3.11.9-amd64.exe`
3. Ejecutar el instalador.

### 1.2 Durante la instalación

- Marcar **"Add python.exe to PATH"** (obligatorio).
- Opcional: "Install for all users" si varios usuarios usarán el sistema.
- Elegir "Customize installation" y marcar:
  - pip
  - py launcher
  - Add Python to environment variables

### 1.3 Verificar

Abrir **CMD** (ventana nueva) y ejecutar:

```cmd
python --version
```

Debe mostrar: `Python 3.11.9`

---

## Parte 2: Instalar Node.js LTS

### 2.1 Descargar Node.js

1. Ir a: https://nodejs.org/
2. Descargar la versión **LTS** (recomendada).
3. Ejecutar el instalador `.msi`.

### 2.2 Durante la instalación

- Aceptar las opciones por defecto.
- Asegurarse de que **"Add to PATH"** esté marcado.
- Instalar las herramientas de compilación si pregunta (opcional).

### 2.3 Verificar

Abrir una **nueva ventana CMD** y ejecutar:

```cmd
node --version
npm --version
```

Deben mostrar números de versión (ej: `v20.x.x` y `10.x.x`).

---

## Parte 3: Copiar el proyecto al servidor

### 3.1 Ubicación recomendada

Copiar la carpeta del proyecto a, por ejemplo:

```
C:\Avila\
```

O en un disco de datos: `D:\Sistemas\Avila\`

### 3.2 Estructura esperada

```
C:\Avila\
├── backend\           # API Django
│   ├── apps\
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
├── frontend\          # POS React
│   ├── package.json
│   ├── src\
│   └── ...
├── avila-web\         # Sitio público (opcional)
│   ├── package.json
│   └── ...
├── instalar_todo.bat
├── iniciar_sistema.bat
└── docs\
```

---

## Parte 4: Instalación del sistema

### 4.1 Ejecutar instalador automático

1. Abrir **CMD como Administrador** (clic derecho en CMD → "Ejecutar como administrador").
2. Ir a la carpeta del proyecto:

```cmd
cd C:\Avila
```

3. Ejecutar:

```cmd
instalar_todo.bat
```

Esto hará:
- Crear entorno virtual Python (`backend\venv`)
- Instalar dependencias Python
- Instalar dependencias Node del frontend
- Ejecutar migraciones de base de datos
- Crear configuración inicial (si existe el script)

### 4.2 Si hay errores

Si Python o Node no se encuentran, **cierra CMD, abre una nueva ventana** y vuelve a ejecutar `instalar_todo.bat`. Las variables PATH se actualizan solo en ventanas nuevas.

---

## Parte 5: Crear usuario administrador

Solo la primera vez o si no existe superusuario:

```cmd
cd C:\Avila\backend
venv\Scripts\activate
set USE_SQLITE=True
python manage.py createsuperuser
```

Ingresar usuario, email y contraseña cuando lo pida.  
Desactivar el entorno: `deactivate`

---

## Parte 6: Ejecutar el sistema

### 6.1 Método rápido (doble clic)

Ejecutar **`iniciar_sistema.bat`** desde el Explorador de archivos.

Se abrirán dos ventanas CMD:
1. **Backend** – API en http://127.0.0.1:8000
2. **Frontend** – POS en http://localhost:5173

Para detener: cerrar ambas ventanas.

### 6.2 Método manual (dos terminales)

**Terminal 1 – Backend:**
```cmd
cd C:\Avila\backend
set USE_SQLITE=True
venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 – Frontend:**
```cmd
cd C:\Avila\frontend
npm run dev
```

> `0.0.0.0:8000` permite que el backend acepte conexiones desde otras IP de la red (celulares, tablets, otras PCs).

### 6.3 Ejecutar con acceso desde red

Para usar el POS desde otras PCs o celulares en la misma red, usar:

```cmd
iniciar_pos_servicio.bat
```

Es igual a `iniciar_sistema.bat` pero el backend escucha en `0.0.0.0:8000`, permitiendo conexiones desde la red local.

### 6.4 Ejecutar avila-web (sitio público)

Solo si necesitas el sitio público (landing, legales, contacto):

```cmd
cd C:\Avila\avila-web
npm install
npm run dev
```

Por defecto usará el puerto 5174 si 5173 está ocupado.

---

## Parte 7: Acceso desde la red

### 7.1 Obtener la IP del servidor

En CMD o PowerShell:

```cmd
ipconfig
```

Buscar **"Dirección IPv4"** de la interfaz de red activa (ej: `192.168.1.100`).

### 7.2 URLs de acceso

Desde otra PC o celular en la misma red:

- **POS:** `http://192.168.1.100:5173`
- **API (directa):** `http://192.168.1.100:8000/api/`

### 7.3 Reglas de Firewall

Si no se puede acceder desde la red, abrir puertos en el firewall.

Ejecutar **PowerShell como Administrador**:

```powershell
# Puerto del frontend POS
New-NetFirewallRule -DisplayName "Avila POS (Vite)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Puerto del backend API
New-NetFirewallRule -DisplayName "Avila API (Django)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Puerto avila-web (si aplica)
New-NetFirewallRule -DisplayName "Avila Web Publico" -Direction Inbound -LocalPort 5174 -Protocol TCP -Action Allow
```

---

## Parte 8: Iniciar el sistema al arrancar el servidor

Para que el POS y el backend se ejecuten al iniciar Windows Server:

### 8.1 Crear tareas en el Programador de tareas

1. Abrir **Programador de tareas** (`taskschd.msc`).
2. Crear tarea básica o tarea normal.

**Tarea 1 – Backend Django**

- **Nombre:** Avila Backend
- **Desencadenador:** Al iniciar el equipo.
- **Acción:** Iniciar un programa.
- **Programa:** `C:\Avila\backend\venv\Scripts\python.exe`
- **Argumentos:** `manage.py runserver 0.0.0.0:8000`
- **Iniciar en:** `C:\Avila\backend`
- **Variables de entorno adicionales:** `USE_SQLITE=True` (si usas SQLite).

**Tarea 2 – Frontend Vite**

- **Nombre:** Avila Frontend
- **Desencadenador:** Al iniciar el equipo (con retraso de 30 segundos para que arranque después del backend).
- **Acción:** Iniciar un programa.
- **Programa:** `C:\Program Files\nodejs\npm.cmd`
- **Argumentos:** `run dev`
- **Iniciar en:** `C:\Avila\frontend`

> **Alternativa:** Crear un script `.bat` que inicie ambos y configurar la tarea para ejecutar ese `.bat` al iniciar.

### 8.2 Script de inicio automático (acceso en red)

El proyecto incluye `iniciar_pos_servicio.bat`, que arranca backend y frontend con el backend escuchando en todas las interfaces (`0.0.0.0:8000`) para acceso desde la red local.

Ejecutarlo manualmente:
```cmd
iniciar_pos_servicio.bat
```

Para inicio automático al arrancar el servidor:
1. Abrir **Programador de tareas** (`taskschd.msc`)
2. Crear tarea básica
3. Nombre: "Avila POS"
4. Desencadenador: Al iniciar el equipo
5. Acción: Iniciar un programa
6. Programa o script: `C:\Avila\iniciar_pos_servicio.bat` (ajustar ruta según la ubicación del proyecto)

---

## Parte 9: Producción (opcional)

Para un entorno más estable:

### 9.1 Backend con Gunicorn

En lugar de `runserver`, usar Gunicorn (ya está en `requirements.txt`):

```cmd
cd C:\Avila\backend
venv\Scripts\activate
set USE_SQLITE=True
venv\Scripts\gunicorn.exe backend.wsgi:application --bind 0.0.0.0:8000 --workers 2
```

### 9.2 Frontend como sitio estático

Construir el frontend para producción:

```cmd
cd C:\Avila\frontend
npm run build
```

La carpeta `dist\` contendrá los archivos estáticos. Puedes servirlos con:
- IIS
- Nginx
- O el servidor de desarrollo con `npm run preview` (puerto 4173).

### 9.3 IIS como reverse proxy (avanzado)

Para exponer el sistema en el puerto 80 con IIS como proxy inverso hacia el backend y el frontend, se requiere configuración adicional de IIS y URL Rewrite. Si quieres avanzar por esta vía, se puede documentar aparte.

---

## Parte 10: Solución de problemas

### Python no reconocido

1. Verificar que la instalación marcó "Add Python to PATH".
2. Reiniciar el servidor o abrir una nueva sesión de CMD.
3. Comprobar: `where python`

### Node/npm no reconocido

1. Reinstalar Node.js asegurándose de marcar "Add to PATH".
2. Reiniciar el servidor.
3. Comprobar: `where node` y `where npm`

### Error al crear venv

- Comprobar que Python 3.11 está instalado: `python --version`
- Eliminar la carpeta `backend\venv` si existe y volver a ejecutar `instalar_todo.bat`

### No se puede acceder desde otra PC

- Comprobar que ambas máquinas están en la misma red.
- Verificar reglas del firewall (Parte 7.3).
- Probar desde el servidor: `http://127.0.0.1:5173` y `http://127.0.0.1:8000`

### El frontend no conecta con la API

- Verificar que el backend está en 8000.
- Revisar `frontend\vite.config.js`: proxy `/api` → `http://localhost:8000`

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | Instalar Python 3.11 (marcar "Add to PATH") |
| 2 | Instalar Node.js LTS |
| 3 | Copiar proyecto a `C:\Avila` |
| 4 | Ejecutar `instalar_todo.bat` |
| 5 | Crear superusuario: `python manage.py createsuperuser` |
| 6 | Ejecutar `iniciar_sistema.bat` |
| 7 | Abrir en navegador: http://localhost:5173 |
| 8 | Opcional: abrir puertos en firewall para acceso en red |

---

**Última actualización:** Marzo 2026
