# Arquitectura del sistema – Mapa para desarrollo y búsqueda

Este documento sirve como **índice del proyecto** para ubicar rápido cada funcionalidad (backend, frontend y docs). Útil para desarrolladores y para asistentes de código.

---

## Raíz del proyecto

```
Avila/
├── backend/          # Django (API + admin)
├── frontend/         # React (Vite)
├── docs/             # Documentación (instalación, AFIP, Excel, etc.)
├── README.md
├── INSTALL.md
└── docs/ARQUITECTURA.md  # Este archivo
```

---

## Backend (Django)

**Entrada de la API:** `backend/backend/urls.py` — define todos los prefijos `/api/...`.

| Ruta API | App Django | Qué hace | Archivos clave |
|----------|------------|----------|----------------|
| `/api/auth/` | **usuarios** | Login JWT, logout, /me, permisos | `apps/usuarios/views.py`, `permissions.py`, `models.py` |
| `/api/clientes/` | **clientes** | CRUD clientes | `apps/clientes/views.py`, `serializers.py`, `models.py` |
| `/api/productos/` | **productos** | Marcas, categorías, productos base, variantes, búsqueda, importar Excel | `apps/productos/views.py`, `models.py`, `serializers.py`, `search_utils.py`, `excel_utils.py` |
| `/api/inventario/` | **inventario** | Depósitos, stock, movimientos, ajustes | `apps/inventario/views.py`, `models.py`, `services.py` |
| `/api/ventas/` | **ventas** | POS, ventas, ítems, anulaciones | `apps/ventas/views.py`, `models.py`, `serializers.py`, `services.py`, `signals.py` |
| `/api/compras/` | **compras** | Proveedores, compras, adjuntos factura | `apps/compras/views.py`, `models.py`, `serializers.py`, `image_utils.py` |
| `/api/reportes/` | **reportes** | Reportes, exportación | `apps/reportes/views.py` |
| `/api/configuracion/` | **configuracion** | Empresa, depósito principal, parámetros | `apps/configuracion/views.py`, `models.py` |
| `/api/devoluciones/` | **devoluciones** | Devoluciones, notas de crédito | `apps/devoluciones/views.py`, `models.py`, `services.py` |
| `/api/sistema/` | **sistema** | Backup, auditoría, export Excel, WhatsApp | `apps/sistema/views.py`, `audit.py`, `backup_manager.py`, `excel_export.py`, `whatsapp.py` |
| `/api/facturacion/` | **facturacion** | AFIP, facturación electrónica, PDF | `apps/facturacion/views.py`, `afip_service.py`, `pdf_generator.py` |
| `/api/clover/` | **clover** | Pagos con tarjeta vía POSnet Clover | `apps/clover/views.py`, `services.py`, `clover_api.py` |

### Módulos auxiliares dentro de una app

- **productos**
  - `search_utils.py` — variantes de término de búsqueda (tildes, mayúsculas).
  - `excel_utils.py` — mapeo de columnas Excel, `cell_str`, `cell_number`, aliases de encabezados.
- **compras**
  - `image_utils.py` — compresión y guardado de imágenes de facturas.
- **sistema**
  - `audit.py` — registro de auditoría.
  - `excel_export.py` — exportación a Excel.
  - `whatsapp.py` — integración WhatsApp.
- **clover**
  - `clover_api.py` — cliente REST para API Clover (órdenes, pagos).
  - `services.py` — CloverPayService: procesar pago y guardar CloverPago.

### Configuración Django

- `backend/backend/settings.py` — settings del proyecto.
- `backend/backend/urls.py` — rutas principales e includes de cada app.
- `backend/crear_configuracion_inicial.py` — script de configuración inicial.

### Scripts

- `backend/scripts/verificar_excel_productos.py` — comprueba si un Excel tiene el formato esperado para importar productos.
- `backend/scripts/generar_certificado_afip.bat` — certificado AFIP (ver `docs/PASOS_ACTIVAR_AFIP.md`).

---

## Frontend (React + Vite)

**Entrada:** `frontend/src/main.jsx` → `App.jsx` (rutas en `App.jsx`).

### Rutas (App.jsx)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | `Login.jsx` | Inicio de sesión |
| `/` | `PuntoVenta.jsx` | Punto de venta (pantalla principal) |
| `/productos` | `Productos.jsx` | Listado productos |
| `/productos/importar` | `ImportarProductos.jsx` | Importar Excel |
| `/productos/nuevo` | `ProductoNuevo.jsx` | Alta producto |
| `/productos/:id` | `ProductoDetalle.jsx` | Detalle producto |
| `/clientes` | `Clientes.jsx` | Listado clientes |
| `/clientes/nuevo`, `/clientes/:id`, `/clientes/:id/editar` | `ClienteForm.jsx`, `ClienteDetalle.jsx` | CRUD cliente |
| `/inventario` | `Inventario.jsx` | Inventario |
| `/inventario/critico` | `StockCritico.jsx` | Stock crítico |
| `/inventario/ajustar/...` | `AjustarStock.jsx` | Ajuste de stock |
| `/inventario/movimientos` | `Movimientos.jsx` | Movimientos |
| `/compras`, `/compras/nueva`, `/compras/:id` | `Compras.jsx`, `RegistrarCompra.jsx`, `CompraDetalle.jsx` | Compras |
| `/ventas`, `/ventas/:id` | `Ventas.jsx`, `VentaDetalle.jsx` | Ventas |
| `/reportes` | `Reportes.jsx` | Reportes |
| `/configuracion` | `Configuracion.jsx` | Configuración |
| `/backups` | `Backups.jsx` | Backups |
| `/audit-logs` | `AuditLogs.jsx` | Auditoría |
| `/devoluciones`, `/devoluciones/nueva` | `Devoluciones.jsx`, `NuevaDevolucion.jsx` | Devoluciones |

