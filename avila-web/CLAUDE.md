# avila-web — Tienda online Avila Moto Repuestos

## Qué es este proyecto
Tienda online pública para **Avila Moto Repuestos y Accesorios** (Av. Pte. Castillo 1165).
El cliente compra online y el stock se descuenta automáticamente del POS (Django backend).

## Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + react-router-dom v6 + axios
- **Backend**: Django en `http://127.0.0.1:8000` (ya existente, no tocar)
- **Dev server**: `npm run dev` → corre en `http://localhost:5174`
- **Deploy target**: Vercel (frontend) + VPS (backend)

## Paleta de colores (idéntica al POS)
```
brand-blue:       #2563EB
brand-blue-dark:  #1E3A8A
brand-green:      #16A34A
brand-red:        #DC2626
brand-bg:         #F3F4F6
brand-border:     #E5E7EB
brand-text:       #111827
brand-muted:      #6B7280
```
Clases utilitarias definidas en `src/index.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.input`

## API Django disponible (backend/apps/tienda/)
```
GET  /api/tienda/productos/              → lista con filtros: ?categoria=&marca=&search=&page=
GET  /api/tienda/productos/:id/          → detalle de producto
GET  /api/tienda/categorias/             → lista de categorías
GET  /api/tienda/marcas/                 → lista de marcas
GET  /api/tienda/puntos-retiro/          → puntos de retiro con coordenadas
POST /api/tienda/pedidos/                → crea venta, descuenta stock
POST /api/tienda/mercadopago/preferencia/→ genera link de pago MP
```
El proxy de Vite redirige `/api` → `http://127.0.0.1:8000` (configurado en `vite.config.js`).
Solo se muestran productos con `precio_web > 0`.

## Estructura de archivos
```
avila-web/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx      ← logo, nav, ícono carrito con badge
│   │   │   ├── Footer.jsx      ← dirección, navegación, medios de pago
│   │   │   └── Layout.jsx      ← wrappea Outlet con Header+Footer
│   │   └── tienda/
│   │       ├── ProductCard.jsx         ← card reutilizable
│   │       ├── ProductCardSkeleton.jsx ← loading skeleton
│   │       └── Paginacion.jsx          ← paginación con elipsis
│   ├── context/
│   │   └── CarritoContext.jsx  ← useReducer: AGREGAR, QUITAR, CAMBIAR_CANTIDAD, VACIAR
│   ├── pages/
│   │   ├── home/HomePage.jsx
│   │   ├── catalogo/CatalogoPage.jsx
│   │   ├── producto/ProductoPage.jsx
│   │   ├── carrito/CarritoPage.jsx
│   │   ├── checkout/CheckoutPage.jsx
│   │   └── confirmacion/ConfirmacionPage.jsx
│   ├── services/
│   │   └── api.js              ← tiendaApi con todos los endpoints
│   ├── App.jsx                 ← BrowserRouter + rutas + CarritoProvider
│   ├── main.jsx
│   └── index.css               ← @tailwind + componentes utilitarios
├── index.html
├── vite.config.js              ← port 5174, proxy /api → :8000
├── tailwind.config.js          ← paleta brand-*
├── postcss.config.js
└── package.json
```

## Rutas
```
/                  → HomePage
/catalogo          → CatalogoPage
/producto/:id      → ProductoPage
/carrito           → CarritoPage
/checkout          → CheckoutPage
/confirmacion/:id  → ConfirmacionPage
/contacto          → ContactoPage
/ubicacion         → UbicacionPage
```

## Reglas de desarrollo

1. **Actualizar este archivo** con cada componente, página o decisión terminada — antes de reportar la tarea como lista.
2. **Test obligatorio al cerrar cada etapa**: levantar el dev server, tomar screenshots de las páginas/funcionalidades nuevas, verificar que no hay errores. Si algo falla, corregir antes de declarar la etapa completa. Registrar el resultado del test aquí.

---

## Plan de desarrollo por etapas

### ✅ Etapa 0 — Setup (COMPLETA)
- Proyecto React+Vite+Tailwind desde cero
- Estructura de carpetas, rutas, Layout
- CarritoContext con useReducer
- API service (tiendaApi)
- Header con badge de carrito, Footer

