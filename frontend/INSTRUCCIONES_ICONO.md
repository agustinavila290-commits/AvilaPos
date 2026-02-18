# 🎨 CREAR ICONO PARA LA APLICACIÓN

El icono actual es un placeholder. Para crear un icono profesional:

## Opción 1: Usar un Generador Online (MÁS FÁCIL)

### 1. Ir a: https://www.favicon-generator.org/

### 2. Subir tu logo o imagen (recomendado 512x512px o más)

### 3. Descargar los siguientes formatos:
- **PNG (256x256 o 512x512)** → Guardar como `build/icon.png`
- **ICO** → Guardar como `build/icon.ico`
- **ICNS** (para Mac) → Guardar como `build/icon.icns`

### 4. Copiar a las carpetas:
```
frontend/build/icon.png   ← Windows/Linux
frontend/build/icon.ico   ← Windows
frontend/build/icon.icns  ← Mac (opcional)
frontend/public/icon.png  ← También aquí
```

---

## Opción 2: Crear Icono Desde Cero

### Usando Photoshop/GIMP/Canva:

1. **Crear imagen cuadrada**: 512x512px
2. **Fondo transparente** (opcional pero recomendado)
3. **Diseño simple**: El icono se verá pequeño, usar diseño claro

### Ideas para el Icono:
- 🏍️ Silueta de moto
- 🔧 Herramientas (llave inglesa + engranaje)
- 📦 Caja de repuestos
- Iniciales "CR" (Casa Repuestos)
- Combinación de elementos

### Exportar:
- **PNG 512x512** con fondo transparente
- Guardar como `build/icon.png`

---

## Opción 3: Convertir PNG a ICO

Si ya tenés PNG, convertir a ICO:

### Online:
- https://convertio.co/png-ico/
- https://icoconvert.com/

### PowerShell:
```powershell
# Necesita ImageMagick instalado
magick icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

---

## Verificar que Funciona

Después de agregar los iconos:

1. **Recompilar**:
   ```bash
   npm run electron:build
   ```

2. **Verificar**:
   - Instalar el .exe generado
   - El icono debería aparecer en:
     - Escritorio
     - Menú Inicio
     - Barra de tareas
     - Ventana de la aplicación

---

## Iconos Recomendados por Tamaño

| Tamaño | Uso |
|--------|-----|
| 16x16 | Barra de tareas (pequeño) |
| 32x32 | Lista de ventanas |
| 48x48 | Vista grande de carpetas |
| 128x128 | Mac Dock |
| 256x256 | Windows 10/11 |
| 512x512 | Retina displays |

---

## Archivo Actual

El archivo actual `build/icon.png` es un placeholder de texto.

**IMPORTANTE**: Reemplazarlo antes de distribuir la aplicación.

---

## ¿No tenés diseñador?

### Alternativas Gratis:

1. **Usar un icono de librería gratuita**:
   - https://www.flaticon.com/ (buscar "motorcycle repair")
   - https://icons8.com/ (buscar "motorcycle parts")

2. **Crear con Canva** (gratis):
   - https://www.canva.com/
   - Plantillas de logos gratis
   - Exportar como PNG 512x512

3. **Pedir ayuda a IA**:
   - DALL-E, Midjourney, Stable Diffusion
   - Prompt: "simple motorcycle spare parts icon, flat design, blue and white, transparent background"

---

## Ejemplo de Estructura Final

```
frontend/
├── build/
│   ├── icon.png       ← 512x512px PNG
│   ├── icon.ico       ← Windows ICO
│   └── icon.icns      ← Mac ICNS (opcional)
├── public/
│   └── icon.png       ← Mismo archivo
└── electron/
    └── main.js
```

---

**Una vez que tengas el icono, reemplazar el archivo y recompilar.**
