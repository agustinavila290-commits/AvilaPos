# Integración WooCommerce

Conecta el inventario del POS con la tienda web (WordPress/WooCommerce): sincronización de stock/precios y recepción de pedidos.

## Autenticación

Todos los endpoints requieren el header **X-API-Key** con el valor configurado en el sistema:

- **Configuración:** Admin → Configuración → `WOOCOMMERCE_API_KEY` (categoría INTEGRACION).
- Si no está configurado o la clave es incorrecta, se responde 401/403.

---

## Fase 1 – Endpoints básicos

### GET /api/woocommerce/productos-stock/

Lista variantes con stock para sincronizar a WooCommerce.

- **Query params:** `deposito_id` (opcional; si no se envía, usa el depósito principal).
- **Response:** `[{ "id", "codigo", "nombre_completo", "precio_web", "stock" }, ...]`

```bash
curl -H "X-API-Key: TU_CLAVE" "http://localhost:8000/api/woocommerce/productos-stock/"
```

### POST /api/woocommerce/pedido-recibido/

Recibe un pedido (formato interno): crea la venta en el POS y descuenta stock (tipo movimiento VENTA_WEB).

- **Body:** `line_items` (array de `{ "codigo": "SKU" }` o `{ "variante_id": 123 }` y `"cantidad"`; opcional `precio_unitario`), `observaciones` opcional.
- **Response (201):** `{ "ok": true, "venta_id", "venta_numero", "total" }`

```bash
curl -X POST -H "X-API-Key: TU_CLAVE" -H "Content-Type: application/json" \
  -d '{"line_items":[{"codigo":"WEB-001","cantidad":2}],"observaciones":"Pedido web"}' \
  "http://localhost:8000/api/woocommerce/pedido-recibido/"
```

---

## Fase 2 – Configuración para sync POS → WooCommerce

Para que el comando de sincronización pueda actualizar WooCommerce, en Configuración (INTEGRACION) deben existir:

- **WOOCOMMERCE_URL** – URL base de la tienda (ej. `https://tienda.ejemplo.com`)
- **WOOCOMMERCE_CONSUMER_KEY** – Consumer key de WooCommerce (REST API)
- **WOOCOMMERCE_CONSUMER_SECRET** – Consumer secret

Código: `apps/woocommerce/config.py` → `get_woocommerce_config()`, `woocommerce_sync_configured()`.

---

## Fase 3 – Sincronización POS → WooCommerce

Comando que lee productos con stock del POS y actualiza stock y precio en WooCommerce (por SKU):

```bash
python manage.py sync_woocommerce
```

- Requiere Fase 2 configurada (URL + consumer key/secret).
- Servicio: `apps/woocommerce/services.py` (`run_sync()`, `get_productos_con_stock()`, etc.).
- En producción se puede programar con cron/tarea programada (ej. cada 5–15 minutos).

---

## Fase 4 – Webhook pedido WooCommerce → POS

Cuando se crea un pedido en WooCommerce, la tienda puede notificar al POS para crear la venta y descontar stock.

### POST /api/woocommerce/webhook-pedido/

Recibe el payload de WooCommerce (Order) y lo convierte al formato interno; misma lógica que `pedido-recibido`.

- **Body (ejemplo):** `{ "id": 123, "number": "456", "line_items": [ { "sku": "CODE", "quantity": 2, "price": "110" }, ... ] }`
- **Response (201):** `{ "ok": true, "venta_id", "venta_numero", "total" }`
- Misma autenticación: header **X-API-Key**.

En WooCommerce se configura un webhook “Order created” que apunte a:

`https://TU-BACKEND/api/woocommerce/webhook-pedido/`

con método POST y el header `X-API-Key: TU_CLAVE`. Los productos en WooCommerce deben tener **SKU** igual al **código** de la variante en el POS.

---

## Tests

```bash
# Desde backend, con venv activado:
python manage.py test apps.woocommerce.tests --verbosity=2
```

O usar `backend\run_tests.bat` para ejecutar tests de woocommerce, ventas, productos, inventario y configuracion.

Incluye tests de: endpoints (productos-stock, pedido-recibido), configuración (Fase 2), servicio de sync (Fase 3) y webhook (Fase 4).

## Probar en producción

Script que verifica los endpoints WooCommerce contra el backend desplegado (sin crear ventas reales):

```bash
cd backend
python scripts/verificar_woocommerce_produccion.py https://TU-API.com TU_WOOCOMMERCE_API_KEY
```

O con variables de entorno:

```bash
set WOO_BASE_URL=https://TU-API.com
set WOO_API_KEY=tu-clave
python scripts/verificar_woocommerce_produccion.py
```

Comprueba: GET productos-stock (200), auth sin API Key (401/403), pedido-recibido y webhook-pedido con body inválido (400).
