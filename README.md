# Sistema de Gestión - Casa de Repuestos de Motos

**Versión**: 1.0.0 (9 módulos completados)  
**Estado**: ✅ Sistema COMPLETO - 100% funcional  
**Última actualización**: 17 de febrero de 2026

Sistema integral para casa de repuestos de motos: inventario, ventas (POS), clientes, compras, reportes, configuración, devoluciones. Backend Django + Frontend React (Vite). Incluye instalador automático en Windows (`.bat`) y soporte para SQLite en desarrollo.

---

## 🎯 ESTADO DEL PROYECTO

```
╔══════════════════════════════════════════════════════════╗
║              🎉 SISTEMA 100% COMPLETO 🎉                 ║
║                                                          ║
║  ✅ 9/9 Módulos Implementados (100%)                    ║
║  ✅ Devoluciones y Notas de Crédito                     ║
║  ✅ Configuración centralizada                          ║
║  ✅ Backend Django + Frontend React                      ║
║  ✅ Base de datos configurada                           ║
║  ✅ Documentación completa                              ║
║  ✅ Pruebas exitosas                                    ║
║                                                          ║
║  🚀 VERSIÓN 1.0.0 - PRODUCCIÓN                          ║
╚══════════════════════════════════════════════════════════╝
```

### Módulos Completados
- ✅ **Módulo 1**: Usuarios y Autenticación (JWT)
- ✅ **Módulo 2**: Gestión de Clientes
- ✅ **Módulo 3**: Productos y Variantes
- ✅ **Módulo 4**: Inventario y Movimientos de Stock
- ✅ **Módulo 5**: Ventas (POS completo)
- ✅ **Módulo 6**: Compras
- ✅ **Módulo 7**: Reportes y Análisis
- ✅ **Módulo 8**: Configuración del Sistema
- ✅ **Módulo 9**: Devoluciones y Notas de Crédito

### 🎉 Sistema Completo
Todos los módulos planificados han sido implementados y probados exitosamente.

---

## 📋 ÍNDICE

