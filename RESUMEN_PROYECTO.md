# RESUMEN TÉCNICO Y FUNCIONAL — AvilaPOS
**Fecha de análisis:** 2026-06-06  
**Estado del análisis:** Solo lectura. No se modificó código.

---

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

### ¿Qué es?
**AvilaPOS** es un sistema integral de gestión para **Avila Moto Repuesto** (casa de repuestos de motos). Combina un punto de venta (POS), gestión de inventario, clientes, compras, facturación electrónica AFIP y una tienda web de catálogo público.

### ¿Para qué fue diseñado?
- Registrar ventas en mostrador con o sin escáner de código de barras
- Controlar stock y movimientos de inventario
- Gestionar clientes y su historial de compras
- Emitir facturas electrónicas AFIP (Facturas A y B)
- Generar PDF de facturas e imprimirlos o descargarlos
- Gestionar compras a proveedores
- Operar localmente en Windows, sin internet obligatoria (excepto AFIP)

### Flujo principal del sistema

```
[Cajero escanea producto] → [POS arma el ticket] → [Selecciona cliente] →
[Elige método de pago: EFECTIVO / TARJETA / CUENTA CORRIENTE] →
[Cobra (F12)] → [Sistema genera Venta en BD + descuenta stock] →
[Redirige a detalle de venta] →
[Desde ahí: Imprimir Ticket Térmico] y/o [Emitir Factura AFIP] →
[AFIP devuelve CAE] → [Sistema genera PDF] → [PDF se abre en nueva pestaña]
```

Para pagos con tarjeta, el flujo agrega un paso intermedio antes de emitir la factura: el cajero ingresa el **número de cupón** y el **código de autorización** del posnet físico.

---

## 2. TECNOLOGÍAS UTILIZADAS

### Backend
| Componente | Tecnología | Versión |
|---|---|---|
| Lenguaje | Python | 3.11+ |
| Framework | Django | 5.1.5 |
| API REST | Django REST Framework | 3.15.2 |
| Autenticación | djangorestframework-simplejwt | 5.4.0 |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | — |
| PDF | ReportLab | 4.2.5 |
| Imágenes | Pillow | 11.1.0 |
| Excel | openpyxl | 3.1.5 |
| HTTP externo | requests | 2.32.3 |
| Variables de entorno | python-decouple / python-dotenv | — |
| AFIP | pyafipws | **⚠️ COMENTADO en requirements.txt — no instalado** |

### Frontend (POS)
| Componente | Tecnología | Versión |
|---|---|---|
| Lenguaje | JavaScript (JSX) | — |
| Framework | React | 18.2 |
| Build tool | Vite | 5.0 |
| Estilos | Tailwind CSS | 3.4 |
| Routing | React Router DOM | 6.21 |
| HTTP | Axios | 1.6 |
| Caché de datos | TanStack React Query | 5.17 |
| Formularios | React Hook Form | 7.49 |
| Gráficos | Recharts | 3.7 |
| Búsqueda fuzzy | Fuse.js | 7.1 |
| Estado global | Zustand | 4.4 |
| Íconos | lucide-react | 0.309 |
| Códigos de barras | jsbarcode | 3.12 |
| Fechas | date-fns | 3.2 |

### Launcher / Empaquetado
| Componente | Tecnología |
|---|---|
| Ejecutable | PyInstaller (ya compilado como `AvilaPOS.exe`) |
| Bandeja del sistema | pystray + Pillow |
| Fallback GUI | tkinter |
| Electron (alternativo) | electron 40.4 + electron-builder |

---

## 3. ESTRUCTURA DEL PROYECTO