---

### ✅ Etapa 1 — Catálogo funcional (COMPLETA)
*El cliente puede ver y buscar productos reales.*

- [x] **ProductCard** (`src/components/tienda/ProductCard.jsx`): imagen con placeholder SVG si es null, marca, nombre_completo, precio_web (parseFloat desde string), stock badge, botón agregar al carrito, link a /producto/:id
- [x] **ProductCardSkeleton** (`src/components/tienda/ProductCardSkeleton.jsx`): animate-pulse para loading
- [x] **Paginacion** (`src/components/tienda/Paginacion.jsx`): elipsis inteligente, prev/next, botón activo con bg-brand-blue
- [x] **CatalogoPage** (`src/pages/catalogo/CatalogoPage.jsx`): grilla 2→3→4 col, filtros en URL con useSearchParams (?search=&categoria=&page=), skeleton en loading, estado vacío y error con reintentar
- [x] **HomePage** (`src/pages/home/HomePage.jsx`): hero con 2 CTAs, grilla de categorías (hasta 12, link a /catalogo?categoria=ID), sección "Productos" con primeros 8, banner WhatsApp verde al pie

### Notas técnicas Etapa 1
- `precio_web` llega como string del API → siempre usar `parseFloat(producto.precio_web)`
- `nombre_completo` es el campo nombre (no `nombre`)
- Paginación del API: `{ count, total_pages, current_page, results }` (no formato DRF estándar)
- Filtro categoría usa ID numérico (no nombre): `?categoria=<id>`
- Categorías y marcas: `[{ id, nombre }]`
- Nombres y categorías llegan en MAYÚSCULAS del backend → normalizar con `.charAt(0).toUpperCase() + .slice(1).toLowerCase()` en el frontend
- Marcas se muestran en uppercase intencionalmente (nombres comerciales)

### ✅ Test Etapa 1 — PASÓ (2026-06-05)
- Home: hero ✅, categorías reales desde API ✅, productos destacados ✅
- Catálogo: 2 productos reales (VINI, RUNSTONE), precios correctos, filtros visibles ✅
- Carrito vacío: estado empty con CTA ✅
- Fix aplicado: capitalización de nombres/categorías que vienen en MAYÚSCULAS del backend

---

### ✅ Etapa 2 — Detalle de producto + Carrito (COMPLETA)

- [x] **ProductoPage** (`src/pages/producto/ProductoPage.jsx`): breadcrumb, badge categoría + marca, nombre/precio/código, indicador stock (verde/ámbar "Últimas N"/rojo sin stock), selector cantidad (+/−, tope en stock disponible), botón "Agregar al carrito" con feedback visual "✓ Agregado", botón "Ver carrito" post-agregar, botón WhatsApp con ícono y texto pre-escrito, skeleton de carga, estados 404 y error genérico
- [x] **CarritoPage** (`src/pages/carrito/CarritoPage.jsx`): imagen del producto, subtotal por línea, controles de cantidad, botón Quitar, botón Vaciar carrito, resumen con subtotal + "envío se calcula al finalizar" + total, CTA "Continuar con el pedido" → /checkout, estado vacío con ícono y CTA
- [x] WhatsApp: `wa.me/549XXXXXXXXXX?text=Hola! Me interesa: [nombre] (Cód: [codigo])`

### Notas técnicas Etapa 2
- `normalizar(str)` helper usado en ProductoPage: `str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()`
- Stock ≤ 5 → indicador ámbar "Últimas N unidades"; stock = 0 → rojo "Sin stock"; stock > 5 → verde "En stock"
- Selector cantidad: mínimo 1, máximo `producto.stock`
- Al agregar cantidad > 1, se hace N dispatches de AGREGAR (el reducer acumula)
- WA_NUMBER = `549XXXXXXXXXX` — pendiente número real del local

### ✅ Test Etapa 2 — PASÓ (2026-06-05)
- ProductoPage /producto/1: breadcrumb ✅, badges ✅, precio ✅, "Últimas 3 unidades" ✅, botón agregar ✅, botón WhatsApp ✅
- CarritoPage vacío: ícono, texto, CTA ✅

