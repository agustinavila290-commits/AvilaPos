# 🔧 Solución: Pantalla en Blanco

## ¿Qué hacer si ves una pantalla en blanco?

### Paso 1: Verificar errores en consola del navegador

1. **Abre el navegador en:** http://localhost:5173
2. **Presiona F12** (o clic derecho > Inspeccionar)
3. **Ve a la pestaña "Console"**
4. **Busca errores en rojo**

---

## Soluciones Comunes

### Solución 1: Limpiar caché del navegador

**Chrome/Edge:**
1. Presiona `Ctrl + Shift + R` (recarga forzada)
2. O presiona `Ctrl + Shift + Delete`
3. Limpiar "Imágenes y archivos en caché"
4. Recargar página

**Firefox:**
1. Presiona `Ctrl + Shift + R`
2. O `Ctrl + F5`

---

### Solución 2: Verificar que los servidores están corriendo

Deberías tener **2 ventanas de PowerShell abiertas:**

#### Ventana 1: Backend (Django)
Debe mostrar:
```
Django version 5.x.x
Starting development server at http://127.0.0.1:8000/
```

#### Ventana 2: Frontend (React/Vite)
Debe mostrar:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Si no ves estas ventanas:**
- Cierra TODO
- Ejecuta `iniciar_sistema.bat` de nuevo

---

### Solución 3: Reinstalar dependencias del Frontend

Si hay errores de módulos:

```powershell
cd C:\Users\Agustin\Avila\frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

---

### Solución 4: Verificar puerto correcto

El frontend puede estar en un puerto diferente:

- Prueba: http://localhost:5173
- O prueba: http://localhost:5174
- O prueba: http://localhost:5175

Busca en la ventana de Vite cuál es el puerto correcto.

---

### Solución 5: Error común - CORS

Si en consola ves errores de CORS o "Access-Control-Allow-Origin":

1. Verifica que el backend esté en: http://localhost:8000
2. El frontend debe estar en: http://localhost:5173
3. NO uses http://127.0.0.1 (usa localhost)

---

### Solución 6: Acceso directo a Login

Prueba acceder directamente:
- http://localhost:5173/login
- http://localhost:5173/#/login

Si aparece la página de login, el problema es con las rutas.

---

## 🚨 Errores Específicos

### Error: "Cannot read property 'render' of undefined"
**Solución:** Problema con React
```bash
cd frontend
npm install react react-dom
npm run dev
```

### Error: "Failed to fetch"
**Solución:** Backend no está corriendo
```bash
cd backend
.\venv\Scripts\python.exe manage.py runserver
```

### Error: "404 Not Found"
**Solución:** Rutas mal configuradas
- Verifica que `App.jsx` tenga todas las rutas
- Reinicia el frontend

---

## 🔍 Diagnóstico Avanzado

### Verificar que archivos importantes existen:

```powershell
# Verificar estructura
Test-Path "C:\Users\Agustin\Avila\frontend\src\App.jsx"
Test-Path "C:\Users\Agustin\Avila\frontend\src\main.jsx"
Test-Path "C:\Users\Agustin\Avila\frontend\index.html"
```

Todos deben devolver `True`.

---

## ✅ Solución Definitiva

Si nada funciona, ejecuta este script completo:

```powershell
# 1. Detener todo
Get-Process | Where-Object {$_.ProcessName -eq "python" -or $_.ProcessName -eq "node"} | Stop-Process -Force

# 2. Limpiar
cd C:\Users\Agustin\Avila\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

# 3. Reinstalar
npm install

# 4. Iniciar Backend
cd C:\Users\Agustin\Avila\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Agustin\Avila\backend'; .\venv\Scripts\python.exe manage.py runserver"

# Esperar 5 segundos
Start-Sleep -Seconds 5

# 5. Iniciar Frontend
cd C:\Users\Agustin\Avila\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Agustin\Avila\frontend'; npm run dev"

# Esperar 10 segundos
Start-Sleep -Seconds 10

# 6. Abrir navegador
Start-Process "http://localhost:5173"
```

---

## 📸 Ayuda Visual

**Pantalla correcta (Login):**
- Debe aparecer un formulario con:
  - Campo "Usuario"
  - Campo "Contraseña"
  - Botón "Iniciar Sesión"
  - Logo o título "Casa de Repuestos"

**Pantalla en blanco:**
- Completamente blanco
- Sin formularios
- Sin texto

---

## 💬 ¿Sigue sin funcionar?

Envía esta información:

1. **Contenido de la consola del navegador** (F12 > Console)
2. **Errores en la ventana de Vite** (ventana PowerShell del frontend)
3. **Puerto que muestra Vite** (http://localhost:????)
4. **Navegador que usas** (Chrome, Firefox, Edge)

---

**Última actualización:** 11 de febrero de 2026
