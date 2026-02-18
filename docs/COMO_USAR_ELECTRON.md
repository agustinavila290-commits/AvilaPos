# 🖥️ CÓMO USAR LA VERSIÓN ELECTRON

**Tu aplicación ahora es un PROGRAMA DE ESCRITORIO** que no requiere abrir el navegador.

---

## 🚀 INICIO RÁPIDO

### Opción 1: Script Automático ⭐ (MÁS FÁCIL)

```powershell
cd C:\Users\Agustin\Avila
.\iniciar_electron.bat
```

**Qué hace:**
1. ✅ Inicia el backend Django automáticamente
2. ✅ Espera 5 segundos
3. ✅ Abre la aplicación de escritorio
4. ✅ NO abre navegador

---

### Opción 2: Manual (2 Terminales)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Agustin\Avila\backend
.\venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - Electron:**
```powershell
cd C:\Users\Agustin\Avila\frontend
npm run electron
```

---

## 🎯 DIFERENCIA CON LA VERSIÓN WEB

### ANTES (Versión Web):
```
1. Abrir navegador Chrome/Edge
2. Escribir: localhost:5173
3. Se ve la barra del navegador
4. Pestañas, favoritos, etc.
```

### AHORA (Versión Electron):
```
1. Doble click en icono
2. Se abre DIRECTO (sin navegador)
3. Parece programa nativo
4. Ventana limpia y profesional
```

---

## 📦 GENERAR INSTALADOR PARA DISTRIBUIR

### Paso 1: Compilar
```powershell
cd C:\Users\Agustin\Avila\frontend
npm run electron:build
```

**Tiempo**: 5-10 minutos  
**Resultado**: `dist-electron/Casa de Repuestos-Setup-1.0.0.exe`

### Paso 2: Distribuir
- Copiar el .exe a USB
- Llevar a la PC del negocio
- Doble click → Instalar
- ¡Listo! Icono en escritorio

---

## 🎨 PERSONALIZAR ICONO

El icono actual es un placeholder.

### Para Crear Icono:

**1. Descargar/Crear imagen PNG** (512x512px)

**2. Convertir a ICO**:
   - Web: https://convertio.co/png-ico/
   - Seleccionar tamaños: 16, 32, 48, 64, 128, 256

**3. Guardar en:**
```
frontend/build/icon.png  ← PNG original
frontend/build/icon.ico  ← ICO convertido
```

**4. Recompilar:**
```powershell
npm run electron:build
```

**Ver guía completa**: `frontend/INSTRUCCIONES_ICONO.md`

---

## ⚙️ CARACTERÍSTICAS

### Ventana
- Tamaño inicial: 1400 x 900
- Se maximiza al abrir
- Tamaño mínimo: 1024 x 768
- Título: "Casa de Repuestos - Sistema de Gestión"

### Menú
- **Archivo**: Recargar (F5), Pantalla completa (F11), Salir (Alt+F4)
- **Ver**: Zoom +/- (Ctrl +/-), DevTools (F12)
- **Ayuda**: Acerca de

### Funcionalidades
- ✅ Hot reload en desarrollo
- ✅ DevTools para debuggear (F12)
- ✅ Zoom de interfaz (Ctrl +/-)
- ✅ Pantalla completa (F11)

---

## 📂 ARCHIVOS EN EL PROYECTO

```
C:\Users\Agustin\Avila\
├── frontend/
│   ├── electron/
│   │   ├── main.js          ← Ventana principal
│   │   └── preload.js       ← Seguridad
│   ├── build/
│   │   ├── icon.png         ← Icono PNG (⚠️ reemplazar)
│   │   └── icon.ico         ← Icono ICO (crear)
│   ├── package.json         ← Scripts configurados
│   └── ...
├── iniciar_electron.bat     ← Script de inicio ⭐
└── iniciar_electron.ps1     ← Alternativa PowerShell
```

---

## 🔄 DESARROLLO vs PRODUCCIÓN

### Modo Desarrollo (`npm run electron`)
- ✅ Backend debe estar corriendo
- ✅ Hot reload activado
- ✅ DevTools abiertas
- ✅ Cambios en tiempo real

### Modo Producción (instalador .exe)
- ⚠️ Backend debe estar corriendo en la PC
- ❌ No tiene hot reload
- ❌ DevTools desactivadas
- ✅ Optimizado y rápido

---

## 💡 IMPORTANTE: BACKEND

### Electron NO incluye el backend Django

**Opciones:**

**1. Backend Local** (Lo que tenés ahora)
- Cada PC necesita Python y PostgreSQL
- Iniciar backend: `python manage.py runserver`
- Electron conecta a `localhost:8000`

**2. Backend como Servicio Windows** (Recomendado para negocio)
- Backend se inicia automáticamente con Windows
- No necesita abrir terminales
- Más profesional

**3. Backend en Servidor** (Avanzado)
- Backend en una PC servidor
- Electron conecta por red
- Múltiples PCs usan el mismo backend

### Para el negocio, recomiendo: **Opción 2 (Servicio Windows)**

Ver cómo implementar en: `GUIA_MIGRACION_A_OTRA_PC.md`

---

## 🎯 ATAJOS DE TECLADO

| Atajo | Acción |
|-------|--------|
| F5 | Recargar aplicación |
| F11 | Pantalla completa |
| F12 | Abrir DevTools (desarrollo) |
| Ctrl + Plus | Zoom in |
| Ctrl + Minus | Zoom out |
| Ctrl + 0 | Restablecer zoom |
| Alt + F4 | Cerrar aplicación |

---

## 📊 COMPARACIÓN

| Característica | Versión Web | Versión Electron |
|----------------|-------------|------------------|
| Abrir | Navegador → localhost:5173 | Doble click icono |
| Apariencia | Barra de navegador visible | Ventana limpia |
| Instalación | No requiere | Instalador .exe |
| Profesionalismo | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Distribución | Configurar manualmente | Un .exe |
| Icono escritorio | No | Sí |
| Menú Inicio | No | Sí |

---

## ✅ ESTADO ACTUAL

```
╔═══════════════════════════════════════════════╗
║                                               ║
║   ELECTRON: ✅ COMPLETAMENTE CONFIGURADO      ║
║                                               ║
║   Listo para:                                 ║
║   1. Probar en desarrollo                     ║
║   2. Generar instalador                       ║
║   3. Distribuir en el negocio                 ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

## 🚀 PRUÉBALO AHORA

```powershell
# Opción A: Script automático
.\iniciar_electron.bat

# Opción B: Manual
# Terminal 1:
cd backend
.\venv\Scripts\activate
python manage.py runserver

# Terminal 2:
cd frontend
npm run electron
```

**Resultado**: ¡Se abre una ventana de ESCRITORIO con tu aplicación!

---

## 🎉 VENTAJAS PARA EL NEGOCIO

### Para los Empleados:
✅ Doble click y funciona  
✅ No necesitan escribir "localhost"  
✅ Parece programa de verdad  
✅ Más fácil de usar  

### Para Vos:
✅ Distribución simple (un .exe)  
✅ Actualizaciones controladas  
✅ Imagen profesional  
✅ Mismo código que ya tenías  

---

**Fecha**: 11/02/2026  
**Versión**: 1.0.0  
**Estado**: ✅ LISTO PARA USAR

**Próximo paso**: ¡Probarlo! → `.\iniciar_electron.bat`