```
Avila/
├── AvilaPOS.exe              ← Ejecutable compilado (lanzador)
├── LEEME.txt                 ← Guía para el usuario final
├── README.md                 ← Documentación técnica del proyecto
├── iniciar_avilapos.vbs      ← Alternativa sin consola (usa pythonw.exe)
├── iniciar_sistema.bat       ← Wrapper que llama a scripts/
│
├── backend/                  ← Proyecto Django
│   ├── apps/
│   │   ├── usuarios/         ← JWT, roles (ADMIN, CAJERO)
│   │   ├── clientes/         ← DNI, nombre, teléfono, historial
│   │   ├── productos/        ← ProductoBase + VarianteProducto + Marca + Categoría
│   │   ├── inventario/       ← Deposito, Stock, MovimientoStock
│   │   ├── ventas/           ← Venta + DetalleVenta (NÚCLEO)
│   │   ├── compras/          ← Proveedor + Compra + DetalleCompra
│   │   ├── reportes/         ← Consultas de análisis y exportación Excel
│   │   ├── devoluciones/     ← DevolucionVenta + NotaCredito
│   │   ├── cuenta_corriente/ ← TicketCuentaCorriente (para mecánicos)
│   │   ├── facturacion/      ← Factura AFIP + PDF + CAE (CENTRAL)
│   │   │   ├── models.py         ← PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP
│   │   │   ├── views.py          ← Endpoints REST (autorizar, PDF, etc.)
│   │   │   ├── afip_service.py   ← Wrapper: simulado O real
│   │   │   ├── afip_service_real.py ← Integración real WSAA + WSFEv1
│   │   │   └── pdf_generator.py  ← Generación PDF con ReportLab
│   │   ├── configuracion/    ← Parámetros del sistema (BD)
│   │   ├── clover/           ← Integración posnet Clover (en desarrollo)
│   │   ├── sistema/          ← Backups + AuditLog
│   │   ├── tienda/           ← API pública tienda web (catálogo, pedidos)
│   │   └── woocommerce/      ← Integración WooCommerce (no activa)
│   ├── backend/settings.py   ← Configuración Django (MEDIA_ROOT, CORS, etc.)
│   ├── manage.py
│   └── requirements.txt      ← Dependencias Python
│
├── frontend/                 ← React POS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PuntoVenta.jsx    ← PANTALLA PRINCIPAL del cajero
│   │   │   ├── Ventas.jsx        ← Listado de ventas + acciones PDF
│   │   │   ├── VentaDetalle.jsx  ← Detalle + Emitir Factura + Ticket
│   │   │   ├── Clientes.jsx / ClienteDetalle.jsx / ClienteForm.jsx
│   │   │   ├── Productos.jsx / ProductoDetalle.jsx / ProductoNuevo.jsx
│   │   │   ├── Inventario.jsx / StockCritico.jsx / AjustarStock.jsx
│   │   │   ├── Compras.jsx / RegistrarCompra.jsx / CompraDetalle.jsx
│   │   │   ├── Reportes.jsx
│   │   │   ├── Configuracion.jsx
│   │   │   ├── Devoluciones.jsx / NuevaDevolucion.jsx
│   │   │   ├── CuentaCorriente.jsx / NuevoTicketCC.jsx / TicketDetalle.jsx
│   │   │   ├── Backups.jsx / AuditLogs.jsx
│   │   │   └── Login.jsx
│   │   ├── components/
│   │   │   ├── TicketTermico.jsx  ← Impresión ticket térmico (ventana del navegador)
│   │   │   ├── PresupuestoPrint.jsx ← Presupuesto sin cobrar
│   │   │   ├── SeleccionarClienteModal.jsx
│   │   │   ├── Layout.jsx / SoftCard.jsx / MetricCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   ├── facturacionService.js ← crearFactura, autorizarFactura, generarPdf
│   │   │   ├── ventasService.js
│   │   │   ├── productosService.js
│   │   │   └── ...
│   │   ├── context/AuthContext.jsx  ← JWT, roles
│   │   ├── hooks/useAuth.js
│   │   └── App.jsx               ← Rutas de la SPA
│   └── package.json              ← Config Electron + Vite
│
├── launcher/
│   ├── launcher.py           ← Inicia Django + Vite, ícono bandeja sistema
│   └── running.pids          ← PIDs de los procesos activos
│
├── avila-web/                ← Tienda web pública (React + Vite, separada)
├── scripts/                  ← .bat / .ps1 de instalación y arranque
└── logs/                     ← avilapos.log
```

