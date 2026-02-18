# Integración Clover (POSnet)

**Estado**: Implementado. Requiere configurar credenciales y dispositivo Clover.

---

## Resumen

El sistema puede procesar pagos con tarjeta usando el **dispositivo Clover (POSnet)** conectado directamente al flujo del POS:

1. En el Punto de Venta, el usuario elige método de pago **Tarjeta** (F11).
2. Al cobrar (F12), si el método es Tarjeta, se envía el monto a Clover y se muestra el modal "Procesando pago... Pase la tarjeta en el dispositivo Clover".
3. El backend crea una orden y un pago en la API de Clover; el dispositivo físico muestra el monto y el cliente pasa la tarjeta.
4. Si el pago es aprobado, se crea la venta en el sistema y se vincula el registro del pago Clover. Si es rechazado o cancelado, no se crea la venta y se muestra el error.

---

## Estructura en el proyecto

| Ubicación | Descripción |
|-----------|-------------|
| `backend/apps/clover/` | App Django Clover |
| `backend/apps/clover/models.py` | `CloverConfig`, `CloverPago` |
| `backend/apps/clover/clover_api.py` | Cliente REST para API Clover |
| `backend/apps/clover/services.py` | `CloverPayService.procesar_pago()` |
| `backend/apps/clover/views.py` | `POST /api/clover/procesar-pago/`, `GET /api/clover/config/` |
| `frontend/src/services/cloverService.js` | `procesarPagoClover()`, `getConfigClover()` |
| `frontend/src/pages/PuntoVenta.jsx` | Flujo: Tarjeta → Clover → crear venta con `clover_pago_id` |

---

## Configuración

### 1. Credenciales Clover

Necesitás:

- **Merchant ID**: ID del comercio en Clover.
- **Access Token**: Token OAuth (desde el panel de desarrollador Clover).
- **URL del endpoint**:
  - **REST Pay Display** (dispositivo en red local): `http://IP_DISPOSITIVO:8080` (reemplazá por la IP del equipo Clover).
  - **Cloud Pay Display**: `https://api.clover.com`.

### 2. Configurar en Django Admin

1. Entrá a **Admin** → **Clover (POSnet)** → **Configuraciones Clover**.
2. **Agregar configuración Clover**.
3. Completar:
   - **Nombre**: ej. "POS Principal".
   - **Merchant ID**: tu Merchant ID.
   - **Access Token**: token de Clover.
   - **Tipo de integración**: REST Pay Display (red local) o Cloud Pay Display (nube).
   - **URL del endpoint**: según el tipo (IP:puerto o `https://api.clover.com`).
   - **Activo**: marcado.
4. Guardar.

### 3. Sin configuración

Si no hay ninguna configuración Clover activa, al cobrar con Tarjeta el sistema responderá con error: *"Clover no está configurado. Configure en Admin o Configuración."* En ese caso no se procesa pago en dispositivo ni se crea la venta hasta que el pago sea exitoso vía Clover (o se use Efectivo/Transferencia).

---

## Flujo técnico

1. **Frontend (POS)**  
   - Método de pago = Tarjeta → `procesarPagoClover({ monto, descripcion, orden_id })`.  
   - Muestra modal "Procesando pago... Pase la tarjeta en el dispositivo Clover".

2. **Backend**  
   - `CloverPayService.procesar_pago(monto, descripcion, orden_id_externo)`:
     - Carga `CloverConfig` activa.
     - Crea orden en Clover (`create_order`).
     - Crea pago en Clover (`create_payment`); el dispositivo muestra el monto.
     - Espera resultado con `wait_for_payment_result` (polling hasta APPROVED/DECLINED/CANCELLED o timeout).
     - Guarda `CloverPago` (monto, estado, datos de respuesta).
   - Responde `{ exito, payment_id, estado, datos, error, clover_pago_id }`.

3. **Frontend**  
   - Si `exito === true`: arma `ventaData` con `clover_pago_id` y llama `createVenta(ventaData)`.
   - **Ventas (backend)**: al crear la venta, si viene `clover_pago_id`, actualiza `CloverPago.venta = venta` para vincular pago y venta.

---

## API

- **POST /api/clover/procesar-pago/**  
  Body: `{ "monto": 1500.00, "descripcion": "Venta", "orden_id": "opcional" }`  
  Requiere autenticación. Devuelve el resultado del pago (éxito, estado, error, `clover_pago_id`).

- **GET /api/clover/config/**  
  Requiere autenticación. Devuelve `{ "activo": true/false, "nombre": "..." }` según exista configuración Clover activa.

---

## Recursos Clover

- [Guía desarrolladores LATAM (Argentina)](https://docs.clover.com/dev/docs/quick-reference-guides-latam-developers)
- [REST Pay Display](https://docs.clover.com/dev/docs/rest-pay-overview)
- [Clover Argentina - Desarrolladores](https://ar.clover.com/desarrolladores)

Actualizar este documento si se agregan opciones (ej. múltiples dispositivos o tipos de pago).