---

### ✅ Etapa 3 — Checkout (COMPLETA)

- [x] **CheckoutPage** (`src/pages/checkout/CheckoutPage.jsx`): 3 secciones numeradas — datos de contacto (nombre*, email*, teléfono*), entrega (retiro con dropdown de puntosRetiro / envío con dirección+localidad+cp+provincia), pago (MP / transferencia / efectivo). Sidebar con resumen de pedido y total. Validación inline con errores por campo. Submit → `POST /api/tienda/pedidos/`. Si MP: llama a `/mercadopago/preferencia/` y redirige a `init_point`. Si no: navega a `/confirmacion/:venta_numero?pago=X`. Vacía carrito en éxito. Redirige a catálogo si carrito vacío.
- [x] **ConfirmacionPage** (`src/pages/confirmacion/ConfirmacionPage.jsx`): instrucciones dinámicas por método de pago (transferencia / efectivo / mercadopago / mercadopago-pending / mercadopago-error). Muestra número de pedido. Botón WhatsApp con texto pre-escrito con el número. Botón "Volver al inicio".

### Notas técnicas Etapa 3
- `POST /api/tienda/pedidos/` espera `line_items: [{variante_id, cantidad}]` (no `id`)
- `tipo_entrega`: `'retiro'` requiere `punto_retiro_id` (int); `'envio'` requiere `direccion` + `localidad`
- Efectivo deshabilitado si `tipo_entrega === 'envio'`
- MP simulado en dev: devuelve URL fake de mercadopago.com
- `/confirmacion/:id?pago=X` — el número de pedido es `venta_numero`, no `venta_id`

### ✅ Test Etapa 3 — PASÓ (2026-06-05)
- Checkout vacío → redirige a catálogo ✅ (comportamiento correcto)
- Confirmación transferencia: icono 🏦, pasos correctos, botón WhatsApp ✅
- Confirmación efectivo: icono 💵, pasos correctos, dirección local ✅

---

### ✅ Etapa 4 — Mercado Pago + Confirmación (COMPLETA)

- [x] **back_urls wiring completo**: Frontend pasa `back_urls` + `auto_return: 'approved'` a `/mercadopago/preferencia/`. Backend los lee y los incluye en la preferencia. Cuando MP aprueba, redirige automáticamente a `/confirmacion/:venta_numero?status=approved&pago=mercadopago`.
- [x] **Backend mercadopago.py**: acepta `back_urls` y `auto_return`. Incluye bloque comentado para activar SDK real cuando haya token. Devuelve estructura compatible con respuesta real de MP (incluye `sandbox_init_point`).
- [x] **Backend views.py**: lee `back_urls` y `auto_return` del body y los pasa a `crear_preferencia_para_venta`.
- [x] **ConfirmacionPage**: maneja 5 estados — `transferencia`, `efectivo`, `mercadopago` (approved), `mercadopago-pending`, `mercadopago-error` (failure o error al crear preferencia).

### Notas técnicas Etapa 4
- MP simulado devuelve `init_point` de `www.mercadopago.com` (no sandbox). Para sandbox real usar `sandbox_init_point`.
- Para activar MP real: descomentar bloque SDK en `mercadopago.py` y configurar `MERCADOPAGO_ACCESS_TOKEN` en Django settings.
- `auto_return: 'approved'` hace que MP redirija automáticamente al pagar (sin botón "volver").
- El webhook (`/api/tienda/mercadopago/webhook/`) ya existe y acepta notificaciones, pero no actualiza el estado de la venta todavía.

### ✅ Test Etapa 4 — PASÓ (2026-06-05)
- `?status=approved` → "¡Pago recibido!" verde ✅
- `?status=pending` → "Pago pendiente" ámbar ✅
- `?status=failure` → "Pedido registrado" (modo error) ✅
- `?error=mp` → "Pedido registrado" (MP no disponible) ✅

---

### ✅ Etapa 5 — Pulido y deploy (COMPLETA)