---

## 4. ESTADO ACTUAL DEL SISTEMA

### ✅ Funcionalidades implementadas y operativas
- **POS completo**: búsqueda por código, escáner, múltiples tickets paralelos, atajos F4/F10/F11/F12
- **Métodos de pago**: Efectivo (con cambio), Tarjeta (con cupón/autorización), Cuenta Corriente
- **Gestión de clientes**: alta rápida, búsqueda por DNI, historial de compras
- **Gestión de productos**: variantes, SKU, precios mostrador y tarjeta, importación Excel
- **Inventario**: stock por depósito, movimientos auditados, stock crítico, ajustes
- **Compras**: registro a proveedores, actualización automática de stock y costo
- **Devoluciones**: parciales/totales, nota de crédito, reversión de stock
- **Cuenta corriente**: tickets mecánicos, apertura/cierre con generación de venta
- **Reportes**: dashboard diario, ventas por período, productos más vendidos, márgenes, exportación Excel
- **Backup y auditoría**: backups manuales, log de acciones
- **Facturación PDF**: generación de PDF con ReportLab (encabezado, detalle, totales, CAE, pie)
- **Facturación AFIP simulada**: CAE falso para desarrollo (sin pyafipws)
- **Facturación AFIP real**: código escrito (`afip_service_real.py`) usando WSAA + WSFEv1
- **Launcher ejecutable**: `AvilaPOS.exe` inicia Django + Vite, ícono en bandeja

### ⚠️ Funcionalidades incompletas
- **pyafipws no instalado**: está comentado en `requirements.txt`. La facturación real requiere instalarlo manualmente: `pip install pyafipws`
- **QR AFIP en PDF**: los datos del QR se generan y guardan en `factura.qr_data` (URL base64), pero **el QR gráfico no se renderiza en el PDF** — solo aparece el CAE en texto
- **Clover (posnet)**: el módulo existe (`apps/clover/`) pero la integración LAN/REST con el dispositivo está incompleta
- **Tienda web**: funcional como catálogo (Fases 1-4 completadas) pero tiene muchos archivos sin commitear

### ❌ Funcionalidades con posibles bugs
- **Factura con cliente nulo**: el modelo `Factura` tiene `cliente = ForeignKey(NOT NULL)`, pero desde el frontend se puede intentar facturar una venta sin cliente, pasando `cliente: null`. Esto fallaría en BD. El flujo en VentaDetalle asume `venta.cliente` existe.
- **Tipo de documento en AFIP**: `afip_service_real.py` determina `TipoDoc` como DNI por defecto, pero el modelo `Factura` no guarda `cliente_tipo_documento` explícitamente. Esto puede generar rechazos en AFIP si el cliente es empresa (CUIT).
- **afip_service_real.py tiene múltiples try/except de compatibilidad**: el código tiene muchos fallbacks para distintas versiones de pyafipws, lo que indica inestabilidad con la librería. Si la versión instalada no coincide con ninguno de los fallbacks, puede fallar silenciosamente.

### 🔧 Partes que necesitan refactorización
- `afip_service_real.py`: los shims de compatibilidad deberían simplificarse una vez fijada la versión de pyafipws
- La lógica de selección de tipo de comprobante (FA vs FB) está hardcodeada en el frontend (`VentaDetalle.jsx`). Debería calcularse en el backend
- El campo `titular` en `pdf_generator.py` está hardcodeado como `'Avila Marcelo Bernabe'` como fallback

---

## 5. MÓDULO DE VENTAS

