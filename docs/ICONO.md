# 🎨 Cómo Agregar un Icono al Ejecutable

## Opción 1: Usar un Icono Existente

### Iconos del Sistema Windows
Windows ya tiene iconos disponibles en:
- `C:\Windows\System32\shell32.dll`
- `C:\Windows\System32\imageres.dll`

**Pasos:**
1. Clic derecho en acceso directo > Propiedades
2. Cambiar icono...
3. Examinar > Ir a `C:\Windows\System32\shell32.dll`
4. Elegir icono (sugeridos: #165 - engranaje, #22 - carpeta, #46 - ordenador)

---

## Opción 2: Crear Icono Personalizado

### Generador Online (Gratis)
1. Ir a: https://www.favicon-generator.org/ o https://favicon.io/
2. Subir imagen (logo, foto, etc.) o crear desde texto
3. Descargar como .ico
4. Guardar en: `C:\Users\Agustin\Avila\icono.ico`

### Usar el Icono
1. Clic derecho en acceso directo
2. Propiedades > Cambiar icono
3. Examinar > Seleccionar `icono.ico`
4. Aplicar

---

## Opción 3: Crear Icono con GIMP (Software Gratis)

1. **Descargar GIMP**: https://www.gimp.org/
2. **Crear imagen**: 256x256 px
3. **Diseñar logo/icono**
4. **Exportar**: Archivo > Exportar como > nombre.ico
5. **Usar el icono** (ver pasos arriba)

---

## Opción 4: Icono Sugerido para Casa de Repuestos

### Emoji como Icono
Puedes usar emojis convertidos a .ico:
- 🏪 (tienda)
- 🛒 (carrito)
- 🏍️ (moto)
- 🔧 (herramienta)
- 💰 (dinero)

**Generar desde emoji:**
1. Ir a: https://www.emoji-icon.com/
2. Buscar emoji
3. Descargar como .ico

---

## Opción 5: Iconos Profesionales Gratuitos

### Sitios con Iconos Gratis:
1. **Flaticon**: https://www.flaticon.com/
2. **Icons8**: https://icons8.com/
3. **Font Awesome**: https://fontawesome.com/

**Palabras clave sugeridas:**
- "motorcycle parts"
- "auto shop"
- "tools"
- "garage"
- "store"

---

## Aplicar Icono a BAT2EXE

Si usas Bat To Exe Converter:
1. En "Icon/Version info"
2. Seleccionar archivo .ico
3. Compilar

Si usas PS2EXE:
```powershell
ps2exe -inputFile "iniciar_sistema.ps1" -outputFile "CasaDeRepuestos.exe" -iconFile "icono.ico"
```

---

## 🎯 Recomendación

Para un sistema profesional, te sugiero:
1. Crear logo simple en https://www.canva.com/
2. Exportar como PNG (256x256)
3. Convertir a ICO en https://www.favicon-generator.org/
4. Aplicar al acceso directo o ejecutable

---

## ⚡ Método Rápido

Si quieres algo rápido y profesional:
1. Ir a: https://favicon.io/emoji-favicons/
2. Buscar: "🏍️" (moto)
3. Descargar
4. Renombrar `favicon.ico` a `CasaDeRepuestos.ico`
5. Aplicar al acceso directo

---

**Nota:** El icono es solo visual, no afecta la funcionalidad del sistema.
