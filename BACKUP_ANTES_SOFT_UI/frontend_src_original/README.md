# Frontend – Estructura

Índice rápido. **Mapa completo del proyecto:** ver `docs/ARQUITECTURA.md` en la raíz.

## Rutas

Definidas en `App.jsx`. Ruta principal: `/` → Punto de venta. Login: `/login`. Resto bajo `Layout` (menú lateral).

## Servicios (API)

Todos en `services/`. Base URL de la API: `/api` (definida en `api.js`). **No usar `/api` en la ruta del servicio** (ej: `get('/compras/proveedores/')`, no `get('/api/compras/...')`).

- `api.js` – Cliente axios, interceptores
- `authService.js` – `/auth/` (login, logout, me)
- `clientesService.js` – `/clientes/`
- `productosService.js` – `/productos/` (variantes, search, importarExcel, buscarPorCodigo)
- `inventarioService.js` – `/inventario/`
- `ventasService.js` – `/ventas/`
- `comprasService.js` – `/compras/`
- `reportesService.js` – `/reportes/`
- `configuracionService.js` – `/configuracion/`
- `devolucionesService.js` – `/devoluciones/`
- `sistemaService.js` – `/sistema/`

## Páginas

En `pages/`. Una página por pantalla (Productos, Clientes, Compras, Ventas, PuntoVenta, etc.).

## Componentes compartidos

- `Layout.jsx` – Contenedor con menú
- `ProtectedRoute.jsx` – Requiere login (y opc. admin)
- `ErrorBoundary.jsx` – Captura errores de React
- `QuickClienteModal.jsx`, `TicketTermico.jsx`

## Contexto y hooks

- `context/AuthContext.jsx` – Usuario, login, logout
- `hooks/useAuth.js` – `useAuth()`

## Estilos y utilidades

- `index.css` – Tailwind, clases globales
- `utils/uppercaseInput.js` – Mayúsculas en inputs
