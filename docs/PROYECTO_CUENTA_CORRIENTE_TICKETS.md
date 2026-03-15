# Proyecto de desarrollo: Cuenta corriente con tickets diferenciados

Documento de planificación para implementar **tickets a cuenta corriente** en el sistema existente: un cliente (mecánico) puede tener **varios tickets abiertos** (por trabajo/moto), en cada uno se agregan o devuelven productos hasta el cierre; el stock se descuenta al agregar y se devuelve al restar; al abonar se cierra el ticket y se genera la venta.

---

## 1. Objetivo

- **Subdivisión por cliente:** varios **tickets** por cliente, diferenciados (ej. “Moto 110 – trabajo 1”, “Moto 110 – trabajo 2”).
- **Estados de ticket:** **A saldar** (abierto) y **Abonado** (cerrado y cobrado).
- **Stock:** se descuenta al **agregar** ítem al ticket; si el mecánico **devuelve**, se resta del ticket y se **devuelve al stock**; no se vuelve a descontar al cobrar.
- **Cierre:** al abonar, se genera una **Venta** con los ítems finales del ticket y se marca el ticket como **Abonado**.

---

## 2. Base actual del sistema (resumen)

| Componente | Ubicación | Uso en este proyecto |
|------------|-----------|----------------------|
| **Cliente** | `apps/clientes/models.py` | Sin cambios. Cada ticket pertenece a un cliente. |
| **Venta / DetalleVenta** | `apps/ventas/models.py` | Se reutilizan: al cerrar ticket se crea una Venta con sus DetalleVenta. |
| **VentaService.crear_venta** | `apps/ventas/services.py` | No usar tal cual (descuenta stock). Al cerrar ticket usaremos lógica que **no** vuelva a descontar (stock ya movido con el ticket). |
| **InventarioService.registrar_movimiento** | `apps/inventario/services.py` | Se usa al agregar ítem al ticket (salida) y al devolver ítem (entrada). |
| **MovimientoStock** | `apps/inventario/models.py` | Agregar tipo(s) para ticket cuenta corriente (ver más abajo). |
| **Deposito** | `apps/inventario/models.py` | El ticket usa un depósito (mismo criterio que ventas). |
| **Devoluciones** | `apps/devoluciones/` | Son post-venta. Las “devoluciones” dentro del ticket son otra cosa: solo ajuste de líneas + devolución de stock; no usar NotaCrédito aquí. |

---

## 3. Modelo de datos propuesto

### 3.1 Dónde ubicar la funcionalidad

- **Opción A:** Nueva app `apps/cuenta_corriente` (tickets, detalles, servicio de alta/devolución/cierre).
- **Opción B:** Dentro de `apps/ventas` (modelos `TicketCuentaCorriente` y `DetalleTicketCC`).

Recomendación: **Opción A** para mantener ventas enfocada en venta cerrada y dejar cuenta corriente con su propio servicio y reglas.

### 3.2 Modelo: Ticket de cuenta corriente

- **TicketCuentaCorriente**
  - `cliente` (FK a Cliente)
  - `deposito` (FK a Deposito) — de dónde sale el stock
  - `usuario_apertura` (FK User) — quien abre el ticket
  - `numero` — número legible (autoincremental, como Venta.numero)
  - `identificador` / `descripcion` — texto libre para diferenciar (ej. “Moto 110”, “Reparación Juan”)
  - `estado`: **A_SALDAR** | **ABONADO**
  - `fecha_apertura`, `fecha_cierre` (null hasta abonar)
  - `venta` (FK a Venta, null hasta abonar) — al cerrar, se crea la Venta y se asocia aquí
  - `usuario_cierre` (FK User, null hasta abonar)
  - Totales calculados o guardados: `subtotal`, `total` (opcional; se pueden calcular desde detalles)

### 3.3 Modelo: Detalle del ticket

- **DetalleTicketCC**
  - `ticket` (FK a TicketCuentaCorriente)
  - `variante` (FK a VarianteProducto)
  - `cantidad` (entero ≥ 1)
  - `precio_unitario`, `descuento_unitario`, `subtotal` — igual criterio que DetalleVenta
  - `costo_unitario` — para margen al cerrar
  - Sin “devolución” como entidad aparte: si devuelven, se **reduce la cantidad** de la línea (o se elimina si queda 0) y se registra movimiento de stock de entrada.

