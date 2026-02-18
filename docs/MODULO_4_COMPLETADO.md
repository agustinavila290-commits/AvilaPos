# MÓDULO 4 COMPLETADO: Inventario y Movimientos de Stock

## Estado: ✅ COMPLETADO

**Fecha de finalización**: 11 de febrero de 2026  
**Versión**: 0.5.0

---

## 📋 Resumen

El Módulo 4 implementa el sistema completo de gestión de inventario y movimientos de stock, con soporte para múltiples depósitos, control de stock crítico, auditoría completa de movimientos y ajustes manuales (solo admin).

---

## 🎯 Funcionalidades Implementadas

### Backend (Django)

#### 1. **Modelos** (`apps/inventario/models.py`)

**Deposito**
- Nombre único y dirección
- Indicador de depósito principal
- Estado activo/inactivo
- Automáticamente marca como principal si es el único

**Stock**
- Relación única variante + depósito
- Cantidad (puede ser negativa si se permite)
- Propiedades calculadas: `es_critico`, `estado`
- Se actualiza SOLO a través de movimientos

**MovimientoStock**
- Auditoría completa de todos los movimientos
- Tipos: COMPRA, VENTA, DEVOLUCION, ANULACION, AJUSTE, TRANSFERENCIA, INVENTARIO_INICIAL
- Referencias a documentos origen (venta, compra, etc.)
- Stock anterior y posterior (para auditoría)
- Usuario que realizó el movimiento
- Observaciones obligatorias

#### 2. **Servicio de Negocio** (`apps/inventario/services.py`)

**InventarioService**
- `registrar_movimiento()`: Método central para todos los movimientos
- `ajuste_stock()`: Ajuste manual (solo admin)
- `inventario_inicial()`: Establecer inventario inicial
- `obtener_stock_actual()`: Consultar stock
- `obtener_stock_critico()`: Listar productos con stock crítico

#### 3. **Serializers** (`apps/inventario/serializers.py`)

- `DepositoSerializer`
- `StockSerializer` (completo)
- `StockListSerializer` (simplificado)
- `MovimientoStockSerializer`
- `AjusteStockSerializer` (validación de ajustes)

#### 4. **Views** (`apps/inventario/views.py`)

**DepositoViewSet**
- CRUD completo (crear/editar/eliminar solo admin)
- Acción `principal/`: Obtener depósito principal

**StockViewSet** (solo lectura)
- Listado con filtros por depósito y búsqueda
- Acción `critico/`: Stock crítico (≤2 unidades)
- Acción `por_variante/`: Stock en todos los depósitos
- Acción `ajustar/`: Ajuste manual (POST, solo admin)

**MovimientoStockViewSet** (solo lectura)
- Historial completo con filtros
- Acción `por_variante/`: Movimientos de una variante
- Acción `resumen_diario/`: Estadísticas del día

#### 5. **Admin** (`apps/inventario/admin.py`)

- Configuración completa para Deposito y Stock
- MovimientoStock: **Solo lectura** (no se pueden crear/editar/eliminar desde admin)

#### 6. **Scripts de Datos**

**crear_inventario_inicial.py**
- Crea depósito principal
- Asigna stock inicial a variantes de prueba
- Muestra resumen de stock crítico

---

### Frontend (React)

#### 1. **Servicio** (`frontend/src/services/inventarioService.js`)

Funciones para:
- Gestión de depósitos
- Consulta de stocks (general, por depósito, por variante, crítico)
- Ajuste de stock
- Historial de movimientos
- Resumen diario

#### 2. **Páginas**

**Inventario.jsx** - Página principal
- Listado de stocks por depósito
- Búsqueda por SKU, código de barras, nombre
- Filtro de stock crítico
- Indicadores visuales de estado (CRITICO, BAJO, NORMAL)
- Enlaces a historial y ajuste de stock