- [x] **`src/config.js`**: constantes centralizadas `WA_NUMBER` y `SITIO`. Todas las páginas y componentes las usan desde ahí (no más strings hardcodeados dispersos).
- [x] **SEO dinámico** (`src/components/SEO.jsx`): `useEffect` que actualiza `document.title` y `<meta name="description">`. Aplicado en Home, Catálogo (con descripción de búsqueda activa), Producto (título = nombre del producto, descripción = descripción real o generada), Carrito, Checkout, Confirmación.
- [x] **Header con menú hamburguesa** (`src/components/layout/Header.jsx`): nav desktop con `hidden md:flex`. Mobile: botón hamburguesa (md:hidden) con ícono X/≡, menú desplegable con bordes izquierdos de color activo. Carrito en el menú mobile también.
- [x] **Botón WhatsApp flotante** (`src/components/layout/Layout.jsx`): círculo verde fijo `bottom-5 right-5 z-40`. Oculto en `/checkout` y `/confirmacion` (flujo de pago — no interrumpir).
- [x] **`src/services/api.js`**: soporte para `VITE_API_URL` en producción. En dev usa el proxy de Vite.
- [x] **`vercel.json`**: rewrite `/* → /index.html` para SPA routing.
- [x] **`.env.example`**: template con `VITE_API_URL` comentado.
- [x] **Build limpio**: `npm run build` → 0 errores, 256KB JS / 20KB CSS, 1.08s.

### Para hacer deploy a Vercel
1. `npm install -g vercel` (o usar la web de vercel.com)
2. Conectar el repo GitHub → seleccionar la carpeta `avila-web/`
3. En Vercel → Settings → Environment Variables: `VITE_API_URL=https://tu-backend.com`
4. En el backend Django: agregar el dominio de Vercel a `CORS_ALLOWED_ORIGINS`

### Pendiente para producción
- Reemplazar `549XXXXXXXXXX` en `src/config.js` con el número real del local
- Configurar `MERCADOPAGO_ACCESS_TOKEN` en Django settings para MP real
- Confirmar dominio: avilamotorepuestos.com.ar

### ✅ Test Etapa 5 — PASÓ (2026-06-05)
- Build producción: 0 errores ✅
- Desktop: WhatsApp flotante verde en esquina inferior derecha ✅
- Mobile (390px): header con logo + carrito + hamburguesa ✅
- Mobile (375px): grilla catálogo 2 columnas ✅
- Categorías normalizadas (capitalize) ✅

---

## Sistema de usuarios (clientes web)

### Backend (`apps/tienda/`)
- **`models.py`**: `ClienteWeb` (email, nombre, password_hash, google_id, avatar_url) + `PedidoWeb` (FK a Venta + FK a ClienteWeb). Migración: `0001_add_clienteweb_pedidoweb`.
- **`auth.py`**: `hash_password`, `verify_password`, `generate_token` (PyJWT, 30 días), `verify_token`, `get_cliente_from_request` (lee `Authorization: Bearer`), `verify_google_token` (llama a `oauth2.googleapis.com/tokeninfo`).
- **Endpoints nuevos:**
  - `POST /api/tienda/auth/registro/` — registro email/password
  - `POST /api/tienda/auth/login/` — login email/password → JWT
  - `POST /api/tienda/auth/google/` — login con Google ID token → JWT
  - `GET  /api/tienda/auth/me/` — perfil del cliente logueado
  - `GET  /api/tienda/mis-pedidos/` — historial de pedidos
- `pedido_create` vincula automáticamente el pedido al `ClienteWeb` si hay token en el request.
- `settings.py`: `GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')`.

### Frontend
- **`src/context/AuthContext.jsx`**: estado `user`/`token`, funciones `login`, `registro`, `loginGoogle`, `logout`. Persiste en `localStorage` con claves `avila_token` y `avila_user`.
- **`src/services/api.js`**: interceptor que adjunta `Authorization: Bearer <token>` automáticamente. `authApi` con `registro`, `login`, `loginGoogle`, `me`, `misPedidos`.
- **`@react-oauth/google`**: instalado. `GoogleOAuthProvider` en `App.jsx` con `VITE_GOOGLE_CLIENT_ID`.
- **Páginas**: `/login` (LoginPage), `/registro` (RegistroPage), `/mi-cuenta` (MiCuentaPage — perfil + historial accordion).
- **Header**: ícono de usuario → `/login` o `/mi-cuenta` según estado. Menú mobile incluye "Mi cuenta".
- **Checkout**: pre-rellena nombre y email con los datos del usuario logueado.

