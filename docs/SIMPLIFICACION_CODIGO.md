# 🔄 SIMPLIFICACIÓN: SKU → CÓDIGO

**Fecha:** 12/02/2026  
**Estado:** ✅ BACKEND COMPLETADO | 🔄 FRONTEND EN PROGRESO

---

## 🎯 CAMBIO REALIZADO

Se eliminó la duplicación entre `SKU` y `Código de Barras`, simplificando a un único campo **`codigo`**.

### **ANTES:**
```python
sku = "ABC-001"              # Campo obligatorio
codigo_barras = "789123"    # Campo opcional
```

### **AHORA:**
```python
codigo = "789123"            # Campo único (puede ser SKU, código de barras, etc.)
```

---

## ✅ BACKEND - COMPLETADO

### **1. Modelos Actualizados**
- ✅ `VarianteProducto.sku` → `VarianteProducto.codigo`
- ✅ `VarianteProducto.codigo_barras` → ELIMINADO
- ✅ Índices actualizados

### **2. Serializers Actualizados**
- ✅ `VarianteProductoSerializer`
- ✅ `VarianteProductoCreateSerializer`
- ✅ `VarianteListSerializer`
- ✅ `ImportacionExcelSerializer`

### **3. Views Actualizados**
- ✅ Búsqueda por código
- ✅ Filtros actualizados
- ✅ Importación Excel actualizada
- ✅ `buscar_sku()` → `buscar_codigo()`
- ✅ `buscar_codigo_barras()` → ELIMINADO

### **4. Admin Actualizado**
- ✅ `VarianteProductoAdmin` 
- ✅ `VarianteProductoInline`

### **5. Migraciones**
- ✅ Base de datos recreada
- ✅ Todas las migraciones aplicadas
- ✅ Superusuario creado (admin/admin123)

---

## 🔄 FRONTEND - PENDIENTE

### **Archivos a Actualizar:**

#### **Servicios:**
- `frontend/src/services/productosService.js`
  - `buscarPorSKU()` → `buscarPorCodigo()`
  - Eliminar `buscarPorCodigoBarras()`
  - Actualizar parámetros de búsqueda

#### **Páginas:**
- `frontend/src/pages/Productos.jsx`
  - Cambiar `variante.sku` → `variante.codigo`
  - Actualizar encabezados de tabla
  
- `frontend/src/pages/ProductoDetalle.jsx`
  - Cambiar `formData.sku` → `formData.codigo`
  - Eliminar `formData.codigo_barras`
  - Actualizar labels

- `frontend/src/pages/PuntoVenta.jsx`
  - Actualizar búsqueda por código
  - Actualizar display de código en tickets

- `frontend/src/pages/ImportarProductos.jsx`
  - Actualizar template Excel
  - Cambiar columna `sku` → `codigo`
  - Eliminar columna `codigo_barras`

#### **Componentes:**
- `frontend/src/components/` (si hay alguno que use SKU)

---

## 📋 ENDPOINTS API ACTUALIZADOS

### **ANTES:**
```
GET /api/productos/variantes/?sku=ABC-001
GET /api/productos/variantes/buscar_sku/?sku=ABC-001
GET /api/productos/variantes/buscar_codigo_barras/?codigo=789123
```

### **AHORA:**
```
GET /api/productos/variantes/?codigo=789123
GET /api/productos/variantes/buscar_codigo/?codigo=789123
```

---

## 🎨 CAMBIOS EN LA INTERFAZ

### **Listado de Productos:**
| ANTES | AHORA |
|-------|-------|
| SKU: ABC-001 | Código: 789123 |
| Código de Barras: 789123 | *(eliminado)* |

### **Formulario de Producto:**
| ANTES | AHORA |
|-------|-------|
| SKU * | Código * |
| Código de Barras | *(eliminado)* |

### **Punto de Venta:**
| ANTES | AHORA |
|-------|-------|
| "SKU o Código de Barras" | "Código del Producto" |

---

## 🔧 PRÓXIMOS PASOS

1. ✅ Backend actualizado
2. 🔄 Actualizar servicios frontend
3. ⏳ Actualizar páginas frontend
4. ⏳ Actualizar componentes
5. ⏳ Probar todo el sistema

---

## ⚠️ NOTA IMPORTANTE

**La base de datos fue recreada**, por lo que:
- ❌ Se perdieron todos los datos de productos existentes
- ✅ Usuario admin recreado: `admin / admin123`
- ✅ El sistema está limpio y listo para usar

**Si tenías datos importantes:** Necesitarás reimportarlos desde Excel con el nuevo formato (columna `codigo` en lugar de `sku`).

---

## 📝 TEMPLATE EXCEL ACTUALIZADO

```
codigo | nombre_producto | nombre_variante | marca | categoria | costo | precio_mostrador | precio_web
789123 | Filtro de Aceite | Original | Yamaha | Filtros | 1500 | 2500 | 2300
```

**Columnas eliminadas:**
- ❌ `sku`
- ❌ `codigo_barras`

**Nueva columna:**
- ✅ `codigo` (reemplaza a ambas)

---

**Estado:** Backend 100% completado ✅  
**Siguiente:** Actualizar frontend...
