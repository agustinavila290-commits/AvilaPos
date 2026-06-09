# Tienda Web — Avila Moto Repuestos y Accesorios
## Resumen completo del proyecto `avila-web/`

---

## 1. Qué es

Tienda online pública para **Avila Moto Repuestos y Accesorios** (Av. Pte. Castillo 1165).  
El cliente navega el catálogo, filtra por moto, agrega al carrito y paga online. El stock se descuenta automáticamente del backend Django del POS.

---

## 2. Stack y entorno

| Componente | Detalle |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + react-router-dom v6 + axios |
| Backend | Django 5.1 + DRF en `http://127.0.0.1:8000` (compartido con POS) |
| Dev server | `npm run dev` en `avila-web/` → `http://localhost:5174` |
| Deploy frontend | Vercel |
| Deploy backend | VPS DonWeb (mismo servidor que el POS) |
| Dominio objetivo | `avilamotorepuesto.com.ar` |

**Proxy Vite:** toda petición a `/api` se redirige a `:8000` en desarrollo. En producción, `VITE_API_URL` apunta al backend real.

---

## 3. Paleta de colores

```
brand-blue:       #2563EB   (botones, links activos)
brand-blue-dark:  #1E3A8A   (hover, encabezados)
brand-green:      #16A34A   (stock en cantidad, WhatsApp flotante)
brand-red:        #DC2626   (sin stock, errores, badge favoritos)
brand-bg:         #F3F4F6   (fondo general)
brand-border:     #E5E7EB   (bordes de cards)
brand-text:       #111827   (texto principal)
brand-muted:      #6B7280   (texto secundario)
```

Clases utilitarias en `src/index.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.input`

---

## 4. Estructura de archivos

```
avila-web/
├── public/
│   ├── favicon.svg
│   ├── logo.png              ← PENDIENTE: colocar logo real aquí
│   └── robots.txt
├── src/
│   ├── config.js             ← constantes globales (WA_NUMBER, SITIO, ENVIO_GRATIS_DESDE)
│   ├── App.jsx               ← rutas + GoogleOAuthProvider + providers de contexto
│   ├── main.jsx
│   ├── index.css             ← @tailwind + clases utilitarias
│   ├── components/
│   │   ├── SEO.jsx           ← actualiza <title> y <meta description>
│   │   ├── ToastNotification.jsx   ← toast bottom-left 2.5s
│   │   ├── layout/
│   │   │   ├── Header.jsx    ← logo, nav, favoritos badge, carrito badge, user, hamburguesa
│   │   │   ├── Footer.jsx    ← dirección, navegación, medios de pago
│   │   │   └── Layout.jsx    ← Header + Footer + WA flotante + ToastNotification
│   │   └── tienda/
│   │       ├── ProductCard.jsx         ← card con corazón favorito + agregarConToast
│   │       ├── ProductCardSkeleton.jsx ← loading skeleton animate-pulse
│   │       ├── Paginacion.jsx          ← paginación con elipsis inteligente
│   │       └── BuscadorPorMoto.jsx     ← 3 selects encadenados + localStorage avila_moto
│   ├── context/
│   │   ├── CarritoContext.jsx    ← useReducer: AGREGAR/QUITAR/CAMBIAR_CANTIDAD/VACIAR + localStorage + toast
│   │   ├── FavoritosContext.jsx  ← Set<id> + localStorage avila_favoritos
│   │   └── AuthContext.jsx       ← JWT + Google OAuth + localStorage avila_token/avila_user
│   ├── pages/
│   │   ├── home/HomePage.jsx
│   │   ├── catalogo/CatalogoPage.jsx
│   │   ├── producto/ProductoPage.jsx
│   │   ├── carrito/CarritoPage.jsx
│   │   ├── checkout/CheckoutPage.jsx
│   │   ├── confirmacion/ConfirmacionPage.jsx
│   │   ├── favoritos/FavoritosPage.jsx
│   │   ├── login/LoginPage.jsx
│   │   ├── registro/RegistroPage.jsx
│   │   ├── mi-cuenta/MiCuentaPage.jsx
│   │   ├── contacto/ContactoPage.jsx
│   │   └── ubicacion/UbicacionPage.jsx  ← solo hace redirect a /contacto
│   └── services/
│       └── api.js              ← tiendaApi + authApi + interceptor JWT
├── index.html
├── vite.config.js              ← port 5174, proxy /api → :8000
├── tailwind.config.js          ← paleta brand-*
├── vercel.json                 ← rewrite /* → /index.html (SPA routing)
├── .env.example                ← template VITE_API_URL y VITE_GOOGLE_CLIENT_ID
└── package.json
```

---

## 5. Rutas

