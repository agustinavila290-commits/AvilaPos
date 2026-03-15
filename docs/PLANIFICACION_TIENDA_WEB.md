# Planificación: Tienda Online Avila Motor Repuesto

**Documento de planificación** para la implementación de la tienda de venta de productos en avila-web, usando el backend Django del POS (sin WooCommerce).

---

## 1. Objetivo

Construir una **tienda online propia** integrada con el sistema POS existente:
- Catálogo público de productos (stock y precios del POS)
- Carrito de compras
- Checkout y generación de pedidos
- Las ventas se registran en el POS y descuentan stock

**No se usa WooCommerce**: todo el desarrollo es propio (avila-web + API del POS).

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────┐
│  avila-web (React + Vite)                                        │
│  avilamotorepuesto.com.ar                                        │
│                                                                  │
│  Landing │ Catálogo │ Producto │ Carrito │ Checkout │ Confirma   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │  HTTP (fetch/axios)
                                │  /api/tienda/...
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Django (POS)                                            │
│  app.avilamotorepuesto.com.ar (o mismo dominio con reverse proxy)│
│                                                                  │
│  /api/tienda/productos/      → Catálogo público                  │
│  /api/tienda/productos/:id/  → Detalle público                   │
│  /api/tienda/categorias/     → Categorías (público)              │
│  /api/tienda/marcas/         → Marcas (público)                  │
│  /api/tienda/pedidos/        → POST crear pedido (crea Venta)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Datos que ya existen en el POS

| Entidad | Modelo | Campos clave | Uso en tienda |
|---------|--------|--------------|---------------|
| **VarianteProducto** | productos | id, codigo, nombre_completo, precio_web, marca, producto_base | Producto vendible |
| **ProductoBase** | productos | nombre, descripcion, marca, categoria, imagen | Agrupación y detalle |
| **Categoria** | productos | nombre | Filtros y navegación |
| **Marca** | productos | nombre | Filtros y navegación |
| **Stock** | inventario | cantidad por depósito | Mostrar disponibilidad |
| **Depósito principal** | inventario | es_principal | De ahí sale el stock web |

---

## 4. Backend: endpoints necesarios

Los endpoints actuales de productos requieren **JWT** (login). La tienda es **pública**, por lo que se necesitan nuevos endpoints sin autenticación.

### 4.1 Crear app o módulo `tienda` en el backend