### ¿Cómo se registra una venta?
1. El cajero accede al **Punto de Venta** (`/` o `/pos`)
2. Escanea o escribe el código del producto → se agrega al ticket
3. Opcionalmente selecciona cliente (configurable si es obligatorio)
4. Elige método de pago (EFECTIVO / TARJETA / CC)
5. Presiona **F12 – Cobrar** o el botón verde
6. El sistema llama a `POST /api/ventas/ventas/` con los ítems
7. El backend descuenta stock, guarda la venta y devuelve el `id`
8. El frontend redirige a `/ventas/{id}` (VentaDetalle)

### Datos que guarda la venta
| Campo | Descripción |
|---|---|
| `numero` | Autoincremental único |
| `cliente` | FK opcional (según config) |
| `usuario` | Cajero que realizó la venta |
| `deposito` | Depósito desde donde se vende |
| `fecha` | Timestamp automático |
| `metodo_pago` | EFECTIVO / TRANSFERENCIA / TARJETA |
| `subtotal` | Suma de ítems |
| `descuento_porcentaje` / `descuento_monto` | Descuentos aplicados |
| `total` | Monto final |
| `tarjeta_cupon_numero` | Cupón del posnet (para tarjeta) |
| `tarjeta_codigo_autorizacion` | Código de autorización (para tarjeta) |
| `estado` | COMPLETADA / ANULADA |
| `motivo_anulacion` | Si fue anulada (solo admin) |

### Manejo de tarjeta
- El POS no conecta con Clover en tiempo real al momento de vender
- La venta se registra con `metodo_pago: 'TARJETA'`
- El cupón y autorización se cargan **después**, al emitir la factura AFIP desde VentaDetalle
- Si la venta es TARJETA y no tiene cupón/auth, se muestra un **modal previo** para cargarlos antes de facturar
- El endpoint `PATCH /api/ventas/ventas/{id}/actualizar_datos_tarjeta/` guarda esos datos

---

## 6. FACTURACIÓN ARCA / AFIP

### ¿Hay integración real?
**Sí, el código está escrito.** Hay dos capas:
- `afip_service.py`: wrapper que detecta si hay certificados configurados y elige el modo (simulado o real)
- `afip_service_real.py`: implementación real usando `pyafipws` con WSAA (autenticación) y WSFEv1 (emisión)

**El modo simulado** está activo por defecto porque `pyafipws` **no está instalado** (comentado en requirements.txt).

### Archivos relacionados con AFIP
| Archivo | Función |
|---|---|
| `backend/apps/facturacion/models.py` | Modelos: PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP |
| `backend/apps/facturacion/afip_service.py` | Selector simulado/real |
| `backend/apps/facturacion/afip_service_real.py` | WSAA + WSFEv1 reales |
| `backend/apps/facturacion/pdf_generator.py` | Generación del PDF |
| `backend/apps/facturacion/views.py` | API REST: autorizar, generar PDF, etc. |
| `backend/certs/` | Carpeta para certificados (pendiente de confirmar si existe) |

### ¿Qué necesita ConfiguracionAFIP?
| Campo | Estado |
|---|---|
| CUIT del emisor | **Pendiente de confirmar** |
| Razón social | **Pendiente de confirmar** |
| Domicilio comercial | **Pendiente de confirmar** |
| Condición IVA | **Pendiente de confirmar** |
| Inicio de actividades | **Pendiente de confirmar** |
| Ambiente (H=Homologación / P=Producción) | **Pendiente de confirmar** |
| Certificado (.crt) | **Pendiente — debe generarse en AFIP** |
| Clave privada (.key) | **Pendiente — debe generarse en AFIP** |

### Separación venta interna vs factura fiscal

| Aspecto | Venta interna | Factura fiscal AFIP |
|---|---|---|
| Modelo | `Venta` | `Factura` |
| Generación | Al cobrar en el POS | Manualmente desde VentaDetalle |
| CAE | No aplica | Requerido (AFIP lo otorga) |
| PDF | Ticket térmico | PDF con formato fiscal |
| Obligatorio | Siempre | Según requerimiento del cliente |
| Número | Autoincremental propio | Numeración AFIP por punto de venta y tipo |