### Para activar Google Login
1. Ir a https://console.cloud.google.com → crear proyecto → Credenciales → OAuth 2.0
2. Orígenes autorizados: `http://localhost:5174`, `https://tu-dominio.com`
3. Copiar el Client ID
4. En avila-web: crear `.env.local` con `VITE_GOOGLE_CLIENT_ID=tu-client-id`
5. En Django `.env` o Heroku/VPS: `GOOGLE_CLIENT_ID=tu-client-id`

## Páginas adicionales (post-Etapa 5)
- `/contacto` (`src/pages/contacto/ContactoPage.jsx`): página **unificada** contacto+ubicación. Layout 2 columnas: izquierda mapa Google Maps embed + info (dirección, WA, horarios), derecha formulario que abre WhatsApp con el mensaje pre-armado.
- `/ubicacion` redirige con `<Navigate to="/contacto">` — URL vieja sigue funcionando.
- Header: nav = Inicio / Catálogo / Contacto + íconos carrito y usuario.
- **Horarios hardcodeados** en `ContactoPage.jsx` — confirmar con el usuario y actualizar.
- **Horarios** hardcodeados en ambas páginas — confirmar con el usuario y actualizar en `UbicacionPage.jsx` y `ContactoPage.jsx`.

---

### ✅ Etapa 6 — Mejoras competitivas Fase 1 (COMPLETA)

- [x] **Logo en Header** (`src/components/layout/Header.jsx`): texto reemplazado por `<img src="/logo.png" alt="Avila Moto Repuestos" className="h-10 w-auto object-contain">`. El archivo `avila-web/public/logo.png` aún debe ser provisto por el usuario.
- [x] **Carrito persistente en localStorage** (`src/context/CarritoContext.jsx`): función `loadFromStorage()` como tercer arg de `useReducer`. `useEffect` guarda en `avila_carrito` en cada cambio. El carrito sobrevive recargas.
- [x] **Toast "Producto agregado"** (`src/context/CarritoContext.jsx` + `src/components/ToastNotification.jsx`): `agregarConToast(producto)` despacha AGREGAR y activa `toastMsg` que se limpia a los 2.5s. `ToastNotification` renderizado en `Layout.jsx`, esquina inferior izquierda, con link "Ver carrito".
- [x] **ProductCard** usa `agregarConToast` en vez de `dispatch` directo.
- [x] **Filtros adicionales en catálogo** (`src/pages/catalogo/CatalogoPage.jsx`):
  - Fila 1: búsqueda + categoría (sin cambios)
  - Fila 2 (nueva): marca (server-side `?marca=<id>`), precio mín/máx (client-side), ordenamiento (server-side `?ordering=campo`)
  - Opciones de ordenamiento: Nombre A-Z, Nombre Z-A, Precio menor a mayor, Precio mayor a menor
  - "Limpiar filtros" considera todos los filtros activos (search, categoria, marca, precio_min, precio_max, ordering)

### Notas técnicas Etapa 6
- `agregarConToast` expuesto desde `useCarrito()` — reemplaza `dispatch({type:'AGREGAR',...})` en ProductCard; ProductoPage aún usa `dispatch` directo (tiene su propio feedback visual local)
- Precio min/max filtra client-side sobre la página actual (no afecta paginación backend)
- Logo: si `public/logo.png` no existe, el browser muestra el alt text — no rompe la app
- `loadFromStorage` como inicializador lazy de useReducer (tercer argumento) evita re-parse en cada render