**Opción recomendada:** Nueva app `backend/apps/tienda/` con vistas de solo lectura para catálogo y un endpoint para crear pedidos.

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/tienda/productos/` | GET | Ninguna | Lista variantes con stock y precio_web (depósito principal). Paginado. Filtros: categoria, marca, search |
| `/api/tienda/productos/:id/` | GET | Ninguna | Detalle de una variante (nombre, descripcion, precio_web, stock, marca, categoria) |
| `/api/tienda/categorias/` | GET | Ninguna | Lista categorías activas (para filtros) |
| `/api/tienda/marcas/` | GET | Ninguna | Lista marcas activas (para filtros) |
| `/api/tienda/pedidos/` | POST | Ninguna* | Crea pedido: body `{ line_items: [{ variante_id, cantidad }], datos_cliente, observaciones }` → crea Venta y descuenta stock |

\* Se puede agregar rate limiting, CORS estricto o token simple para mitigar abusos.

### 4.2 Reutilización de lógica existente

- La función `_procesar_pedido_web()` en `apps/woocommerce/views.py` ya crea la venta y descuenta stock. Se puede extraer a un servicio compartido y usarla desde el nuevo endpoint.
- El endpoint `productos-stock` de WooCommerce devuelve la estructura necesaria; se adapta como base para `/api/tienda/productos/`.

### 4.3 Formato de datos

**GET /api/tienda/productos/** (ejemplo de ítem):

```json
{
  "id": 123,
  "codigo": "ACEITE-1L",
  "nombre_completo": "Aceite Honda 10W40 - 1L",
  "precio_web": "1500.00",
  "stock": 25,
  "marca": "Honda",
  "categoria": "Lubricantes",
  "imagen_url": "/media/productos/aceite.jpg"
}
```

**POST /api/tienda/pedidos/** (body):

```json
{
  "line_items": [
    { "variante_id": 123, "cantidad": 2 }
  ],
  "datos_cliente": {
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "telefono": "11 1234-5678",
    "direccion": "Calle 123, Localidad"
  },
  "observaciones": "Envío a domicilio"
}
```

---

## 5. Frontend (avila-web): estructura de páginas

### 5.1 Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Home | Landing (actual, se puede mejorar) |
| `/productos` | Catálogo | Grid de productos con filtros |
| `/productos/:id` | ProductoDetalle | Detalle, selector de cantidad, "Agregar al carrito" |
| `/carrito` | Carrito | Resumen del carrito, editar cantidades, "Ir al checkout" |
| `/checkout` | Checkout | Formulario datos cliente + confirmar pedido |
| `/confirmacion/:pedidoId` | Confirmacion | "Pedido recibido", número de venta |
| `/contacto`, `/privacidad`, `/terminos` | (existentes) | Sin cambios |

### 5.2 Componentes

```
src/
├── components/
│   ├── Layout.jsx         (existente, agregar link Carrito)
│   ├── Header.jsx         (existente, agregar icono carrito + contador)
│   ├── Footer.jsx         (existente)
│   ├── ProductCard.jsx    (nuevo: card de producto para el catálogo)
│   ├── CarritoWidget.jsx  (nuevo: icono + badge en header)
│   └── FiltrosCatalogo.jsx (nuevo: categoría, marca, búsqueda)
├── pages/
│   ├── Home.jsx           (existente)
│   ├── Catalogo.jsx       (nuevo, reemplaza placeholder)
│   ├── ProductoDetalle.jsx (nuevo)
│   ├── Carrito.jsx        (nuevo)
│   ├── Checkout.jsx       (nuevo)
│   ├── Confirmacion.jsx   (nuevo)
│   ├── Contacto.jsx       (existente)
│   ├── Privacidad.jsx     (existente)
│   └── Terminos.jsx       (existente)
├── services/
│   └── tiendaService.js   (nuevo: fetch productos, categorias, marcas, crear pedido)
├── context/
│   └── CarritoContext.jsx (nuevo: estado global del carrito)
└── data/
    └── contacto.js        (existente)
```

---

## 6. Flujo de usuario

```
1. Usuario entra a la web
   └─> Landing o directo a /productos

2. Navega el catálogo
   └─> Filtra por categoría, marca, búsqueda
   └─> Ve cards con imagen, nombre, precio, stock

3. Click en producto
   └─> /productos/:id
   └─> Ve detalle, elige cantidad
   └─> "Agregar al carrito"

4. Carrito (persistido en localStorage)
   └─> Puede seguir comprando o ir a /carrito
   └─> En /carrito: ve ítems, modifica cantidades, elimina

5. Checkout
   └─> Formulario: nombre, email, teléfono, dirección
   └─> "Confirmar pedido"

6. Pedido enviado al backend
   └─> POST /api/tienda/pedidos/
   └─> Backend crea Venta en POS, descuenta stock
   └─> Respuesta: { venta_numero, venta_id }

7. Página de confirmación
   └─> "Pedido #123 recibido. Te contactaremos para coordinar pago y envío."
   └─> Carrito se vacía