### Flujo de facturación real (cuando esté configurada)
1. `POST /api/facturacion/facturas/` → crea borrador
2. `POST /api/facturacion/facturas/{id}/autorizar_afip/` → llama a AFIP, guarda CAE
3. Si hay certificados: usa `AFIPServiceReal` → WSAA token → WSFEv1 → `CAESolicitar()`
4. Si no hay certificados: usa modo simulado → CAE falso
5. Al autorizar: genera PDF automáticamente y lo guarda en `media/facturas/`

---

## 7. PDF E IMPRESIÓN

### ¿Se genera PDF?
**Sí.** El PDF se genera con **ReportLab** en `pdf_generator.py`.

### ¿Qué incluye el PDF?
| Sección | ¿Incluido? |
|---|---|
| Título (FACTURA A/B) | ✅ |
| Datos del emisor (razón social, CUIT, condición IVA) | ✅ |
| Número de comprobante | ✅ |
| Fecha de emisión | ✅ |
| CAE y vencimiento CAE | ✅ |
| Datos del cliente | ✅ |
| Detalle de productos (cant, descripción, precio, IVA, subtotal) | ✅ |
| Subtotal, IVA desglosado (solo Factura A), Total | ✅ |
| Cupón y autorización tarjeta (si aplica) | ✅ |
| Observaciones | ✅ |
| Pie fiscal con CAE | ✅ |
| QR AFIP (imagen gráfica) | ❌ **No renderizado — solo texto** |
| Logo del comercio | ❌ No incluido |

### ¿Dónde se guarda?
`backend/media/facturas/factura_venta_{id}_{tipo}_{pv}_{num}.pdf`

El campo `Factura.pdf_archivo` guarda la ruta relativa al MEDIA_ROOT.

### ¿Cómo se accede desde la interfaz?
- **En VentaDetalle**: botón "Ver Factura" o "Emitir Factura AFIP" → abre PDF en nueva pestaña
- **En Ventas (listado)**: columna "Factura" con botón **PDF** (abre el PDF) y **Regen.** (regenera sin re-emitir AFIP)
- **Ticket térmico**: botón "Imprimir Ticket" → abre `TicketTermico.jsx` → `window.print()`

### ¿Qué falta para dejarlo completamente funcional?
1. Renderizar el QR como imagen en el PDF (usando qrcode + Pillow)
2. Confirmar y cargar `ConfiguracionAFIP` con datos reales
3. Instalar `pyafipws` y descomentarlo en requirements.txt
4. Testear con homologación antes de pasar a producción

---

## 8. BASE DE DATOS

### Motor
- **Desarrollo**: SQLite (`backend/db.sqlite3`)
- **Producción preparada**: PostgreSQL via psycopg[binary]
- El launcher usa `USE_SQLITE=True` por variable de entorno

### Modelos principales y sus tablas

| App | Modelo | Campos clave |
|---|---|---|
| ventas | Venta | numero, cliente, usuario, deposito, fecha, subtotal, total, metodo_pago, tarjeta_cupon_numero, tarjeta_codigo_autorizacion, estado |
| ventas | DetalleVenta | venta, variante, cantidad, precio_unitario, descuento_unitario, subtotal, costo_unitario |
| facturacion | Factura | tipo_comprobante, punto_venta, numero, fecha_emision, cliente (FK NOT NULL), venta, estado, subtotal, iva_21, total, cae, cae_vencimiento, qr_data, pdf_archivo |
| facturacion | ItemFactura | factura, codigo, descripcion, cantidad, precio_unitario, alicuota_iva, subtotal, iva_21, total |
| facturacion | ConfiguracionAFIP | cuit_emisor, razon_social, ambiente, certificado, clave_privada, token, sign, token_expiracion |
| facturacion | PuntoVenta | numero, nombre, ultimo_numero_factura_a, ultimo_numero_factura_b |
| productos | ProductoBase | nombre, marca, categoria, activo |
| productos | VarianteProducto | sku, codigo_barras, costo, precio_mostrador, precio_tarjeta, precio_web, activo |
| clientes | Cliente | dni, nombre, telefono, email, direccion |
| inventario | Stock | variante, deposito, cantidad |
| inventario | MovimientoStock | variante, deposito, tipo, cantidad, usuario, referencia |

