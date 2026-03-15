# Desplegar el frontend (POS) en Vercel

En Vercel solo se despliega el **frontend** (React/Vite). El **backend Django** debe estar en otro servicio (Railway, Render, tu VPS, etc.). El frontend en Vercel llamará a la API de ese backend mediante la variable de entorno `VITE_API_URL`.

---

## 1. Tener el backend ya publicado

Antes de usar Vercel necesitás que la API esté en línea, por ejemplo:

- **Railway** (recomendado): subís el `backend/`, configurás PostgreSQL y te dan una URL tipo `https://tu-proyecto.railway.app`.
- **Render**: servicio web para el backend, otra URL pública.
- **Tu propio servidor**: si ya tenés un dominio y Django corriendo, usás esa URL.

La URL base de la API debe ser **sin** `/api` al final si tu backend sirve la API en la raíz, o **con** `/api` si Django está en `https://dominio.com/api/`. En este proyecto el backend expone todo bajo `/api/`, así que la variable debe ser algo como:

- `https://tu-backend.railway.app/api`  
  o  
- `https://api.tudominio.com/api`

---

## 2. Conectar el repo con Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión (GitHub/GitLab/Bitbucket).
2. **Add New Project** → elegí el repositorio de Avila.
3. En **Configure Project**:
   - **Root Directory**: `frontend`  
     (así Vercel usa solo la carpeta del POS).
   - **Framework Preset**: Vite (debería detectarse solo).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.

---

## 3. Variable de entorno para la API

En el mismo paso de configuración (o después en **Project → Settings → Environment Variables**):

- **Name**: `VITE_API_URL`
- **Value**: URL base de tu API, **incluyendo** `/api`, por ejemplo:
  - `https://tu-backend.railway.app/api`
- Aplicar a **Production**, **Preview** y **Development** si querés que todos los entornos usen ese backend.

Importante: en Vite las variables que empiezan con `VITE_` se embeben en el build. Si cambiás `VITE_API_URL` después, hay que hacer un **nuevo deploy** para que tome el valor nuevo.

---

## 4. Deploy

- **Deploy** y esperá a que termine el build.
- Vercel te da una URL tipo `https://tu-proyecto.vercel.app`.

Al abrirla deberías ver el login del POS. Al iniciar sesión, el frontend llamará a `VITE_API_URL` (tu backend) para auth y datos.

---

## 5. CORS en el backend

El backend debe permitir el origen de Vercel. En Django, por ejemplo en `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://tu-proyecto.vercel.app",
    "https://tu-proyecto-*.vercel.app",  # previews
]
# o en desarrollo:
# CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "https://tu-proyecto.vercel.app"]
```

Si usás una variable de entorno:

```python
import os
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
```

Y en Railway/Render/servidor configurás `CORS_ORIGINS=https://tu-proyecto.vercel.app`.

---

## 6. Resumen rápido

| Dónde        | Qué hacer |
|-------------|-----------|
| **Backend** | Publicarlo en Railway/Render/VPS y tener una URL base (ej. `https://xxx/api`). |
| **Vercel**  | Root Directory = `frontend`, variable `VITE_API_URL` = esa URL con `/api`. |
| **Django**  | CORS permitiendo el dominio de Vercel. |

Así el proyecto queda con el frontend en Vercel y el backend en el servicio que elijas; el procedimiento de deploy es conectar el repo, configurar `frontend` como raíz y definir `VITE_API_URL`.