Regla: si el mecánico devuelve **parte** de lo que llevó, se edita la cantidad del detalle (ej. de 2 a 1), se devuelve 1 al stock y se recalcula el subtotal del ticket.

### 3.4 Movimientos de stock

- En `MovimientoStock.TipoMovimiento` agregar, por ejemplo:
  - `SALIDA_TICKET_CC` — al agregar ítem al ticket (cantidad negativa).
  - `DEVOLUCION_TICKET_CC` — al devolver ítem desde el ticket (cantidad positiva).
- `referencia_tipo` = `'ticket_cc'`, `referencia_id` = id del `TicketCuentaCorriente` (y opcionalmente en observaciones el id del detalle si se quiere trazabilidad fina).

---

## 4. Flujos de negocio

### 4.1 Crear ticket (abrir)

- Cliente + depósito + descripción/identificador.
- Crear `TicketCuentaCorriente` (estado A_SALDAR), sin detalles.
- No hay movimiento de stock.

### 4.2 Agregar ítem al ticket

- Ticket en A_SALDAR.
- Variante + cantidad + precio (y opcional descuento).
- Crear o actualizar `DetalleTicketCC` (si ya existe la variante en el ticket, sumar cantidad).
- Llamar `InventarioService.registrar_movimiento` con cantidad **negativa**, tipo `SALIDA_TICKET_CC`, `referencia_tipo='ticket_cc'`, `referencia_id=ticket.id`.

### 4.3 Devolver ítem (restar del ticket)

- Ticket en A_SALDAR.
- Sobre un detalle existente: reducir `cantidad` (o borrar línea si queda 0).
- Llamar `InventarioService.registrar_movimiento` con cantidad **positiva** (lo que se devuelve), tipo `DEVOLUCION_TICKET_CC`, misma referencia al ticket.
- Recalcular subtotal del detalle y del ticket.

### 4.4 Cerrar ticket (abonar)

- Ticket en A_SALDAR, con al menos un detalle con cantidad > 0.
- Crear **Venta** con los datos del ticket (cliente, depósito, usuario_cierre, totales).
- Crear **DetalleVenta** por cada `DetalleTicketCC` (mismas variantes, cantidades, precios).
- **No** llamar a `VentaService.crear_venta` (ese método descuenta stock). En su lugar:
  - Crear `Venta` y `DetalleVenta` a mano (o un método nuevo `VentaService.crear_venta_desde_ticket_cc` que no registre movimientos de stock).
- Marcar ticket: estado = ABONADO, `venta` = venta creada, `fecha_cierre`, `usuario_cierre`.
- Opcional: método de pago y fecha de la venta según lo que se use al cobrar.

---

## 5. Backend (tareas concretas)

1. **Inventario**
   - En `MovimientoStock.TipoMovimiento` agregar `SALIDA_TICKET_CC` y `DEVOLUCION_TICKET_CC`.
2. **App cuenta_corriente (o en ventas)**
   - Modelos: `TicketCuentaCorriente`, `DetalleTicketCC`.
   - Migraciones.
3. **Servicio**
   - `TicketCuentaCorrienteService` (o en un `services.py` de la app):
     - `abrir_ticket(cliente, deposito, usuario, descripcion)`
     - `agregar_item(ticket, variante, cantidad, precio_unitario, usuario, descuento_unitario=0)`
     - `devolver_item(ticket, detalle_ticket_cc, cantidad_a_devolver, usuario)` — reducir cantidad del detalle, registrar entrada de stock.
     - `cerrar_ticket(ticket, usuario, metodo_pago)` — crear Venta + DetalleVenta sin descontar stock, actualizar ticket.
4. **API**
   - URLs bajo `/api/cuenta-corriente/` (o `/api/ventas/tickets-cc/` si se hace en ventas):
     - Listar tickets por cliente (y filtro estado A_SALDAR / ABONADO).
     - Crear ticket.
     - Detalle de ticket (con líneas).
     - Agregar ítem.
     - Devolver ítem (por detalle y cantidad).
     - Cerrar ticket (abonar).
   - Serializers para ticket y detalle; validaciones (ticket abierto, stock disponible al agregar, etc.).
5. **Permisos**
   - Reutilizar lógica de ventas (cajero/admin) para abrir, agregar, devolver y cerrar.

---

## 6. Frontend (tareas concretas)