### Campos faltantes para facturación AFIP completa

| Campo | Dónde falta | Impacto |
|---|---|---|
| `cliente_tipo_documento` en Factura | Tabla `facturacion_factura` | AFIP necesita saber si el doc es DNI (96), CUIT (80), etc. |
| `condicion_iva` en Cliente | Tabla `clientes_cliente` | Para determinar automáticamente si emitir FA o FB |
| Soporte `cliente=null` en Factura | Modelo Factura | Ventas a Consumidor Final sin cliente registrado fallan |

### Mejoras propuestas (sin modificar todavía)
1. Agregar `condicion_iva` al modelo `Cliente` (RI, MT, EX, CF)
2. Hacer `cliente` nullable en `Factura` (para Consumidor Final sin registro)
3. Agregar `tipo_documento` al modelo `Cliente`
4. Agregar lógica en backend para auto-determinar tipo de comprobante según condición IVA del cliente

---

## 9. INSTALACIÓN / EJECUTABLE

### Estado del empaquetado
- `AvilaPOS.exe` ya existe (compilado con PyInstaller, ~13.9 MB)
- El exe ejecuta `launcher.py`, que a su vez:
  - Valida entorno (venv Python, node_modules)
  - Inicia Django (`manage.py runserver 127.0.0.1:8000`)
  - Inicia Vite (`npm run dev`)
  - Espera que ambos puertos respondan
  - Abre el navegador
  - Muestra ícono en bandeja del sistema

### Requisitos en la PC destino
| Requisito | ¿Incluido en el exe? |
|---|---|
| Python 3.11+ + venv | ❌ Debe estar instalado. El launcher busca `backend/venv/Scripts/python.exe` |
| Node.js + npm | ❌ Debe estar instalado. Se llama a `npm run dev` |
| node_modules | ❌ Deben existir en `frontend/`. Se instalan con `npm install` |
| Dependencias Python | ❌ Deben estar en el venv |

### Problemas actuales del ejecutable
1. **No es autocontenido**: requiere Python, Node.js y dependencias previamente instaladas
2. **Usa `npm run dev`**: inicia el servidor de desarrollo Vite, no un build de producción. En una PC sin Node.js o con versión incompatible, fallará
3. **El frontend no está compilado**: debería hacerse `npm run build` y servirse con whitenoise/nginx para un deploy real sin Node.js
4. **pyafipws no instalado**: si en algún momento se activa la facturación real, hay que instalarlo en el venv antes de compilar

### Scripts de instalación disponibles
- `scripts/instalar_todo.bat` → instala venv, pip, npm, migraciones, crea admin
- `scripts/verificar_sistema.bat` → diagnóstico y autoreparación
- `iniciar_avilapos.vbs` → alternativa sin exe (usa pythonw.exe para no mostrar consola)

---

## 10. PROBLEMAS DETECTADOS

### Bugs confirmados
1. **`pyafipws` no instalado** — comentado en `requirements.txt`. La facturación real fallará con `ImportError` silenciosa, cayendo al modo simulado.
2. **`Factura.cliente` es NOT NULL pero se puede pasar null** — Si se intenta facturar una venta sin cliente, el serializer fallará. El frontend no lo previene.
3. **QR no se renderiza en PDF** — `qr_data` se guarda como string JSON/URL pero nunca se convierte a imagen en el PDF.
4. **`titular` hardcodeado en PDF** — `EMISOR_DEFAULT['titular'] = 'Avila Marcelo Bernabe'` aparece siempre, incluso cuando hay `ConfiguracionAFIP` cargada.

