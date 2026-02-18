# Precio Tarjeta – Dónde está el código

Referencia rápida para encontrar todo lo relacionado con **precio tarjeta** (costo + 84%).

---

## Backend (Django)

| Qué | Archivo | Notas |
|-----|---------|--------|
| **Modelo** (campo + cálculo al guardar) | `backend/apps/productos/models.py` | Campo `precio_tarjeta`, en `save()` se calcula `costo * 1.84`. |
| **Serializer** (listado/detalle) | `backend/apps/productos/serializers.py` | `VarianteProductoSerializer`: incluye `precio_tarjeta` en `fields`. |
| **Migración** (agregar columna) | `backend/apps/productos/migrations/0002_varianteproducto_precio_tarjeta.py` | Crea la columna `precio_tarjeta`. |
| **Migración** (llenar existentes) | `backend/apps/productos/migrations/0003_precio_tarjeta_costo_mas_84.py` | Actualiza variantes existentes: `precio_tarjeta = costo * 1.84`. |
| **Script opcional** (otra fórmula) | `backend/actualizar_precios_tarjeta.py` | Script por si se quiere usar otra regla (ej. % sobre mostrador). |

**Endpoints que devuelven `precio_tarjeta`:**
- `GET /productos/variantes/` (listado y búsqueda con `?search=`)
- `GET /productos/variantes/{id}/`
- `GET /productos/variantes/buscar_codigo/?codigo=...`

Si el precio tarjeta sale en 0: revisar que las migraciones estén aplicadas (`python manage.py migrate productos`).

---

## Frontend (React)

| Dónde se usa | Archivo | Uso |
|--------------|---------|-----|
| **Listado Productos** | `frontend/src/pages/Productos.jsx` | Columna "P. Tarjeta" (azul), valor `variante.precio_tarjeta`. |
| **POS – Modal búsqueda (F10)** | `frontend/src/pages/PuntoVenta.jsx` | Columna "P. Tarjeta" en tabla de resultados; precio al agregar según método de pago. |
| **POS – Precio por ítem** | `frontend/src/pages/PuntoVenta.jsx` | `getPrecioSegunMetodo()` usa `precio_tarjeta` si método es TARJETA. |
| **Registrar Compra** | `frontend/src/pages/RegistrarCompra.jsx` | Tabla de búsqueda: columna "P. Tarjeta". |

**Servicio:** `frontend/src/services/productosService.js`  
- No define el campo; lo que devuelve el backend en cada variante (incluido `precio_tarjeta`) se usa tal cual.

---

## Fórmula actual

- **Backend:** `precio_tarjeta = costo * 1.84` (costo + 84%), calculado en `VarianteProducto.save()` y en la migración `0003`.

---

*Última actualización: referencia creada para no perder ubicación del código.*