**StockCritico.jsx** - Vista de stock crítico
- Lista productos con ≤2 unidades
- Alertas visuales
- Filtro por depósito
- Mensaje de "todo OK" si no hay stock crítico

**AjustarStock.jsx** - Ajuste manual (solo admin)
- Formulario con validaciones
- Observaciones obligatorias (mín. 10 caracteres)
- Advertencia sobre uso correcto
- Muestra información del producto

**Movimientos.jsx** - Historial de movimientos
- Tabla completa de movimientos
- Filtro por tipo de movimiento
- Filtro opcional por variante
- Colores por tipo de movimiento
- Muestra stock anterior y posterior

#### 3. **Rutas** (`App.jsx`)

```
/inventario                           → Listado principal
/inventario/critico                   → Stock crítico
/inventario/ajustar/:varianteId/:depositoId → Ajustar stock (admin)
/inventario/movimientos               → Historial
```

#### 4. **Layout y Dashboard**

- Agregado link "Inventario" en navegación
- Dashboard actualizado con módulo 4 completado
- Enlaces a módulos desde las tarjetas

---

## 🔌 Endpoints API

### Depósitos

```
GET    /api/inventario/depositos/           → Listar
POST   /api/inventario/depositos/           → Crear (admin)
GET    /api/inventario/depositos/{id}/      → Detalle
PUT    /api/inventario/depositos/{id}/      → Actualizar (admin)
DELETE /api/inventario/depositos/{id}/      → Eliminar (admin)
GET    /api/inventario/depositos/principal/ → Depósito principal
```

### Stocks

```
GET    /api/inventario/stocks/              → Listar (filtros: deposito, search)
GET    /api/inventario/stocks/{id}/         → Detalle
GET    /api/inventario/stocks/critico/      → Stock crítico (≤2)
GET    /api/inventario/stocks/por_variante/ → Stock de variante (param: variante_id)
POST   /api/inventario/stocks/ajustar/      → Ajuste manual (admin)
```

### Movimientos

```
GET    /api/inventario/movimientos/         → Listar (filtros: tipo, deposito, variante, usuario)
GET    /api/inventario/movimientos/{id}/    → Detalle
GET    /api/inventario/movimientos/por_variante/  → Por variante (param: variante_id)
GET    /api/inventario/movimientos/resumen_diario/ → Resumen del día
```

---

## 📊 Datos de Prueba

**Script ejecutado**: `crear_inventario_inicial.py`

- 1 depósito: "Depósito Central"
- 6 variantes con stock inicial (cantidades variadas: 1, 3, 8, 12, 15, 25, 30, 50)
- Stock crítico de prueba para validar alertas

**Ejecutar**:
```bash
cd backend
python crear_inventario_inicial.py
```

---

## ✅ Criterios de Aceptación del MVP

### Inventario y Stock

- [x] Stock por depósito y variante ✅
- [x] Stock puede ser negativo (configurable) ✅
- [x] Alertas de stock crítico (≤2 unidades) ✅
- [x] Stock se actualiza SOLO por movimientos ✅
- [x] Listado de stock con búsqueda y filtros ✅

### Movimientos

- [x] Registro automático de todos los movimientos ✅
- [x] Tipos: COMPRA, VENTA, DEVOLUCION, ANULACION, AJUSTE, TRANSFERENCIA, INVENTARIO_INICIAL ✅
- [x] Auditoría completa (usuario, fecha, stock anterior/posterior) ✅
- [x] Historial completo con filtros ✅
- [x] Referencias a documentos origen ✅

### Ajustes

- [x] Ajuste manual de stock (solo admin) ✅
- [x] Observaciones obligatorias ✅
- [x] Validación de cantidad positiva ✅
- [x] Advertencia de uso correcto ✅

### Reportes

- [x] Lista de productos con stock crítico ✅
- [x] Historial de movimientos por variante ✅
- [x] Resumen diario de movimientos ✅

---

## 🔐 Permisos