### Riesgos al cambiar de PC
1. Node.js no instalado → Vite no arranca → frontend no disponible
2. Python versión diferente → incompatibilidades en venv
3. Puerto 8000 o 5173 ocupado → sistema no arranca (el launcher detecta esto pero solo avisa)
4. `db.sqlite3` no copiada → se pierde toda la data

### Dependencias no declaradas / comentadas
- `pyafipws==2024.1.0` — comentado en requirements.txt
- `python-escpos` — comentado (tickets térmicos reales)

### Archivos potencialmente sensibles
- `Clave Servidor DonWeb.txt` — en la raíz del proyecto. **No debe entrar al repositorio git**
- `backend/certs/` — certificados AFIP. **No deben commitearse jamás**

### Código no usado / desconectado
- `apps/woocommerce/` — integración WooCommerce, no activa
- `apps/clover/` — integración posnet Clover, incompleta
- `frontend/electron/` — carpeta Electron configurada pero el POS corre en navegador normal

---

## 11. PRÓXIMOS MOVIMIENTOS RECOMENDADOS

### Prioridad 1 — CRÍTICO (sistema funcione correctamente)
- [ ] Instalar `pyafipws` en el venv y descomentarlo en `requirements.txt`
- [ ] Cargar `ConfiguracionAFIP` en la BD (CUIT, razón social, ambiente H para empezar)
- [ ] Crear al menos un `PuntoVenta` en la BD (número AFIP, ej: 1)
- [ ] Hacer nullable `Factura.cliente` para soportar Consumidor Final sin registro
- [ ] Corregir el hardcode de `titular` en `pdf_generator.py`

### Prioridad 2 — FACTURACIÓN ARCA
- [ ] Obtener certificado digital AFIP (clave pública .crt + clave privada .key)
- [ ] Subir certificados a `ConfiguracionAFIP` (en Django Admin)
- [ ] Probar conexión WSAA en homologación (`POST /api/facturacion/configuracion-afip/{id}/probar_conexion/`)
- [ ] Emitir primera factura de prueba en homologación
- [ ] Agregar campo `condicion_iva` al modelo `Cliente` para auto-determinar FA vs FB
- [ ] Corregir determinación de `TipoDoc` en el servicio real

### Prioridad 3 — PDF, IMPRESIÓN Y UX
- [ ] Renderizar QR AFIP como imagen en el PDF (usando librería `qrcode`)
- [ ] Agregar logo del comercio en el PDF
- [ ] Mejorar layout del PDF (márgenes, fuentes, branding)
- [ ] Testear impresión del PDF desde distintas impresoras
- [ ] Botón "Reimprimir" en el listado de ventas que abra directamente el PDF

### Prioridad 4 — EMPAQUETADO COMO .EXE
- [ ] Compilar el frontend con `npm run build` y servir el build estático
- [ ] Configurar Django para servir el build de React (whitenoise)
- [ ] Eliminar la dependencia de `npm run dev` en producción
- [ ] Recompilar `AvilaPOS.exe` incluyendo las nuevas dependencias

### Prioridad 5 — MEJORAS FUTURAS
- [ ] Integración Clover (posnet LAN) para pagos en tiempo real
- [ ] Campo `condicion_iva` en Cliente para flujo de facturación automático
- [ ] Notas de crédito electrónicas AFIP (NCA, NCB)
- [ ] Backup automático en nube
- [ ] Notificaciones de stock crítico por WhatsApp

---

## 12. PLAN DE TRABAJO SUGERIDO

### Etapa 1 — Instalar dependencias y verificar entorno (1-2 horas)
- Instalar `pyafipws` en el venv
- Verificar que la facturación simulada sigue funcionando
- Confirmar que el PDF se genera correctamente