| URL | Página | Descripción |
|---|---|---|
| `/` | HomePage | Hero, buscador por moto, categorías, marcas, productos, vistos recientemente |
| `/catalogo` | CatalogoPage | Grilla con filtros, autocompletado, badge moto activa, paginación |
| `/producto/:id` | ProductoPage | Detalle, relacionados, compartir, envío info, visto recientemente |
| `/carrito` | CarritoPage | Items, banner envío gratis con barra de progreso, resumen |
| `/checkout` | CheckoutPage | Datos contacto + entrega + pago → POST pedido |
| `/confirmacion/:id` | ConfirmacionPage | Instrucciones post-pago (5 estados posibles) |
| `/favoritos` | FavoritosPage | Lista de productos favoritos guardados |
| `/login` | LoginPage | Login email/password + Google OAuth |
| `/registro` | RegistroPage | Registro de cuenta |
| `/mi-cuenta` | MiCuentaPage | Perfil + historial de pedidos (accordion) |
| `/contacto` | ContactoPage | Mapa + formulario → WhatsApp, info del local |
| `/ubicacion` | UbicacionPage | Redirect a `/contacto` |

---

## 6. API Django — endpoints usados por la tienda

```
GET  /api/tienda/productos/               ?search= &categoria= &marca= &modelo= &ordering= &page=
GET  /api/tienda/productos/:id/           → incluye categoria_id y marca_id
GET  /api/tienda/categorias/
GET  /api/tienda/marcas/
GET  /api/tienda/modelos-moto/            → [{id, marca, modelo, anio}]
GET  /api/tienda/puntos-retiro/
POST /api/tienda/pedidos/                 → line_items: [{variante_id, cantidad}]
POST /api/tienda/mercadopago/preferencia/ → devuelve init_point para redirigir
POST /api/tienda/auth/registro/
POST /api/tienda/auth/login/
POST /api/tienda/auth/google/
GET  /api/tienda/auth/me/
GET  /api/tienda/mis-pedidos/
```

Solo se muestran productos con `precio_web > 0`.  
Paginación: `{ count, total_pages, current_page, results }`.  
`precio_web` llega como string → siempre usar `parseFloat()`.  
Nombres llegan en MAYÚSCULAS → normalizar en frontend con capitalize.

---

## 7. Funcionalidades implementadas

### 7.1 Catálogo y búsqueda
- Grilla responsive: 2 col (mobile) → 3 col (tablet) → 4 col (desktop)
- Fila 1 de filtros: búsqueda de texto + selector de categoría
- Fila 2 de filtros: marca (server-side), precio mín/máx (client-side), ordenamiento (server-side)
- Ordenamiento: nombre A-Z, Z-A, precio ↑↓
- **Autocompletado** en búsqueda: debounce 350ms, dropdown con imagen/nombre/precio, click navega a `/producto/:id`
- Paginación con elipsis inteligente
- Skeleton de carga y estado vacío con reintentar

### 7.2 Buscador "Para tu moto"
- 3 selects encadenados: Marca → Modelo → Año
- Persiste la última selección en `localStorage` (`avila_moto`)
- Navega a `/catalogo?modelo=<id>&moto=<label>`
- Badge en catálogo: "🏍️ Mostrando repuestos para: Honda CG 150 2022" con botón "Ver todo ✕"
- Se oculta automáticamente si la base de datos no tiene modelos cargados

### 7.3 Detalle de producto
- Breadcrumb, badges categoría + marca
- Indicador de stock: verde (>5), ámbar "Últimas N unidades" (≤5), rojo "Sin stock" (0)
- Selector de cantidad con tope en stock disponible
- Botón "Agregar al carrito" con feedback visual "✓ Agregado"
- Botón "Ver carrito" post-agregar
- Botón WhatsApp con mensaje pre-escrito (número + nombre + código)
- **Card de envío:** 🚚 Envío a todo el país / 🏪 Retiro en local / 💬 Consultá por WA
- **Compartir:** "Copiar enlace" (clipboard, feedback 2s) + "Compartir" por WhatsApp
- **Productos relacionados:** hasta 4 de la misma categoría (sección oculta si no hay)
- **Visto recientemente:** guarda en localStorage al cargar (máx 8)

### 7.4 Carrito
- Persistente en `localStorage` (`avila_carrito`) — sobrevive recargas
- Controles de cantidad por ítem, botón quitar, botón vaciar
- **Banner envío gratis:** barra de progreso azul → banner verde al alcanzar `ENVIO_GRATIS_DESDE`
- Toast "Producto agregado" (bottom-left, 2.5s) con link "Ver carrito"

### 7.5 Checkout y pago
- 3 secciones: datos de contacto, entrega, método de pago
- Entrega: retiro en local (dropdown puntos de retiro) o envío a domicilio
- Métodos: Mercado Pago, transferencia bancaria, efectivo (solo retiro)
- Validación inline con errores por campo
- Pre-rellena datos si el usuario está logueado
- Post-submit: redirige a MP o a `/confirmacion/:id?pago=X`

### 7.6 Confirmación de pedido
- 5 estados: `transferencia`, `efectivo`, `mercadopago` (approved), `mercadopago-pending`, `mercadopago-error`
- Instrucciones específicas por método
- Botón WhatsApp con número de pedido en el texto

