# Revisión del sistema y base de datos

Revisión realizada para detectar errores de lógica y conexiones entre módulos, backend y frontend.

---

## 1. Correcciones aplicadas

### 1.1 Stock: atributo incorrecto en productos

- **Problema:** En `apps/productos/serializers.py`, los métodos `get_stock_actual` de `VarianteProductoSerializer` y `VarianteListSerializer` usaban `stock.cantidad_actual`.
- **Realidad:** El modelo `Stock` (inventario) tiene el campo `cantidad`, no `cantidad_actual`.
- **Corrección:** Se reemplazó `stock.cantidad_actual` por `stock.cantidad` en ambos serializers.

### 1.2 VarianteProducto: uso de `sku`

- **Problema:** Varios módulos (compras, ventas, inventario, devoluciones, reportes, sistema) usan `variante.sku`, pero el modelo `VarianteProducto` solo tiene el campo `codigo`.
- **Corrección:** Se agregó en `VarianteProducto` la propiedad `@property def sku(self): return self.codigo` para mantener compatibilidad sin cambiar la base de datos.

### 1.3 Cliente: uso de `nombre_completo`

- **Problema:** Ventas, facturación, sistema (audit, excel_export, whatsapp) y reportes usan `cliente.nombre_completo`, pero el modelo `Cliente` solo tiene `nombre`.
- **Corrección:** Se agregó en `Cliente` la propiedad `@property def nombre_completo(self): return self.nombre`.

### 1.4 Venta: uso de `numero_venta` y `descuento`

- **Problema:** En `apps/sistema/audit.py`, `excel_export.py` y `whatsapp.py` se usaba `venta.numero_venta`; el modelo `Venta` tiene el campo `numero`.
- **Corrección:** Se reemplazó `venta.numero_venta` por `venta.numero` en esos tres archivos.
- **Problema:** En `excel_export.py` se usaba `venta.descuento` y `venta.observaciones`; el modelo tiene `descuento_monto` y no tiene `observaciones`.
- **Corrección:** Se usó `venta.descuento_monto` y, para observaciones, `venta.motivo_anulacion` cuando la venta está anulada (o cadena vacía).

### 1.5 Devoluciones admin: búsqueda por producto

- **Problema:** En `apps/devoluciones/admin.py`, `search_fields` usaba `variante__producto__nombre` y `variante__sku`; la relación es `producto_base` y `sku` no es campo de BD.
- **Corrección:** Se cambió a `variante__producto_base__nombre` y `variante__codigo`.

---

## 2. Mapa de relaciones entre modelos (resumen)

| Origen        | Relación              | Destino        | Uso principal                          |
|---------------|------------------------|----------------|----------------------------------------|
| Venta         | cliente, usuario, deposito | Cliente, Usuario, Deposito | Ventas por cliente y depósito          |
| DetalleVenta  | venta, variante       | Venta, VarianteProducto | Ítems de venta y stock                 |
| Compra        | proveedor, usuario, deposito | Proveedor, Usuario, Deposito | Compras y movimientos de stock        |
| DetalleCompra | compra, variante      | Compra, VarianteProducto | Ítems de compra y actualización costo |
| CompraFacturaAdjunto | compra            | Compra         | Imágenes de facturas de compra         |
| Stock         | variante, deposito     | VarianteProducto, Deposito | Stock por variante y depósito          |
| MovimientoStock | variante, deposito, usuario | VarianteProducto, Deposito, Usuario | Trazabilidad de stock                 |
| DevolucionVenta | venta, usuario, deposito | Venta, Usuario, Deposito | Devoluciones y reingreso de stock     |
| DetalleDevolucion | detalle_venta, variante | DetalleVenta, VarianteProducto | Líneas de devolución                 |
| NotaCredito   | devolucion, cliente    | DevolucionVenta, Cliente | Notas de crédito por cliente          |
| ProductoBase  | marca, categoria      | Marca, Categoria | Catálogo de productos                  |
| VarianteProducto | producto_base       | ProductoBase   | Variantes y precios por producto       |

Los `on_delete` usados (PROTECT/CASCADE) son coherentes con no borrar datos que tienen movimientos o documentos asociados.

---

## 3. Flujos de stock (comprobados)

- **Compra:** `CompraService.crear_compra` crea la compra, los detalles y llama a `InventarioService.registrar_movimiento` con tipo COMPRA (cantidad positiva). El stock se obtiene o crea con `obtener_o_crear_stock`.
- **Venta:** El servicio de ventas registra movimientos con cantidad negativa (salida) y referencia a la venta.
- **Devolución:** El servicio de devoluciones registra movimientos con cantidad positiva (entrada) y referencia a la devolución.
- **Cancelación de compra:** `CompraService.cancelar_compra` registra movimientos negativos para devolver el stock.
- **Ajuste manual:** `InventarioService.ajuste_stock` calcula la diferencia y llama a `registrar_movimiento` con tipo AJUSTE.

No se detectaron incoherencias en signos (entrada/salida) ni en el uso de `obtener_o_crear_stock` vs stock existente.

---

## 4. API y frontend

- **Rutas API:** Bajo `api/` están: auth, clientes, productos, inventario, ventas, compras, reportes, configuracion, devoluciones, sistema, facturacion. Coinciden con las incluidas en `backend/urls.py` y con los `BASE_URL` de los servicios del frontend.
- **Compras:** El frontend usa `createCompra`, `getCompra`, `subirAdjuntoFactura`, `descargarAdjuntoFactura`; los endpoints de compras (crear, detalle, subir/descargar adjuntos) existen y están alineados.
- **Autenticación:** El frontend usa `api` (axios) con `baseURL: '/api'` e interceptor que agrega el token; el refresh usa `/api/auth/token/refresh/`, coherente con la configuración de usuarios.

---

## 5. Verificación Django

Se ejecutó `python manage.py check` y no se reportaron problemas (0 issues).

---

## 6. Recomendaciones posteriores

1. **Migraciones:** Tras cambios de modelos, ejecutar siempre `manage.py makemigrations` y `manage.py migrate` en cada app afectada.
2. **Tests:** Ejecutar tests existentes (por ejemplo `test_sistema_completo.py` si aplica) tras cambios en modelos o servicios.
3. **Usuario y permisos:** Confirmar que `AUTH_USER_MODEL = 'usuarios.Usuario'` está usado en todos los FKs a usuario y que los permisos (IsAdministrador, IsCajero) se aplican donde corresponde.
4. **Depósito principal:** Asegurar que exista al menos un depósito (por ejemplo con el comando `crear_deposito_principal`) para que compras, ventas e inventario funcionen correctamente.

---

*Revisión realizada en base al estado del código y la base de datos del proyecto.*