### Etapa 2 — Configurar AFIP en homologación (1-2 horas)
- Crear cuenta de prueba en AFIP (si no existe)
- Generar certificado de homologación
- Cargar datos en `ConfiguracionAFIP` vía Django Admin
- Crear PuntoVenta número 1
- Probar conexión desde el endpoint de test

### Etapa 3 — Corregir bugs de facturación (2-4 horas)
- Hacer `Factura.cliente` nullable (migración)
- Corregir hardcode de titular en PDF
- Agregar QR como imagen en el PDF
- Testear flujo completo: venta → factura → PDF → download

### Etapa 4 — Integración ARCA en homologación (1-2 días)
- Emitir primera Factura B a Consumidor Final
- Emitir Factura A a Responsable Inscripto
- Verificar CAE, número y formato en PDF
- Testear caso tarjeta (cupón + autorización en PDF)

### Etapa 5 — Pasar a producción AFIP (cuando esté homologado)
- Generar certificado de producción
- Cambiar ambiente a `P` en `ConfiguracionAFIP`
- Hacer prueba con factura real de bajo monto

### Etapa 6 — Mejorar PDF e impresión (1 día)
- QR como imagen
- Logo del comercio
- Botón de reimpresión mejorado

### Etapa 7 — Empaquetar como .exe definitivo (1-2 días)
- Build del frontend (`npm run build`)
- Configurar Django para servir el build
- Recompilar launcher con PyInstaller
- Testear en PC sin Node.js instalado

### Etapa 8 — Pruebas en la PC real del comercio (1 día)
- Instalar con `instalar_todo.bat`
- Cargar datos reales (productos, clientes, proveedor)
- Hacer 5 ventas de prueba con distintos métodos de pago
- Emitir facturas reales
- Verificar impresión de tickets y PDFs

---

## 13. INFORMACIÓN FALTANTE — PENDIENTE DE CONFIRMAR

Los siguientes datos son necesarios para continuar. Por favor confirmá cada uno:

### Datos fiscales del comercio
| Dato | Estado |
|---|---|
| **CUIT del titular** | Pendiente (ej: 20-12345678-9) |
| **Nombre / Razón social** | Pendiente (ej: Avila Marcelo Bernabe) |
| **Condición fiscal** | Pendiente (Responsable Inscripto, Monotributista, etc.) |
| **Domicilio comercial completo** | Pendiente |
| **Fecha de inicio de actividades** | Pendiente |
| **Número de punto de venta AFIP** | Pendiente (ej: 1, 2, 3) |
| **Tipo de factura habitual** | Pendiente (¿Factura B para la mayoría de clientes?) |

### Configuración AFIP
| Dato | Estado |
|---|---|
| ¿Se arrancará en homologación primero? | Pendiente de confirmar |
| ¿Ya tenés certificado digital AFIP? (.crt + .key) | Pendiente |
| ¿Usarás pyafipws o conexión directa SOAP? | pyafipws ya está implementado |
| ¿El CUIT del titular ya está dado de alta en AFIP para WSFEv1? | Pendiente |

### Operación y hardware
| Dato | Estado |
|---|---|
| ¿El sistema funciona en red local o solo en la misma PC? | Pendiente |
| ¿Qué impresora se usa para tickets? ¿Térmica con ESC/POS? | Pendiente |
| ¿Qué impresora se usa para facturas PDF? ¿Normal de escritorio? | Pendiente |
| ¿Seguirá integrándose Clover, o se cargará manual cupón/auth? | Pendiente |
| ¿La PC del comercio tiene acceso a internet? (necesario para AFIP) | Pendiente |

### Almacenamiento
| Dato | Estado |
|---|---|
| ¿Dónde guardar los PDFs en producción? (ruta local) | Por defecto: `backend/media/facturas/` |
| ¿Se quiere backup automático de los PDFs? | Pendiente |
| ¿Se usa SQLite o se migrará a PostgreSQL? | SQLite actualmente |

---

*Documento generado el 2026-06-06. Basado en análisis completo del código sin modificaciones.*