### 7.7 Favoritos
- Botón corazón en cada ProductCard (top-right de la imagen)
- Ícono corazón en Header con badge rojo
- Página `/favoritos` con lista completa o empty state
- Persiste en `localStorage` (`avila_favoritos`)

### 7.8 Sistema de usuarios
- Registro / login con email + contraseña
- Login con Google (OAuth2 — requiere `VITE_GOOGLE_CLIENT_ID`)
- Perfil + historial de pedidos en `/mi-cuenta`
- JWT (30 días), interceptor axios adjunta `Authorization: Bearer` automáticamente
- Logout limpia localStorage

### 7.9 SEO dinámico
- Componente `SEO.jsx` actualiza `<title>` y `<meta name="description">` en cada página
- ProductoPage: título = nombre del producto

### 7.10 UX general
- Botón WhatsApp flotante en todas las páginas (excepto checkout y confirmación)
- Menú hamburguesa en mobile
- Mobile-first en toda la tienda

---

## 8. localStorage — claves utilizadas

| Clave | Contenido |
|---|---|
| `avila_carrito` | `{ items: [{id, nombre, precio_web, imagen_url, cantidad}] }` |
| `avila_favoritos` | `[id1, id2, ...]` (array de IDs) |
| `avila_moto` | `{ marcaSel, modeloSel, anioSel }` (última búsqueda) |
| `avila_vistos` | `[{id, nombre_completo, precio_web, imagen_url, marca, stock}]` (máx 8) |
| `avila_token` | JWT string |
| `avila_user` | objeto usuario (`{id, nombre, email}`) |

---

## 9. Configuración global (`src/config.js`)

```js
WA_NUMBER = '549XXXXXXXXXX'         // ← PENDIENTE: número real
ENVIO_GRATIS_DESDE = 30000          // ← PENDIENTE: confirmar monto real
SITIO = {
  nombre: 'Avila Moto Repuestos',
  direccion: 'Av. Pte. Castillo 1165',
  ...
}
```

---

## 10. Backend Django — módulo tienda

**App:** `backend/apps/tienda/`

### Modelos relevantes
- `ClienteWeb`: email, nombre, password_hash, google_id, avatar_url
- `PedidoWeb`: FK a `Venta` + FK a `ClienteWeb`
- `ModeloMoto`: marca, modelo, anio, activo + M2M → `ProductoBase` (reverse: `modelos_compatibles`)
  - Datos de prueba: Honda (CG 150, XR 150), Yamaha (YBR 125), Zanella (ZB 110), Bajaj (Pulsar 200), Corven (Energy 110), años 2019–2022

### Para vincular productos a motos
Django Admin → Modelos de moto → editar → seleccionar productos compatibles.

### Mercado Pago
- Modo simulado en dev (CAE/MP fake).
- Para activar MP real: descomentar bloque SDK en `mercadopago.py` + `MERCADOPAGO_ACCESS_TOKEN` en Django settings.
- `auto_return: 'approved'` → MP redirige automáticamente tras aprobar el pago.

---

## 11. Deploy

### Frontend (Vercel)
1. Conectar repo GitHub → carpeta `avila-web/`
2. Variables de entorno en Vercel:
   - `VITE_API_URL=https://avilamotorepuesto.com.ar`
   - `VITE_GOOGLE_CLIENT_ID=tu-client-id`
3. `vercel.json` ya tiene el rewrite para SPA routing.
4. Build: `npm run build` (0 errores, ~256KB JS / 20KB CSS)

### Backend (VPS)
- Ver `deploy/README-DEPLOY.md` para instrucciones completas
- Nginx + systemd, scripts `install-servidor.sh`, `update.sh`, `backup.sh`
- `avila-web/dist/` se sirve como archivos estáticos desde Nginx

---

## 12. Pendientes para producción

1. Colocar logo real en `avila-web/public/logo.png`
2. Reemplazar `549XXXXXXXXXX` por el número real de WhatsApp en `src/config.js`
3. Ajustar `ENVIO_GRATIS_DESDE = 30000` al monto real de la política de envío
4. Confirmar horarios en `ContactoPage.jsx` (actualmente hardcodeados)
5. Configurar `VITE_GOOGLE_CLIENT_ID` en `.env.local` (dev) y en Vercel (prod)
6. Configurar `GOOGLE_CLIENT_ID` en Django `.env`
7. Configurar `MERCADOPAGO_ACCESS_TOKEN` en Django para pagos reales
8. Vincular productos reales a modelos de moto desde Django Admin
9. Confirmar dominio: `avilamotorepuesto.com.ar`

---

## 13. Pendiente de implementar (pospuesto)

- **Reviews y calificaciones por producto** — requiere backend completo (modelo Review, endpoint, moderación). Esfuerzo: alto.

---

## 14. Comandos útiles

```bash
# Iniciar dev
cd avila-web && npm run dev           # → http://localhost:5174
cd backend && python manage.py runserver   # → http://127.0.0.1:8000

# Build producción
cd avila-web && npm run build

# Migraciones si se toca el backend de tienda
cd backend && python manage.py migrate tienda
```
