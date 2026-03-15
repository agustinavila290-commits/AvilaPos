# Estructura de avila-web

Sitio público / tienda online de Avila Motor Repuesto (avilamotorepuesto.com.ar).

## Carpetas principales

```
avila-web/
├── public/           # Assets estáticos
├── src/
│   ├── components/
│   │   ├── admin/    # AdminLayout, ProtectedRoute
│   │   ├── layout/   # Header, Footer, Layout
│   │   └── tienda/   # ProductCard
│   ├── context/      # CarritoContext, AuthContext
│   ├── data/         # Datos estáticos (contacto)
│   ├── pages/
│   │   ├── admin/    # Login, Dashboard, Pedidos, Productos
│   │   ├── home/
│   │   ├── catalogo/
│   │   └── ...
│   ├── services/     # tiendaService, api, authService, adminService
│   └── styles/
├── docs/
└── index.html
```

## Páginas (por carpeta)

### Tienda pública

| Ruta | Carpeta | Descripción |
|------|---------|-------------|
| `/` | `pages/home/` | Página principal |
| `/productos` | `pages/catalogo/` | Catálogo con filtros |
| `/productos/:id` | `pages/producto/` | Detalle de producto |
| `/carrito` | `pages/carrito/` | Carrito de compras |
| `/checkout` | `pages/checkout/` | Formulario de pedido |
| `/confirmacion/:id` | `pages/confirmacion/` | Confirmación de pedido |
| `/contacto` | `pages/contacto/` | Datos de contacto |
| `/privacidad` | `pages/privacidad/` | Política de privacidad |
| `/terminos` | `pages/terminos/` | Términos de uso |

### Admin (requiere login)

| Ruta | Carpeta | Descripción |
|------|---------|-------------|
| `/admin/login` | `pages/admin/login/` | Inicio de sesión |
| `/admin` | `pages/admin/dashboard/` | Dashboard |
| `/admin/pedidos` | `pages/admin/pedidos/` | Lista de pedidos web |
| `/admin/pedidos/:id` | `pages/admin/pedidos/` | Detalle de pedido |
| `/admin/productos` | `pages/admin/productos/` | Productos del POS: subir fotos, editar precio web |

Cada página tiene su carpeta con `index.jsx` como punto de entrada, para mantener el código organizado y fácil de encontrar.

## Productos (POS)

Los productos de la tienda web provienen del **POS** (backend). En el admin de la tienda se pueden:

- Ver todos los productos base del POS (con sus variantes)
- **Subir fotos** (imagen del ProductoBase, compartida por todas las variantes)
- **Editar precio web** de cada variante para la tienda online

La creación/alta de productos se hace desde el POS; el admin de la tienda solo gestiona fotos y precios web.

## Diseño

- Paleta: rojo (#C41E3A) y negro (#1a1a1a)
- Logo: A roja, VILA negra
- Estilos en `src/styles/index.css`