### ✅ Test Etapa 6 — PASÓ (2026-06-05)
- Catálogo: 2 filas de filtros visibles (búsqueda+categoría / marca+precio+orden) ✅
- Toast: aparece al agregar producto, muestra nombre truncado + link "Ver carrito" ✅
- Badge carrito: se actualiza inmediatamente tras agregar ✅
- localStorage: carrito persiste tras reload de página (badge sigue mostrando "1") ✅
- Logo: img tag en lugar de texto (espera `public/logo.png` del usuario) ✅

---

### ✅ Etapa 7 — Fase 2: Buscador "Para tu moto" (COMPLETA)

- [x] **Backend — modelo `ModeloMoto`** (`backend/apps/tienda/models.py`): campos `marca`, `modelo`, `anio`, `activo`, M2M `productos` → `'productos.ProductoBase'` (relation inversa `modelos_compatibles`). Migración `0002_modelomoto`.
- [x] **Backend — endpoint** `GET /api/tienda/modelos-moto/` → `[{id, marca, modelo, anio}]`. Solo activos.
- [x] **Backend — filtro `?modelo=<id>`** en `productos_list`: `qs.filter(producto_base__modelos_compatibles__id=modelo_id)`.
- [x] **Backend — `?ordering=<campo>`** en `productos_list`: soporta `nombre`, `-nombre`, `precio_web`, `-precio_web`. ORDERING_MAP interno.
- [x] **`src/services/api.js`**: `getModelosMoto: () => api.get('/modelos-moto/')`.
- [x] **`src/components/tienda/BuscadorPorMoto.jsx`** (nuevo): tres selects encadenados (Marca → Modelo → Año), derivan datos del array local. Persistencia en `localStorage` key `avila_moto`. Navega a `/catalogo?modelo=<id>&moto=<label>`. No renderiza si no hay datos (se oculta solo si la BD está vacía).
- [x] **`src/pages/home/HomePage.jsx`**: agrega `<BuscadorPorMoto />` entre hero y categorías. Agrega sección Marcas (chips, máx 15 + "Ver más →").
- [x] **`src/pages/catalogo/CatalogoPage.jsx`**: lee `modelo` y `moto` de URL params, pasa `modelo` a la API, muestra badge "🏍️ Mostrando repuestos para: Honda CG 150 2022" con botón "Ver todo ✕".

### Notas técnicas Etapa 7
- `ModeloMoto.productos` M2M definida en `apps/tienda` → evita import circular con `apps/productos`
- Datos de prueba cargados en DB: Honda CG 150/XR 150, Yamaha YBR 125, Zanella ZB 110, Bajaj Pulsar 200, Corven Energy 110 (años 2019-2022). Productivizar: el usuario debe vincular productos reales desde Django Admin.
- Para vincular un producto a un modelo: en Django Admin → Modelos de moto → Agregar → seleccionar productos compatibles
- `BuscadorPorMoto` desaparece solo si `modelos.length === 0` (DB vacía)

### ✅ Test Etapa 7 — PASÓ (2026-06-05)
- Home: BuscadorPorMoto visible con 3 selects encadenados ✅
- Buscador: Honda → CG 150 → 2022 → botón "Buscar →" activo ✅
- Buscador: botón "✕" aparece al tener selección activa ✅
- Catálogo con `?modelo=4&moto=Honda CG 150 2022`: badge azul visible con "Ver todo ✕" ✅
- Filtro API `?ordering=precio_web`: devuelve 200 con count correcto ✅
- Home: sección Marcas con chips limitada a 15 + "Ver más →" ✅

---

### ✅ Etapa 8 — Fase 3: Trust signals y UX de detalle (COMPLETA)

- [x] **Backend**: `_variante_a_dict` ahora expone `categoria_id` y `marca_id` (útiles para filtros y relacionados).
- [x] **Card de envío** (`ProductoPage.jsx`): bloque debajo del botón WhatsApp con 🚚 Envío a todo el país / 🏪 Retiro en local (usa `SITIO.direccion`) / 💬 Consultá condiciones por WhatsApp.
- [x] **Compartir producto** (`ProductoPage.jsx`): botón "Copiar enlace" (usa `navigator.clipboard`, feedback "✓ ¡Enlace copiado!" 2s) + botón "Compartir" vía WhatsApp con texto pre-armado.
- [x] **Productos relacionados** (`ProductoPage.jsx`): sección "También te puede interesar" debajo del grid principal. Carga hasta 4 productos de la misma `categoria_id`, excluye el producto actual. No se muestra si hay 0 relacionados.