| Acción | Cajero | Admin |
|--------|--------|-------|
| Ver stocks | ✅ | ✅ |
| Ver movimientos | ✅ | ✅ |
| Ver stock crítico | ✅ | ✅ |
| Ajustar stock | ❌ | ✅ |
| Gestionar depósitos | ❌ | ✅ |

---

## 🧪 Pruebas

### Flujo de Prueba

1. **Ver inventario**
   - Ir a `/inventario`
   - Verificar lista de stocks con colores de estado
   - Buscar por SKU o nombre

2. **Stock crítico**
   - Ir a "Ver Stock Crítico"
   - Verificar productos con ≤2 unidades
   - Verificar alerta si hay stock crítico

3. **Historial de movimientos**
   - Hacer clic en "Ver Historial" de un producto
   - Verificar movimientos de tipo INVENTARIO_INICIAL
   - Ver stock anterior y posterior

4. **Ajuste de stock (solo admin)**
   - Ir a "Ajustar" en un producto
   - Cambiar cantidad
   - Agregar observaciones (mín. 10 caracteres)
   - Guardar y verificar en historial

5. **Filtros**
   - Filtrar por depósito
   - Activar "Solo stock crítico"
   - Filtrar movimientos por tipo

---

## 🔄 Integración con otros módulos

Este módulo está **preparado** para integrarse con:

- **Módulo 5 - Ventas**: Creará movimientos de tipo VENTA
- **Módulo 6 - Compras**: Creará movimientos de tipo COMPRA
- **Módulo de Devoluciones**: Creará movimientos de tipo DEVOLUCION
- **Módulo de Anulaciones**: Creará movimientos de tipo ANULACION

**Ejemplo de integración**:
```python
from apps.inventario.services import InventarioService

# Al realizar una venta
InventarioService.registrar_movimiento(
    variante=variante,
    deposito=deposito_principal,
    tipo_movimiento=MovimientoStock.TipoMovimiento.VENTA,
    cantidad=-cantidad_vendida,  # Negativo para salida
    usuario=request.user,
    referencia_tipo='venta',
    referencia_id=venta.id,
    observaciones=f'Venta #{venta.id}'
)
```

---

## 📝 Archivos Creados/Modificados

### Backend
- `apps/inventario/models.py` ✅
- `apps/inventario/services.py` ✅ (nuevo)
- `apps/inventario/serializers.py` ✅
- `apps/inventario/views.py` ✅
- `apps/inventario/admin.py` ✅
- `apps/inventario/urls.py` ✅
- `backend/crear_inventario_inicial.py` ✅ (nuevo)

### Frontend
- `frontend/src/services/inventarioService.js` ✅ (nuevo)
- `frontend/src/pages/Inventario.jsx` ✅ (nuevo)
- `frontend/src/pages/StockCritico.jsx` ✅ (nuevo)
- `frontend/src/pages/AjustarStock.jsx` ✅ (nuevo)
- `frontend/src/pages/Movimientos.jsx` ✅ (nuevo)
- `frontend/src/App.jsx` ✅ (rutas)
- `frontend/src/components/Layout.jsx` ✅ (navegación)
- `frontend/src/pages/Dashboard.jsx` ✅ (estado módulo)

---

## 🚀 Siguiente Paso

**MÓDULO 5: Ventas**
- Punto de venta
- Cliente obligatorio
- Descuentos con alertas de margen
- Múltiples formas de pago
- Generación de tickets PDF
- Actualización automática de stock

---

## 📌 Notas Técnicas

1. **Stock negativo**: Actualmente permitido, puede configurarse en el futuro
2. **Depósito principal**: Se selecciona automáticamente por defecto
3. **Movimientos**: Son INMUTABLES (no se pueden editar/eliminar)
4. **Ajustes**: Requieren observaciones detalladas para auditoría
5. **Stock crítico**: Umbral fijo en 2 unidades (futuro: configurable)

---

**¡Módulo 4 completado exitosamente!** 🎉