### Servicios (llamadas a la API)

Todos usan `frontend/src/services/api.js` (axios con baseURL `/api`). No duplicar `/api` en la ruta del servicio.

| Servicio | Ruta base | Uso |
|----------|-----------|-----|
| `api.js` | — | Cliente axios, interceptores, baseURL |
| `authService.js` | `/auth/` | login, logout, getUser, getCurrentUser |
| `clientesService.js` | `/clientes/` | CRUD clientes |
| `productosService.js` | `/productos/` | marcas, categorías, productos, variantes, search, importarExcel, buscarPorCodigo |
| `inventarioService.js` | `/inventario/` | depósitos, stock, movimientos |
| `ventasService.js` | `/ventas/` | ventas, ítems, anular |
| `comprasService.js` | `/compras/` | proveedores, compras, adjuntos factura |
| `reportesService.js` | `/reportes/` | reportes |
| `configuracionService.js` | `/configuracion/` | empresa, configuración |
| `devolucionesService.js` | `/devoluciones/` | devoluciones |
| `sistemaService.js` | `/sistema/` | backups, audit, export |
| `cloverService.js` | `/clover/` | procesar pago Clover, config |

### Componentes compartidos

- `Layout.jsx` — menú lateral y contenedor de páginas.
- `ProtectedRoute.jsx` — rutas que requieren login (y opcionalmente admin).
- `ErrorBoundary.jsx` — captura errores de React y muestra mensaje.
- `QuickClienteModal.jsx` — modal rápido de cliente (ej. en POS).
- `TicketTermico.jsx` — impresión de ticket.

### Contexto y hooks

- `context/AuthContext.jsx` — usuario, login, logout, isAuthenticated, isAdmin.
- `hooks/useAuth.js` — acceso al AuthContext.

### Estilos y utilidades

- `index.css` — Tailwind, clases globales (`.card`, `.input-field`, mayúsculas en inputs).
- `utils/uppercaseInput.js` — mayúsculas automáticas en campos de texto.

---

## Documentación (docs/)

| Documento | Contenido |
|-----------|-----------|
| `ARQUITECTURA.md` | Este índice (backend, frontend, rutas, servicios). |
| `FORMATO_EXCEL_PRODUCTOS.md` | Columnas requeridas para importar productos desde Excel. |
| `PASOS_ACTIVAR_AFIP.md` | Pasos para activar facturación AFIP. |
| `REVISION_SISTEMA_BASE_DATOS.md` | Convenciones de nombres y relaciones (stock, ventas, etc.). |
| `COMO_AGREGAR_STOCK.md` | Formas de cargar stock. |
| `IMAGENES_PRODUCTOS_REPUESTOS.md` | Fuentes y uso de imágenes de productos. |

---

## Dónde buscar cosas concretas

- **Login / JWT / permisos** → `backend/apps/usuarios/`, `frontend/src/context/AuthContext.jsx`, `frontend/src/services/authService.js`.
- **Productos, variantes, búsqueda, Excel** → `backend/apps/productos/` (views, search_utils, excel_utils), `frontend/src/services/productosService.js`, páginas `Productos*.jsx`, `ImportarProductos.jsx`.
- **Ventas / POS** → `backend/apps/ventas/`, `frontend/src/pages/PuntoVenta.jsx`, `Ventas.jsx`, `ventasService.js`.
- **Compras, proveedores, adjuntos** → `backend/apps/compras/`, `frontend/src/pages/RegistrarCompra.jsx`, `Compras.jsx`, `comprasService.js`.
- **Stock e inventario** → `backend/apps/inventario/`, `frontend/src/services/inventarioService.js`, páginas `Inventario.jsx`, `AjustarStock.jsx`, `Movimientos.jsx`.
- **Clientes** → `backend/apps/clientes/`, `frontend/src/services/clientesService.js`, páginas `Clientes.jsx`, `ClienteForm.jsx`, `ClienteDetalle.jsx`.
- **Devoluciones** → `backend/apps/devoluciones/`, `frontend/src/pages/Devoluciones.jsx`, `NuevaDevolucion.jsx`, `devolucionesService.js`.
- **Reportes y export** → `backend/apps/reportes/`, `backend/apps/sistema/excel_export.py`, `frontend/src/pages/Reportes.jsx`.
- **Configuración y sistema** → `backend/apps/configuracion/`, `backend/apps/sistema/`, `frontend/src/pages/Configuracion.jsx`, `Backups.jsx`, `AuditLogs.jsx`.
- **AFIP / facturación** → `backend/apps/facturacion/`, `docs/PASOS_ACTIVAR_AFIP.md`.
- **Clover (pagos con tarjeta)** → `backend/apps/clover/`, `docs/INTEGRACION_CLOVER.md`.

Actualizar este documento cuando se agreguen nuevas apps, rutas o servicios.