### Notas técnicas Etapa 8
- `SITIO.direccion` proviene de `src/config.js` — centralizado.
- Para compartir por WA se usa `https://wa.me/?text=...` (sin número destino, el usuario elige a quién enviar).
- Relacionados: `useEffect` con deps `[producto?.categoria_id, producto?.id]` — se recarga al navegar entre productos.
- `navigator.clipboard` solo funciona en HTTPS o `localhost` — para producción está cubierto.

### ✅ Test Etapa 8 — PASÓ (2026-06-05)
- ProductoPage: card de envío visible con 3 ítems ✅
- Botón "Copiar enlace" visible ✅
- Botón "Compartir" (WA) visible ✅
- Sección relacionados: no aparece cuando no hay productos de la misma categoría (correcto) ✅

---

### ✅ Etapa 9 — Fase 4: Features avanzados (COMPLETA)

- [x] **Wishlist/Favoritos** — `src/context/FavoritosContext.jsx`: estado `Set<id>` en localStorage `avila_favoritos`. `FavoritosProvider` wrappea la app. `toggleFavorito(id)`, `esFavorito(id)`, `count`. Icono corazón en Header con badge rojo. Botón corazón en cada `ProductCard` (top-right de imagen). Página `/favoritos` (`FavoritosPage.jsx`): carga productos con `Promise.all(ids.map(getProducto))`, estado vacío con CTA.

- [x] **Visto recientemente** — localStorage `avila_vistos` (máx 8, newest first). `ProductoPage.jsx` guarda `{id, nombre_completo, precio_web, imagen_url, marca, stock}` al cargar un producto. `HomePage.jsx` lee el array y muestra sección "Visto recientemente" (hasta 4 cards) con botón "Limpiar".

- [x] **Banner envío gratis** — `ENVIO_GRATIS_DESDE = 30000` en `config.js`. `CarritoPage.jsx`: banner azul con barra de progreso (`totalPrecio / ENVIO_GRATIS_DESDE`). Cuando se alcanza el umbral, muestra banner verde "¡Alcanzaste el envío gratis!".

- [x] **Autocompletado en búsqueda** — `CatalogoPage.jsx` desacopla `inputVal` (estado local) de `search` (URL param). Al escribir: debounce 350ms → actualiza URL + fetch `page_size: 5` para sugerencias. Dropdown con imagen, nombre, marca, precio. Click en sugerencia navega a `/producto/:id`. Cierra al hacer click fuera (`mousedown` listener). Syncs `inputVal` cuando `search` cambia desde URL.

### Notas técnicas Etapa 9
- `FavoritosProvider` está por fuera de `CarritoProvider` en App.jsx (ambos son independientes)
- "Visto recientemente" usa datos del producto al momento de visita (puede estar levemente desactualizado si cambia precio). Aceptable para este caso.
- `ENVIO_GRATIS_DESDE` = 30.000 — ajustar según política real del negocio en `src/config.js`
- Autocompletado hace 2 fetches por búsqueda (URL + suggestions) — el de URL dispara el render principal, el de suggestions llena el dropdown. Ambos tienen el mismo debounce de 350ms.
- Reviews y calificaciones (esfuerzo alto): no implementado — queda pendiente para una etapa futura

### ✅ Test Etapa 9 — PASÓ (2026-06-05)
- Header: ícono corazón visible, badge rojo cuando hay favoritos ✅
- Catálogo: tipear "vini" → dropdown con producto, imagen, marca, precio ✅
- ProductCard: botón corazón en cada card (top-right imagen) ✅
- FavoritosPage vacía: 🤍 "No tenés favoritos todavía" + CTA ✅
- CarritoPage: banner "🚚 Te faltan $22.800 para envío gratis" con barra de progreso ✅

---