```

---

## 7. Carrito: persistencia y estado

- **Estado:** React Context (`CarritoContext`) con ítems `{ variante_id, cantidad, precio_web, nombre }`
- **Persistencia:** `localStorage` para que no se pierda al recargar
- **Sincronización:** Al cargar la página, se valida stock actual (opcional, o se valida solo en checkout)
- **Límite:** Solo productos con `stock > 0` se pueden agregar (o se muestra "Sin stock")

---

## 8. Consideraciones de diseño

- **Responsive:** Mobile-first (muchos usuarios en celular)
- **Velocidad:** Catálogo paginado, imágenes optimizadas
- **Accesibilidad:** Labels, contraste, navegación por teclado
- **SEO:** Títulos y meta por página, URLs amigables
- **Imágenes:** El POS tiene `ProductoBase.imagen`; en la web usar esa URL o placeholder si no hay imagen

---

## 9. Seguridad y validaciones

- **CORS:** Restringir orígenes permitidos al dominio de la tienda
- **Rate limiting:** Limitar POST /api/tienda/pedidos/ por IP (ej. 5 pedidos/hora)
- **Validación:** Stock disponible al crear pedido; si no hay stock, responder error y no crear venta
- **Datos cliente:** Validar email, teléfono; evitar campos innecesarios
- **Sin datos sensibles:** No guardar tarjetas; el pago se coordina después (transferencia, etc.)

---

## 10. Fases de implementación

### Fase 1: Backend – API pública de tienda
**Objetivo:** Endpoints públicos para catálogo y pedidos.

| Tarea | Descripción |
|-------|-------------|
| 1.1 | Crear app `tienda` en Django |
| 1.2 | GET /api/tienda/productos/ (listado con stock, precio_web, filtros) |
| 1.3 | GET /api/tienda/productos/:id/ (detalle) |
| 1.4 | GET /api/tienda/categorias/ y /api/tienda/marcas/ |
| 1.5 | POST /api/tienda/pedidos/ (reutilizar lógica de pedido web) |
| 1.6 | Configurar CORS para el dominio de la tienda |
| 1.7 | Rate limiting en POST pedidos (opcional) |

### Fase 2: Frontend – Catálogo y detalle
**Objetivo:** Navegación por productos.

| Tarea | Descripción |
|-------|-------------|
| 2.1 | Servicio `tiendaService.js` (fetch productos, categorías, marcas) |
| 2.2 | Página Catálogo con grid de productos |
| 2.3 | Componente ProductCard |
| 2.4 | Filtros (categoría, marca, búsqueda) |
| 2.5 | Página ProductoDetalle |
| 2.6 | Rutas en App.jsx |
| 2.7 | Link "Productos" en Header |

### Fase 3: Frontend – Carrito
**Objetivo:** Agregar al carrito y gestionar ítems.

| Tarea | Descripción |
|-------|-------------|
| 3.1 | CarritoContext (estado + localStorage) |
| 3.2 | CarritoWidget en Header (icono + cantidad) |
| 3.3 | Página Carrito (listado, editar, eliminar) |
| 3.4 | Botón "Agregar al carrito" en ProductoDetalle |

### Fase 4: Frontend – Checkout y confirmación
**Objetivo:** Completar la compra.

| Tarea | Descripción |
|-------|-------------|
| 4.1 | Página Checkout con formulario de datos cliente |
| 4.2 | Envío a POST /api/tienda/pedidos/ |
| 4.3 | Manejo de errores (stock insuficiente, etc.) |
| 4.4 | Página Confirmación con número de pedido |
| 4.5 | Vaciar carrito tras compra exitosa |

### Fase 5: Ajustes y mejoras
**Objetivo:** Pulir UX y estabilidad.

| Tarea | Descripción |
|-------|-------------|
| 5.1 | Paginación en catálogo |
| 5.2 | Placeholder de imagen si no hay foto |
| 5.3 | Mensajes de carga y error |
| 5.4 | Revisar responsive en móvil |
| 5.5 | Textos y mensajes de la tienda |

---

## 11. Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, Vite, React Router v6 |
| Estilos | CSS (actual) o Tailwind si se incorpora |
| HTTP | fetch o axios |
| Estado carrito | React Context + localStorage |
| Backend | Django (existente) |
| Base de datos | SQLite / PostgreSQL (existente) |

---

## 12. Configuración necesaria

- **Backend:** Depósito principal configurado (stock web).
- **Productos:** Código, precio_web y stock en depósito principal para los que se venden online.
- **CORS:** Agregar el dominio de avila-web en `CORS_ALLOWED_ORIGINS`.
- **Despliegue:** avila-web y API en el mismo dominio (ej. tienda en `/`, API en `/api/`) o subdominios con CORS correcto.

---

## 13. Modelo de negocio asumido

- **Pago:** No se cobra online. El pedido se registra y luego se coordina pago (transferencia, efectivo, etc.) y entrega.
- **Envíos:** A coordinar fuera del sistema (por ahora).
- **Cliente:** Solo se piden datos de contacto para gestionar el pedido, no hay registro de usuarios.

Si más adelante se quiere cobro online, habría que integrar Mercado Pago u otro gateway.

---

## 14. Referencias en el proyecto

| Recurso | Ubicación |
|---------|-----------|
| Modelos productos | `backend/apps/productos/models.py` |
| Lógica pedido web | `backend/apps/woocommerce/views.py` → `_procesar_pedido_web` |
| Estructura avila-web | `avila-web/docs/ESTRUCTURA.md` |
| Placeholders tienda | `avila-web/src-tienda/` |
| Documentación general | `docs/ARQUITECTURA.md` |

---

**Última actualización:** Marzo 2026
