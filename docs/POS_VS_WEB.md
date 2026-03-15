# Separación: Sistema POS y sitio web

## Repositorios y dominios

| Repositorio | Contenido | Dominio |
|-------------|-----------|---------|
| **Este repo (Avila)** | Sistema POS: backend Django + frontend React. Gestión interna (ventas, inventario, clientes, compras, reportes, Clover, etc.). | `app.avilamotorepuesto.com.ar` o instalación local |
| **avila-web** (repo separado) | Sitio público: landing, privacidad, términos, contacto y futura tienda online. | `avilamotorepuesto.com.ar` |

## Por qué están separados

- **POS:** Aplicación de escritorio/administración, requiere login, usa API propia.
- **Web:** Sitio público y catálogo/tienda para clientes; puede desplegarse en Netlify/Vercel sin backend o con API distinta en el futuro.

## Dónde está cada cosa

- Documentación del POS y mapa de código: [ARQUITECTURA.md](ARQUITECTURA.md).
- Estructura y criterios del sitio web: en el repositorio **avila-web**, archivo `docs/ESTRUCTURA.md`.