## Decisiones de diseño confirmadas
- Mobile-first
- No hay login de usuario en la tienda (compra como invitado)
- Imágenes: campo `imagen_url` puede estar vacío → usar placeholder
- WhatsApp del local: pendiente confirmar número real (usar `549XXXXXXXXXX` hasta tenerlo)
- Dominio objetivo: avilamotorepuestos.com.ar (pendiente)
- Logo: usar `public/logo.png` (pendiente que el usuario provea el archivo)

---

### ✅ Etapa 10 — Rediseño visual orientado a conversión (COMPLETA)

**Paleta actualizada** (`tailwind.config.js`):
- `brand-blue`: `#E11D2A` (acento principal — CTAs, precios, links activos)
- `brand-blue-dark`: `#B91C1C` (hover)
- `brand-bg`: `#F5F6F8` (fondo general)
- `brand-border`: `#E3E6EA` (bordes)
- `brand-text`: `#1A1D23` (texto principal)

**Cambios por archivo:**
- [x] **`tailwind.config.js`**: paleta nueva + sombras `card`/`card-hover` para tema claro + animación `drawer-in`
- [x] **`src/index.css`**: scrollbar claro, skeleton-light actualizado, nuevas utilidades `.filter-label`, `.filter-btn`, `.scrollbar-hide`
- [x] **`Header.jsx`**: fondo blanco, buscador central con autocompletado (`HeaderSearch`), barra de categorías (desktop), mobile = búsqueda en segunda fila
- [x] **`StockBadge.jsx`**: badges tema claro (verde/ámbar/rojo sobre fondo blanco)
- [x] **`ProductCard.jsx`**: precio `text-xl font-black`, badge "Envío gratis" cuando precio ≥ `ENVIO_GRATIS_DESDE`, placeholder claro, hover sutil `-translate-y-1`
- [x] **`ProductCardSkeleton.jsx`**: skeleton claro consistente
- [x] **`CatalogoPage.jsx`**: layout dos columnas (sidebar + main), sidebar sticky con filtros (categoría como botones, marca select, precio min/max, badge moto activa), drawer mobile con backdrop + animación, barra de estado con contador + selector ordenamiento
- [x] **`ProductoPage.jsx`**: precio `text-4xl font-black`, trust badges en grid 2×2, panel info sticky en desktop (`sticky top-[calc(...)]`), badge "Envío gratis" si aplica
- [x] **`HomePage.jsx`**: hero oscuro comercial (no racing), buscador grande central, chips de categorías, trust signals en banda blanca horizontal. Eliminado hero racing (85vh).
- [x] **`Footer.jsx`**: limpieza tipográfica, bullets más sutiles
- [x] **`BuscadorPorMoto.jsx`**: selects con fondo semitransparente (`rgba(255,255,255,0.06)`) para mejorar lectura en la sección oscura

**Clases Tailwind que NO deben tocarse** (secciones oscuras conservadas):
- `bg-carbon`, `bg-graphite`, `bg-plate`, `bg-steel`, `speed-lines`, `carbon-pattern`
- `BuscadorPorMoto`, `BrandMarquee`, banner WhatsApp de Home → siguen usando tema oscuro intencional

### ✅ Test Etapa 10 — PASÓ (2026-06-10)
- Build producción: 0 errores, 341KB JS / 52KB CSS ✅
- Header desktop: blanco, buscador central, barra categorías, badges carrito/favoritos ✅
- Header mobile: logo + íconos + hamburguesa, búsqueda en segunda fila ✅
- Hero: oscuro comercial, buscador grande, chips categorías, trust signals blancos ✅
- Catálogo desktop: sidebar filtros (Categoría/Marca/Precio), grilla 2→3→4 cols, contador + ordenamiento ✅
- ProductCard: precio grande rojo, badges "En stock"/"Últimas N" en tema claro ✅
- Catálogo mobile: botón "Filtros", grilla 2 cols ✅
- Drawer mobile: panel izquierdo animado, filtros completos, CTA "Ver N productos" ✅
- ProductoPage: precio $4.800 en rojo grande, "Últimas 3 unidades", botones prominentes, trust 2×2 ✅
- Sin errores de consola en ninguna página ✅
