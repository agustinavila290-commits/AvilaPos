# Cómo restaurar el diseño anterior

Este backup se creó antes del rediseño Soft UI.

## Para volver al diseño original (tema oscuro, header horizontal)

### Opción 1: Restaurar carpeta completa

```powershell
# Detener el servidor frontend si está corriendo
# Luego:
Remove-Item -Recurse -Force c:\Users\Agustin\Avila\frontend\src
Copy-Item -Recurse c:\Users\Agustin\Avila\BACKUP_ANTES_SOFT_UI\frontend_src_original -Destination c:\Users\Agustin\Avila\frontend\src

# Si modificaste tailwind.config.js:
Copy-Item c:\Users\Agustin\Avila\BACKUP_ANTES_SOFT_UI\tailwind.config.js.backup -Destination c:\Users\Agustin\Avila\frontend\tailwind.config.js
```

### Opción 2: Restaurar solo algunos archivos

Si solo querés volver el Layout y los estilos:

```powershell
Copy-Item c:\Users\Agustin\Avila\BACKUP_ANTES_SOFT_UI\frontend_src_original\components\Layout.jsx -Destination c:\Users\Agustin\Avila\frontend\src\components\Layout.jsx
Copy-Item c:\Users\Agustin\Avila\BACKUP_ANTES_SOFT_UI\frontend_src_original\index.css -Destination c:\Users\Agustin\Avila\frontend\src\index.css
```

## Archivos respaldados

- `frontend_src_original/` — Copia completa de `frontend/src` antes del cambio
- `tailwind.config.js.backup` — Configuración de Tailwind original

Fecha backup: 13 feb 2026