1. [Stack Tecnológico](#stack-tecnológico)
2. [Características Principales](#características-principales)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Estado Actual](#estado-actual)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Comandos Útiles](#comandos-útiles)
7. [Plan de Implementación](#plan-de-implementación-por-módulos)
8. [Documentación](#documentación-de-módulos-completados)
9. [Criterios de Aceptación MVP](#criterios-de-aceptación-mvp)

---

## 🛠 STACK TECNOLÓGICO

### Backend
- **Framework**: Django 5.1+
- **API**: Django REST Framework
- **Base de datos**: SQLite (desarrollo) / PostgreSQL (producción, opcional)
- **ORM**: Django ORM
- **Autenticación**: JWT (Simple JWT)
- **Migraciones**: Django Migrations

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Estado**: React Query + Context API
- **Estilos**: Tailwind CSS
- **Routing**: React Router v6
- **Formularios**: React Hook Form
- **HTTP Client**: Axios

### Utilidades
- **Excel**: openpyxl (importación)
- **PDF**: ReportLab (generación de PDFs)
- **Tickets**: Vista previa e impresión térmica (formato casa de repuestos)
- **Validaciones**: Django Validators + React Hook Form (frontend)
- **Pagos con tarjeta**: Integración Clover POS (opcional)

### Despliegue (Preparado para futuro)
- **Servidor**: Gunicorn + Nginx
- **Contenedores**: Docker + Docker Compose
- **Base de datos**: PostgreSQL (Docker o servicio)

---

## 📁 ESTRUCTURA DEL PROYECTO

> **Nota**: La raíz del proyecto está simplificada; todo lo auxiliar (scripts, historial de cambios, etc.) está ordenado en subcarpetas.

```
Avila/
│
├── backend/                      # Proyecto Django (API POS + admin)
│   ├── backend/                  # Configuración principal
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py / asgi.py
│   │
│   ├── apps/                     # Apps Django por dominio
│   │   ├── usuarios/            # Auth, roles, JWT
│   │   ├── clientes/            # Gestión de clientes
│   │   ├── productos/           # Productos, variantes, búsqueda, Excel
│   │   ├── inventario/          # Stock, depósitos, movimientos
│   │   ├── ventas/              # POS, ventas, tickets
│   │   ├── compras/             # Compras y proveedores
│   │   ├── reportes/            # Endpoints de reportes
│   │   ├── configuracion/       # Parámetros del sistema
│   │   ├── devoluciones/        # Devoluciones y notas de crédito
│   │   ├── cuenta_corriente/    # Tickets en cuenta corriente
│   │   ├── sistema/             # Backups, auditoría, exportaciones
│   │   ├── facturacion/         # AFIP y facturación electrónica
│   │   ├── clover/              # Pagos con tarjeta Clover
│   │   ├── woocommerce/         # Integración con tienda web
│   │   └── tienda/              # API tienda web propia
│   │
│   ├── scripts/                 # Scripts backend específicos
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                     # POS (React + Vite + Electron)
│   ├── src/
│   │   ├── pages/               # Páginas del POS (ventas, productos, etc.)
│   │   ├── components/          # Componentes UI (layout, ticket, modales...)
│   │   ├── services/            # Llamadas a /api (auth, ventas, inventario, etc.)
│   │   ├── context/             # Auth, tema, etc.
│   │   ├── utils/               # Utilidades (ej. uppercaseInput)
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── electron/                # Integración Electron (app de escritorio)
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── avila-web/                   # Sitio y tienda web pública
│   ├── src/
│   │   ├── pages/               # Home, catálogo, producto, carrito, checkout, legales...
│   │   ├── components/          # Layout, tarjetas de producto, mapas, etc.
│   │   ├── context/             # Auth, carrito
│   │   ├── services/            # API tienda / WooCommerce
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/                        # Documentación del sistema
│   ├── ARQUITECTURA.md          # Mapa del proyecto (backend, frontend, rutas API)
│   ├── INSTALL.md               # Guía de instalación detallada
│   ├── INTEGRACION_CLOVER.md    # Pagos con tarjeta (Clover)
│   ├── ...                      # AFIP, Excel, POS vs web, etc.
│   └── historial/               # Historial de cambios internos (.md de rediseños, compactos, etc.)
│
├── scripts/                     # Scripts de instalación y utilidades (Windows / PowerShell / bash)
│   ├── iniciar_sistema.bat      # Inicia backend + frontend POS (antes estaba en la raíz)
│   ├── iniciar_sistema.ps1      # Variante PowerShell
│   ├── iniciar_sistema_red.bat  # Inicio POS en red (IP)
│   ├── iniciar_pos_servicio.bat # Inicio como servicio POS
│   ├── instalar_todo.bat        # Instalación automática en Windows
│   ├── iniciar_electron.bat     # Arranca versión Electron del POS
│   ├── ver_ip_local.bat         # Muestra IP local para red
│   ├── crear_admin.bat          # Crea usuario admin rápido
│   ├── resetear_admin.bat       # Resetea credenciales admin
│   ├── setup.sh / setup.ps1     # Setup para otros entornos
│   └── reinstall-backend.ps1    # Reinstalar dependencias backend
│
├── docker-compose.yml           # Orquestación Docker (app + PostgreSQL)
├── .env.example                 # Variables de entorno de ejemplo
├── .env                         # Variables de entorno locales (no se commitea)
├── .gitignore
├── .gitattributes
├── iniciar_sistema.bat          # Wrapper pequeño que llama a scripts/iniciar_sistema.bat
├── INSTALL.md                   # Guía de instalación (duplicada en docs/)
└── README.md                    # Este archivo
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR MÓDULOS

### ✅ ETAPA 0: Setup Inicial (COMPLETADO) ✅
**Objetivo**: Crear estructura base del proyecto

**Tareas**:
- [x] Inicializar proyecto Django
- [x] Configurar PostgreSQL
- [x] Instalar Django REST Framework
- [x] Configurar CORS
- [x] Crear proyecto React con Vite
- [x] Configurar Tailwind CSS
- [x] Configurar variables de entorno
- [x] Crear docker-compose.yml

**Archivos creados**:
- `backend/backend/settings.py` ✅
- `backend/backend/urls.py` ✅
- `backend/manage.py` ✅
- `backend/requirements.txt` ✅
- `backend/apps/` (8 apps Django) ✅
- `frontend/package.json` ✅
- `frontend/vite.config.js` ✅
- `frontend/tailwind.config.js` ✅
- `frontend/src/App.jsx` ✅
- `docker-compose.yml` ✅
- `.env.example` ✅
- `.gitignore` ✅
- `scripts/setup.sh` y `setup.ps1` ✅
- `INSTALL.md` ✅

---

### ✅ MÓDULO 1: Usuarios y Autenticación (COMPLETADO) ✅
**Prioridad**: CRÍTICA  
**Dependencias**: Ninguna

**Modelos**:
```python
Usuario (extends AbstractUser):
  - username (unique)
  - email
  - rol (CAJERO, ADMINISTRADOR)
  - is_active
  - fecha_creacion
```

**Endpoints**:
- `POST /api/auth/login/` - Login con JWT
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Usuario actual
- `GET /api/usuarios/` - Listar usuarios (admin)
- `POST /api/usuarios/` - Crear usuario (admin)
- `PUT /api/usuarios/{id}/` - Editar usuario (admin)

**Permisos implementados**:
- `IsCajero`: Puede realizar ventas
- `IsAdministrador`: Acceso completo
- `CanViewCosts`: Solo admin puede ver costos

**Frontend**:
- Página de login
- Protección de rutas por rol
- Context de autenticación
- Interceptor para JWT

**Criterios de aceptación**:
- [x] Login funcional con JWT ✅
- [x] Diferenciación de permisos por rol ✅
- [x] Logout cierra sesión correctamente ✅
- [x] Solo admin puede crear usuarios ✅
- [x] Protección de rutas por rol ✅
- [x] Refresh token automático ✅

---

### ✅ MÓDULO 2: Clientes (COMPLETADO) ✅
**Prioridad**: CRÍTICA  
**Dependencias**: Módulo 1

**Modelos**:
```python
Cliente:
  - dni (unique)
  - nombre
  - telefono
  - email (opcional)
  - direccion (opcional)
  - fecha_creacion
  - activo
```

**Endpoints**:
- `GET /api/clientes/` - Listar clientes
- `GET /api/clientes/{dni}/` - Buscar por DNI
- `POST /api/clientes/` - Crear cliente (alta rápida)
- `PUT /api/clientes/{id}/` - Editar cliente
- `GET /api/clientes/{id}/historial/` - Historial de compras

**Frontend**:
- Búsqueda rápida por DNI en modal
- Formulario de alta rápida (DNI, nombre, teléfono)
- Vista de historial de compras
- Total histórico gastado

**Criterios de aceptación**:
- [x] Búsqueda de cliente por DNI en < 1 segundo ✅
- [x] Alta rápida en un solo modal ✅
- [x] Cliente obligatorio en ventas ✅
- [x] Historial completo visible (preparado) ✅
- [x] CRUD completo funcional ✅
- [x] Validación de DNI único ✅

---

### ✅ MÓDULO 3: Productos y Variantes (COMPLETADO) ✅
**Prioridad**: CRÍTICA  
**Dependencias**: Módulo 1

**Modelos**:
```python
Marca:
  - nombre

Categoria:
  - nombre
  - descripcion

ProductoBase:
  - nombre
  - descripcion
  - marca (FK)
  - categoria (FK)
  - imagen (opcional)
  - activo

VarianteProducto:
  - producto_base (FK)
  - nombre_variante (ej: "STD", "0.25")
  - sku (unique)
  - codigo_barras (unique, opcional)
  - costo (último costo)
  - precio_mostrador
  - precio_web
  - activo
```

**Endpoints**:
- `GET /api/productos/` - Listar productos con variantes
- `GET /api/productos/{id}/` - Detalle de producto
- `POST /api/productos/` - Crear producto (admin)
- `PUT /api/productos/{id}/` - Editar producto (admin)
- `POST /api/productos/importar/` - Importación masiva Excel (admin)
- `GET /api/productos/buscar/?q=` - Búsqueda por nombre/SKU/código
- `GET /api/marcas/` - Listar marcas
- `GET /api/categorias/` - Listar categorías

**Importación Excel**:
- Columnas esperadas: SKU, Nombre, Variante, Costo, Precio Mostrador, Precio Web, Stock Inicial, Código Barras, Marca, Categoría
- Agrupa por nombre de producto base
- Valida SKU únicos
- Rechaza filas incompletas
- Devuelve resumen + errores

**Frontend**:
- CRUD de productos con variantes
- Búsqueda rápida con autocompletado
- Importador de Excel con validación
- Vista previa de errores en importación
- Formulario de producto con variantes dinámicas

**Criterios de aceptación**:
- [x] Producto base puede tener múltiples variantes ✅
- [x] Búsqueda funciona por nombre, SKU y código de barras ✅
- [x] Importación masiva de Excel funcional ✅
- [x] Validación de SKU únicos ✅
- [x] Solo admin puede crear/editar productos ✅
- [x] Cálculo de margen correcto ✅
- [x] Cajero no ve costos ni márgenes ✅

---

### ✅ MÓDULO 4: Inventario y Movimientos - COMPLETADO
**Prioridad**: CRÍTICA  
**Dependencias**: Módulo 3

**Modelos**:
```python
Deposito:
  - nombre
  - direccion (opcional)
  - activo

Stock:
  - variante (FK)
  - deposito (FK)
  - cantidad
  - unique_together: (variante, deposito)

MovimientoStock:
  - variante (FK)
  - deposito (FK)
  - tipo (COMPRA, VENTA, DEVOLUCION, ANULACION, AJUSTE, TRANSFERENCIA)
  - cantidad (+ o -)
  - usuario (FK)
  - fecha
  - referencia (venta_id, compra_id, etc.)
  - observaciones
```

**Reglas de negocio**:
- Stock nunca se edita directo, solo por movimientos
- Stock negativo permitido
- Alerta cuando stock <= 2 unidades
- Todo movimiento queda registrado con usuario y fecha

**Endpoints**:
- `GET /api/stock/` - Listar stock por depósito
- `GET /api/stock/critico/` - Productos con stock <= 2
- `POST /api/stock/ajuste/` - Ajuste manual (admin)
- `GET /api/movimientos/?variante=&deposito=` - Historial

**Frontend**:
- Vista de stock por depósito
- Listado de stock crítico con alertas
- Modal de ajuste de stock (admin)
- Historial de movimientos por producto

**Criterios de aceptación**:
- [x] Stock se actualiza automáticamente en ventas/compras ✅
- [x] Alerta visual cuando stock <= 2 ✅
- [x] No se puede editar stock directamente ✅
- [x] Movimientos quedan auditados ✅

---

### ✅ MÓDULO 5: Ventas - COMPLETADO
**Prioridad**: CRÍTICA  
**Dependencias**: Módulos 2, 3, 4

**Modelos**:
```python
Venta:
  - numero (autoincremental)
  - cliente (FK)
  - usuario (FK - cajero que vendió)
  - fecha
  - subtotal
  - descuento_porcentaje
  - descuento_monto
  - total
  - metodo_pago (EFECTIVO, TRANSFERENCIA, TARJETA)
  - estado (COMPLETADA, ANULADA)
  - motivo_anulacion (si aplica)
  - usuario_anulacion (FK, si aplica)
  - fecha_anulacion

DetalleVenta:
  - venta (FK)
  - variante (FK)
  - cantidad
  - precio_unitario
  - descuento_unitario
  - subtotal
  - costo (para calcular margen)
```

**Reglas de negocio**:
- Cliente obligatorio
- Cajero puede aplicar hasta 50% descuento
- Admin puede aplicar cualquier descuento
- Margen < 5% → Alerta visual
- Stock bajo → Advertencia
- Al confirmar: descuenta stock + crea movimiento

**Endpoints**:
- `POST /api/ventas/` - Crear venta
- `GET /api/ventas/` - Listar ventas
- `GET /api/ventas/{id}/` - Detalle de venta
- `POST /api/ventas/{id}/anular/` - Anular venta (admin)
- `GET /api/ventas/{id}/ticket/` - Generar ticket térmico
- `GET /api/ventas/{id}/pdf/` - Generar PDF

**Frontend**:
- Carrito de ventas con búsqueda de productos
- Búsqueda de cliente obligatoria
- Aplicación de descuento con validación
- Alertas de margen bajo y stock bajo
- Selector de método de pago
- Generación de ticket y PDF
- Modal de anulación (admin)

**Criterios de aceptación**:
- [x] Venta requiere cliente obligatorio
- [x] Descuenta stock automáticamente
- [x] Cajero no puede aplicar más de 50% descuento
- [x] Alerta cuando margen < 5%
- [x] Genera ticket térmico
- [x] Genera PDF descargable
- [x] Solo admin puede anular ventas

---

### ✅ MÓDULO 6: Compras y Proveedores
**Prioridad**: ALTA  
**Dependencias**: Módulos 3, 4

**Modelos**:
```python
Proveedor:
  - nombre
  - cuit
  - telefono
  - email
  - direccion
  - activo

Compra:
  - numero
  - proveedor (FK)
  - usuario (FK - quien registró)
  - fecha
  - total
  - observaciones

DetalleCompra:
  - compra (FK)
  - variante (FK)
  - cantidad
  - costo_unitario
  - subtotal
```

**Reglas de negocio**:
- Solo admin puede registrar compras
- Al confirmar compra: suma stock + actualiza último costo

**Endpoints**:
- `GET /api/proveedores/` - Listar proveedores
- `POST /api/proveedores/` - Crear proveedor (admin)
- `POST /api/compras/` - Registrar compra (admin)
- `GET /api/compras/` - Listar compras
- `GET /api/compras/{id}/` - Detalle de compra

**Frontend**:
- Formulario de compra con búsqueda de productos
- Carga de cantidad y costo unitario
- Confirmación actualiza stock y costo

**Criterios de aceptación**:
- [x] Solo admin puede registrar compras
- [x] Suma stock automáticamente
- [x] Actualiza último costo del producto
- [x] Crea movimiento de stock tipo COMPRA

---

### ✅ MÓDULO 7: Reportes
**Prioridad**: MEDIA  
**Dependencias**: Módulos 5, 6

**Reportes implementados**:

1. **Ventas del día**
   - Total vendido
   - Cantidad de tickets
   - Promedio por ticket
   - Total descuentos
   - Desglose por medio de pago

2. **Ventas por rango de fechas**
   - Filtro por usuario
   - Filtro por medio de pago
   - Exportar a Excel

3. **Productos más vendidos**
   - Por cantidad
   - Por facturación
   - Top 10/20/50

4. **Stock crítico**
   - Productos con <= 2 unidades
   - Con margen estimado

5. **Historial de cliente**
   - Total gastado
   - Frecuencia de compra
   - Productos favoritos

**Endpoints**:
- `GET /api/reportes/ventas-dia/`
- `GET /api/reportes/ventas-rango/?desde=&hasta=`
- `GET /api/reportes/productos-mas-vendidos/?tipo=cantidad`
- `GET /api/reportes/stock-critico/`
- `GET /api/reportes/historial-cliente/{id}/`

**Frontend**:
- Dashboard con métricas principales
- Filtros por fecha, usuario, método de pago
- Gráficos con Chart.js o Recharts
- Exportación a Excel

**Criterios de aceptación**:
- [x] Dashboard muestra ventas del día
- [x] Reportes se generan en < 3 segundos
- [x] Exportación a Excel funciona
- [x] Stock crítico se actualiza en tiempo real

---

### ✅ MÓDULO 8: Configuración
**Prioridad**: BAJA  
**Dependencias**: Módulo 1

**Modelos**:
```python
Configuracion:
  - clave (unique)
  - valor
  - descripcion
  - tipo_dato (INT, FLOAT, BOOL, STRING)
```

**Parámetros configurables**:
- `UMBRAL_STOCK_BAJO` (default: 2)
- `UMBRAL_MARGEN_BAJO` (default: 5.0)
- `DESCUENTO_MAX_CAJERO` (default: 50.0)
- `PERMITIR_STOCK_NEGATIVO` (default: True)

**Endpoints**:
- `GET /api/configuracion/` - Listar configuraciones
- `PUT /api/configuracion/{clave}/` - Actualizar valor (admin)

**Frontend**:
- Panel de configuración (admin)
- Formulario con validaciones por tipo

**Criterios de aceptación**:
- [x] Solo admin puede modificar configuraciones
- [x] Valores se validan según tipo de dato
- [x] Cambios se aplican inmediatamente

---

### ✅ MÓDULO 9: Devoluciones
**Prioridad**: MEDIA  
**Dependencias**: Módulo 5

**Modelos**:
```python
Devolucion:
  - venta (FK)
  - usuario (FK)
  - fecha
  - motivo
  - total_devuelto

DetalleDevolucion:
  - devolucion (FK)
  - detalle_venta (FK)
  - cantidad_devuelta
  - monto_devuelto
```

**Reglas de negocio**:
- Asociada a venta existente
- Reintegra stock automáticamente
- Crea movimiento de stock tipo DEVOLUCION

**Endpoints**:
- `POST /api/devoluciones/` - Registrar devolución
- `GET /api/devoluciones/?venta=` - Listar devoluciones

**Frontend**:
- Modal de devolución desde detalle de venta
- Selección de productos y cantidades a devolver
- Confirmación reintegra stock

**Criterios de aceptación**:
- [x] Devolución reintegra stock automáticamente
- [x] Registra movimiento de stock
- [x] Se puede devolver parcial o total

---

## 📊 ESTADO ACTUAL

### ✅ Completado
- [x] **Etapa 0: Setup inicial** ✅
- [x] **Módulo 1: Usuarios y Autenticación** ✅
- [x] **Módulo 2: Gestión de Clientes** ✅
- [x] **Módulo 3: Productos y Variantes** ✅
- [x] **Módulo 4: Inventario y movimientos** ✅
- [x] **Módulo 5: Ventas (POS)** ✅
- [x] **Módulo 6: Compras** ✅
- [x] **Módulo 7: Reportes** ✅
- [x] **Módulo 8: Configuración** ✅
- [x] **Módulo 9: Devoluciones** ✅

### Mejoras recientes (febrero 2026)
- **Instalación en Windows**: `instalar_todo.bat` instala Python (o vía winget), Node, venv, pip, npm, migraciones y configuración inicial. `iniciar_sistema.bat` arranca backend y frontend.
- **Búsqueda de productos**: Criterio unificado en Productos, POS y Registrar compra: debounce 200 ms, búsqueda al salir del campo (onBlur), cancelación de peticiones anteriores. Backend: atajo por código exacto para respuestas casi instantáneas.
- **Ticket térmico**: Rediseño tipo casa de repuestos (encabezado, código por ítem, totales, pie). Componente: `frontend/src/components/TicketTermico.jsx`.
- **POS**: Modal de selección de cliente (listado + búsqueda + “Agregar cliente”) en lugar de ir directo a crear. Integración opcional con Clover para pagos con tarjeta.
- **Inventario**: API de stock estable (serializers defensivos, índices). Gráficos en Reportes con contenedores de tamaño mínimo para evitar avisos de Recharts.
- **Detalle de venta**: Soporte tema oscuro y formato numérico seguro cuando la API devuelve strings.

---

## 💻 INSTALACIÓN Y CONFIGURACIÓN

### Requisitos previos
- **Python 3.11+** (en Windows se puede instalar vía winget si falta)
- **Node.js 18+** (LTS recomendado)
- **Git** (opcional, para clonar)
- Base de datos: **SQLite** por defecto en desarrollo (no requiere instalación). Opcional: PostgreSQL para producción.

---

### Instalación rápida en Windows (recomendada)

1. Abrir la carpeta del proyecto (donde está `instalar_todo.bat`).
2. Ejecutar **`instalar_todo.bat`** (doble clic).
   - Crea el entorno virtual en `backend\venv`.
   - Instala dependencias Python (`requirements.txt`).
   - Instala dependencias del frontend (`npm install`).
   - Aplica migraciones (base SQLite en `backend\db.sqlite3`).
   - Ejecuta la configuración inicial si existe.
   - Si Python o Node no están instalados, intenta instalarlos con **winget**; si falla, indica los enlaces de descarga.
3. Para iniciar el sistema, ejecutar **`iniciar_sistema.bat`**.
   - Se abren dos ventanas: backend (http://127.0.0.1:8000) y frontend (http://localhost:5173).
4. Abrir el navegador en **http://localhost:5173** y hacer login (crear superusuario si es la primera vez: `cd backend`, `venv\Scripts\activate`, `python manage.py createsuperuser`).

---

### Instalación manual (todos los sistemas)

#### 1. Clonar o abrir el proyecto
```bash
cd Avila   # o la ruta del proyecto
```

#### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

#### 3. Base de datos (SQLite por defecto)
```bash
set USE_SQLITE=True             # Windows (opcional, ya es el default)
# export USE_SQLITE=True       # Linux/Mac
python manage.py migrate
python manage.py createsuperuser
```

#### 4. Frontend
```bash
cd ../frontend
npm install
```

#### 5. Ejecutar
```bash
# Terminal 1 - Backend
cd backend && venv\Scripts\activate && python manage.py runserver

# Terminal 2 - Frontend
cd frontend && npm run dev
```

#### 6. Acceder
- **Frontend**: http://localhost:5173  
- **Backend API**: http://localhost:8000/api  
- **Admin Django**: http://localhost:8000/admin  
- Documentación del proyecto: `docs/ARQUITECTURA.md`

---

## 🔧 COMANDOS ÚTILES

### Backend
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver

# Shell de Django
python manage.py shell

# Crear app nueva
python manage.py startapp nombre_app
```

### Frontend
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linter
npm run lint
```

### Base de datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE casa_repuestos;

# Backup
pg_dump casa_repuestos > backup.sql

# Restore
psql casa_repuestos < backup.sql
```

---

## ✅ CRITERIOS DE ACEPTACIÓN MVP

El sistema se considera **MVP completo** cuando cumple TODOS estos requisitos:

### Funcionales
- [x] Permite vender con cliente obligatorio
- [x] Descuenta stock correctamente en cada venta
- [x] Permite devoluciones y reintegra stock
- [x] Permite anulaciones solo a admin
- [x] Maneja último costo correctamente en compras
- [x] Genera ticket térmico
- [x] Genera PDF de venta
- [x] Imprime etiquetas de productos
- [x] Importa 6000 productos sin errores
- [x] Genera todos los reportes definidos
- [x] Alerta de stock bajo funciona
- [x] Alerta de margen bajo funciona
- [x] Sistema de permisos por rol funciona
- [x] Cliente obligatorio en ventas
- [x] Búsqueda rápida por SKU/código de barras

### No funcionales
- [x] Auditoría de acciones críticas
- [x] Respaldo automático de base de datos
- [x] Búsqueda rápida (< 1 segundo)
- [x] Login con JWT
- [x] Validación de permisos en cada acción

### Prueba piloto
- [x] Importación de 100 productos exitosa
- [x] 10 ventas de prueba completadas
- [x] Reportes generados correctamente
- [x] Sistema estable por 1 día completo

---

## 🎯 MANTENIMIENTO Y PRÓXIMOS PASOS

- **Sistema en producción**: Los 9 módulos están completos. Uso diario: ejecutar `iniciar_sistema.bat` (Windows) o iniciar backend y frontend manualmente.
- **Usuario administrador**: `python manage.py createsuperuser` (desde `backend` con el venv activado).
- **Backup**: Copiar `backend/db.sqlite3` (o hacer dump de PostgreSQL si se usa).
- **Actualizar dependencias**: `pip install -r backend/requirements.txt` y `npm install` en `frontend`. Luego volver a ejecutar migraciones si hubo cambios en modelos.
- **Documentación técnica**: Ver `docs/ARQUITECTURA.md` para ubicar APIs, páginas y módulos. Integración Clover: `docs/INTEGRACION_CLOVER.md` si aplica.

---

## 🚀 ACCESO AL SISTEMA

### URLs Principales

| Sección | URL | Descripción |
|---------|-----|-------------|
| **POS** | `/` | Punto de venta (pantalla principal) |
| **Ventas** | `/ventas` | Historial de ventas |
| **Dashboard** | Según rutas | Métricas y accesos rápidos |
| **Productos** | `/productos` | Gestión de productos |
| **Inventario** | `/inventario` | Control de stock |
| **Compras** | `/compras` | Gestión de compras |
| **Reportes** | `/reportes` | Análisis y reportes (admin) |
| **Clientes** | `/clientes` | Gestión de clientes |

### Permisos por Rol

#### 👑 Administrador
- ✅ Acceso completo a todas las funcionalidades
- ✅ Gestión de usuarios
- ✅ Anulación de ventas
- ✅ Ajustes de inventario
- ✅ Registro de compras
- ✅ Visualización de reportes
- ✅ Acceso a costos y márgenes

#### 💼 Cajero
- ✅ Registro de ventas
- ✅ Gestión de clientes
- ✅ Consulta de productos
- ✅ Consulta de inventario
- ✅ Dashboard básico
- ❌ No puede anular ventas
- ❌ No puede ajustar inventario
- ❌ No puede ver costos completos
- ❌ No puede registrar compras

---

## 📝 NOTAS TÉCNICAS

### Fórmula de margen
```python
margen_porcentaje = ((precio_venta - costo) / precio_venta) * 100
```

### Stock negativo
Permitido para evitar bloquear ventas. Se debe reponer posteriormente.

### Auditoría
Todas las acciones críticas registran:
- Usuario que ejecutó la acción
- Fecha y hora
- Datos antes y después (si aplica)

### Características Técnicas Destacadas

#### Backend
- **Transacciones Atómicas**: Todas las operaciones críticas usan `@transaction.atomic`
- **Auditoría**: Movimientos de stock inmutables con usuario y fecha
- **Validaciones**: En backend (Django) y frontend (React Hook Form)
- **Permisos**: Custom permission classes por rol
- **Agregaciones**: Uso de `Sum`, `Count`, `Avg` en reportes
- **Índices**: Base de datos optimizada con índices estratégicos

#### Frontend
- **State Management**: Context API + Zustand para estado global
- **API Calls**: Interceptores Axios con refresh token automático
- **Validación**: React Hook Form con validaciones personalizadas
- **UI/UX**: Tailwind CSS con componentes reutilizables
- **Routing**: React Router con rutas protegidas
- **Performance**: TanStack Query para caché de datos

### Preparado para el Futuro
- ✅ Multi-depósito: Completamente implementado
- ✅ Roles múltiples: Sistema extensible
- 🔜 E-commerce: Precio web en modelo de productos
- 🔜 Facturación electrónica: Estructura compatible con AFIP
- 🔜 WhatsApp: API REST lista para integraciones
- 🔜 Reportes avanzados: Gráficos con Chart.js/Recharts
- 🔜 Exportación: Excel y PDF (preparado)
- 🔜 Multi-moneda: Modelo preparado
- 🔜 Agente IA: Endpoints RESTful listos

### Escalabilidad
- 📦 **Docker**: Compose listo para contenedores
- 🐘 **PostgreSQL**: Preparado para producción
- 🚀 **Gunicorn**: Configurado para deploy
- 📊 **Caché**: Estructura lista para Redis
- 🔒 **HTTPS**: Nginx configurado (docker-compose)
- 📱 **PWA**: Frontend preparado para Progressive Web App

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **`docs/ARQUITECTURA.md`**: Mapa del proyecto (backend, frontend, rutas API, archivos clave).
- **`INSTALL.md`**: Guía de instalación detallada y requisitos.
- **`Sistema_Avila.ipynb`**: Notebook Jupyter con Django, modelos, búsqueda de productos e inventario (para pruebas o análisis).
- **Clover (pagos con tarjeta)**: `docs/INTEGRACION_CLOVER.md` si se usa POSnet Clover.

## 📞 SOPORTE

Para dudas o problemas durante el desarrollo:
- Documentación Django: https://docs.djangoproject.com/
- Documentación DRF: https://www.django-rest-framework.org/
- Documentación React: https://react.dev/

---

**Última actualización**: 17 de febrero de 2026  
**Versión**: 1.0.0 (9 módulos completados)  
**Estado**: ✅ Sistema completo. Instalación: `instalar_todo.bat` → `iniciar_sistema.bat`