1. **Rutas y menú**
   - Ruta tipo `/cuenta-corriente` (listado de tickets, filtrable por cliente y estado).
   - Ruta `/cuenta-corriente/nuevo` (elegir cliente, depósito, descripción → abrir ticket).
   - Ruta `/cuenta-corriente/:id` (detalle del ticket: líneas, botones agregar / devolver / cerrar).
2. **Listado**
   - Tabla o cards: cliente, descripción, estado (A saldar / Abonado), total, fecha apertura, fecha cierre si aplica. Filtros por cliente y estado.
3. **Detalle del ticket**
   - Mostrar líneas (producto, cantidad, precio, subtotal).
   - Acción “Agregar producto” (buscador de variantes, cantidad, precio) → llama a agregar ítem.
   - Por línea: “Devolver” (cantidad a devolver) → llama a devolver ítem; actualizar lista y totales.
   - Botón “Abonar” → modal o pantalla de cierre (método de pago, confirmar) → cerrar ticket y redirigir a la venta creada o a listado.
4. **Servicio API**
   - `cuentaCorrienteService.js` (o dentro de `ventasService.js`): `getTickets`, `getTicket(id)`, `crearTicket`, `agregarItem`, `devolverItem`, `cerrarTicket`.
5. **Integración con clientes**
   - En detalle de cliente, sección “Tickets a cuenta corriente” (en curso y/o abonados) con enlaces al ticket.

---

## 7. Fases del plan de desarrollo

| Fase | Contenido | Estado |
|------|-----------|--------|
| **1. Modelos y stock** | Modelos TicketCuentaCorriente y DetalleTicketCC; tipos SALIDA_TICKET_CC y DEVOLUCION_TICKET_CC en MovimientoStock; app cuenta_corriente; migraciones. | ✅ Hecho |
| **2. Servicio y API** | TicketCuentaCorrienteService (abrir, agregar, devolver, cerrar); serializers; ViewSet; URLs `/api/cuenta-corriente/`. | ✅ Hecho |
| **3. Listado y alta** | Frontend: rutas, listado de tickets, filtros, formulario abrir nuevo ticket. | ✅ Hecho |
| **4. Detalle y movimientos** | Pantalla detalle: líneas, agregar ítem, devolver ítem. | ✅ Hecho |
| **5. Cierre y venta** | Cerrar ticket → crear Venta sin descontar stock; botón Abonar en frontend. | ✅ Hecho |
| **6. Ajustes** | Link desde Cliente a tickets, reportes si aplica. | ✅ Hecho |

### Tareas por fase (detalle)

**Fase 2:** `services.py`, `serializers.py`, `views.py`, `urls.py`, registro en `backend/urls.py`.

**Fase 3:** `cuentaCorrienteService.js`, `CuentaCorriente.jsx`, `NuevoTicketCC.jsx`, rutas en `App.jsx`, menú en `Layout.jsx`.

**Fase 4:** `TicketDetalle.jsx`, modal/buscador agregar producto, botón devolver por línea.

**Fase 5:** `VentaService.crear_venta_desde_ticket_cc`, endpoint cerrar, modal método de pago, redirección a venta.

**Fase 6:** Sección en `ClienteDetalle.jsx` con listado de tickets del cliente.

---

## 8. Puntos a tener presentes

- **Stock:** al agregar ítem al ticket validar stock disponible (como en POS); al devolver, no superar la cantidad que tiene el detalle.
- **Precios:** tomar precio de la variante (precio_mostrador o el que usen en ventas) al agregar; permitir edición si el negocio lo requiere.
- **Concurrencia:** dos usuarios no deberían modificar el mismo ticket a la vez; en una primera versión puede bastar con reglas de uso; si hace falta, luego se puede acotar con bloqueos o mensajes en UI.
- **Cuenta corriente en papel:** este desarrollo reemplaza/formaliza ese proceso; no hace falta migrar datos viejos si no existen en sistema.

---

## 9. Referencia rápida de archivos actuales

- Clientes: `backend/apps/clientes/models.py`, `views.py`, `serializers.py`
- Ventas: `backend/apps/ventas/models.py`, `services.py`, `views.py`
- Inventario: `backend/apps/inventario/models.py` (MovimientoStock), `services.py` (InventarioService.registrar_movimiento)
- Frontend rutas: `frontend/src/App.jsx`
- Servicios frontend: `frontend/src/services/`

Al implementar, conviene seguir las mismas convenciones (nombres de serializers, respuestas de API, manejo de errores) que en ventas y clientes.
