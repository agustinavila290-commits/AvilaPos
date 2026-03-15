# 🌙 DARK MODE - APLICADO A TODAS LAS VENTANAS

## ✅ Resumen

Se aplicó modo oscuro **en todo el sistema**, ventana por ventana, de dos formas:

1. **Páginas con dark mode explícito** (clases `dark:` en el JSX)
2. **Reglas globales en CSS** que convierten automáticamente colores claros en oscuros cuando `.dark` está en `<html>`

---

## 📄 VENTANAS CON DARK MODE EXPLÍCITO

### 1. ✅ **Login.jsx**
- Fondo: `dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`
- Card: `dark:bg-slate-800 dark:border-slate-700`
- Títulos y texto: `dark:text-gray-100`, `dark:text-gray-400`
- Error: `dark:bg-red-900/30 dark:border-red-800 dark:text-red-300`
- Labels: `dark:text-gray-300`
- Credenciales: `dark:from-blue-900/30 dark:to-blue-800/30`
- Botón: `dark:from-blue-600 dark:to-blue-700`

### 2. ✅ **PuntoVenta.jsx**
- Contenedor: `dark:bg-slate-900`
- Header azul: `dark:from-blue-700 dark:to-blue-800`
- Card búsqueda: `dark:bg-slate-800 dark:border-slate-700`
- Input: `dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100`
- Error: `dark:bg-red-900/30 dark:border-red-800 dark:text-red-300`
- Ticket: `dark:bg-slate-800`, header `dark:from-slate-700 dark:to-slate-600`
- Items (móvil): `dark:border-slate-600 dark:bg-slate-700/50`
- Tabla thead: `dark:from-slate-700 dark:to-slate-600 dark:border-slate-600`
- Tabla celdas: `dark:text-gray-200`, `dark:border-slate-700`, `dark:hover:bg-slate-700/50`
- Cliente card: `dark:bg-slate-800`, botones y textos
- Método de pago: `dark:bg-slate-800`, botones CONTADO/TARJETA
- Totales: `dark:bg-slate-800`, inputs y textos

### 3. ✅ **Dashboard.jsx**
- Título: `dark:text-gray-100`
- Subtítulo: `dark:text-gray-400`
- Cards de módulos: títulos `dark:text-gray-100`, textos `dark:text-gray-400`
- Badges: `dark:text-green-300 dark:bg-green-900/40`
- SoftCard Estado: `dark:from-slate-800 dark:to-slate-700 dark:border-slate-600`
- Textos internos: `dark:text-gray-300`, `dark:text-green-400`

### 4. ✅ **Layout.jsx** (ya estaba)
- Sidebar: `dark:bg-slate-800 dark:border-slate-700`
- Logo, usuario, ítems, botones, header móvil

### 5. ✅ **SoftCard.jsx**
- Borde header: `dark:border-slate-600`
- Icono: `dark:from-blue-600 dark:to-blue-700`
- Título: `dark:text-gray-100`

### 6. ✅ **MetricCard.jsx**
- Título: `dark:text-gray-400`
- Valor: `dark:text-gray-100`
- Subtitle y trend: `dark:text-gray-400`, `dark:text-green-400`, `dark:text-red-400`

---

## 🎨 REGLAS GLOBALES (index.css)

Estas reglas aplican a **cualquier ventana** que use estas clases:

| Clase light     | En dark mode   |
|-----------------|----------------|
| `.bg-white`     | `bg-slate-800` |
| `.bg-gray-50`   | `bg-slate-900` |
| `.bg-gray-100`  | `bg-slate-700` |
| `.text-gray-900`| `text-gray-100`|
| `.text-gray-800`| `text-gray-100`|
| `.text-gray-700`| `text-gray-300`|
| `.text-gray-600`| `text-gray-400`|
| `.text-gray-500`| `text-gray-500`|
| `.text-gray-400`| `text-gray-500`|
| `.border-gray-200` | `border-slate-600` |
| `.border-gray-100` | `border-slate-600` |
| `.hover:bg-gray-50` | `bg-slate-700` (al hover) |
| `.hover:bg-gray-100`| `bg-slate-600` (al hover) |
| `table thead`   | `bg-slate-700 border-slate-600` |
| `table tbody tr`| `border-slate-700`, hover `bg-slate-700/50` |
| `table td, th`  | `text-gray-200` |
| `.btn-secondary` | `bg-slate-700 text-gray-200 border-slate-600` |
| `.card`        | `bg-slate-800 border-slate-700 text-gray-100` |
| `.metric-card` | `bg-slate-800 border-slate-700 text-gray-100` |
| `.input-field` | `bg-slate-800 border-slate-600 text-gray-100` |

---

## 📋 VENTANAS CUBIERTAS POR REGLAS GLOBALES

Todas las que usan las clases anteriores quedan en dark mode sin tocar el JSX:

- **Ventas.jsx** – listado, filtros, tabla
- **VentaDetalle.jsx** – detalle, botones, cards
- **Productos.jsx** – listado, búsqueda, tabla
- **ProductoDetalle.jsx** – formulario, datos
- **ProductoNuevo.jsx** – formulario
- **ImportarProductos.jsx** – formulario y mensajes
- **Clientes.jsx** – listado, búsqueda, tabla
- **ClienteDetalle.jsx** – datos, historial
- **ClienteForm.jsx** – formulario
- **Inventario.jsx** – filtros, tabla
- **StockCritico.jsx** – listado
- **AjustarStock.jsx** – formulario
- **Movimientos.jsx** – tabla
- **Compras.jsx** – listado, filtros
- **CompraDetalle.jsx** – detalle
- **RegistrarCompra.jsx** – formulario
- **Reportes.jsx** – tabs, gráficos, tablas
- **Configuracion.jsx** – formularios
- **Backups.jsx** – listado, acciones
- **AuditLogs.jsx** – tabla
- **Devoluciones.jsx** – listado
- **NuevaDevolucion.jsx** – formulario

---

## 🔄 CÓMO PROBAR

1. Iniciar sesión.
2. En el sidebar, hacer clic en **“Modo Oscuro”**.
3. Recorrer cada ventana:
   - Punto de Venta, Ventas, Venta detalle  
   - Productos, Producto detalle, Producto nuevo, Importar  
   - Clientes, Cliente detalle, Cliente nuevo/editar  
   - Inventario, Stock crítico, Ajustar stock, Movimientos  
   - Compras, Compra detalle, Registrar compra  
   - Reportes, Configuración, Backups, Audit Logs  
   - Devoluciones, Nueva devolución  
   - Login (cerrar sesión y abrir de nuevo)

En todas deberías ver fondo oscuro, cards y tablas en tonos slate y texto claro.

---

## ✅ ESTADO FINAL

- **Login:** dark mode explícito  
- **Punto de Venta:** dark mode explícito  
- **Dashboard:** dark mode explícito  
- **Layout (sidebar + header):** dark mode explícito  
- **SoftCard y MetricCard:** dark mode explícito  
- **Resto de ventanas:** dark mode vía reglas globales en `index.css`  

Modo oscuro aplicado en todo el sistema POS.
