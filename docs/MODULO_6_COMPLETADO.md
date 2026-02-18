# MÓDULO 6: COMPRAS - COMPLETADO

## 📦 Resumen

Se implementó exitosamente el módulo de **Compras**, que permite:
- Gestionar proveedores
- Registrar compras de mercadería
- Aumentar stock automáticamente
- Actualizar costos y precios de productos
- Documentar compras con facturas
- Consultar historial de compras

---

## 🎯 Funcionalidades Implementadas

### ✅ Gestión de Proveedores
- CRUD completo (solo admin puede crear/editar)
- Datos: nombre, razón social, CUIT, contacto
- Estado activo/inactivo
- Búsqueda y filtrado

### ✅ Registro de Compras
- Formulario intuitivo con búsqueda de productos
- Agregar múltiples productos a la compra
- Configuración individual por producto:
  - Cantidad
  - Costo unitario
  - Precio de venta sugerido (opcional)
  - Actualizar costo del producto (opcional)
  - Actualizar precio de venta (opcional)
- Número de factura opcional
- Fecha de compra opcional
- Observaciones opcionales
- Numeración automática de compras

### ✅ Actualizaciones Automáticas
- **Stock**: Aumenta automáticamente al registrar compra
- **Movimientos**: Se registra movimiento tipo "COMPRA" para auditoría
- **Costos**: Actualiza el costo del producto si se configura
- **Precios**: Actualiza el precio de venta si se configura
- Todo en transacción atómica (rollback en caso de error)

### ✅ Consultas y Reportes
- Listado de compras con filtros
- Detalle completo de cada compra
- Historial por proveedor
- Búsqueda por número, factura o proveedor
- Filtrado por estado

### ✅ Cancelación de Compras
- Solo administradores pueden cancelar
- Devuelve automáticamente el stock
- Registra movimientos de ajuste
- Mantiene registro para auditoría

---

## 🔧 Implementación Backend

### Modelos

#### `Proveedor` (`apps/compras/models.py`)
```python
class Proveedor(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    razon_social = models.CharField(max_length=200, blank=True)
    cuit = models.CharField(max_length=13, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
```

#### `Compra` (`apps/compras/models.py`)
```python
class Compra(models.Model):
    numero = models.IntegerField(unique=True)  # Auto-incremental
    proveedor = models.ForeignKey(Proveedor, ...)
    usuario = models.ForeignKey(Usuario, ...)
    deposito = models.ForeignKey(Deposito, ...)
    fecha = models.DateTimeField(auto_now_add=True)
    fecha_compra = models.DateField(blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    numero_factura = models.CharField(max_length=50, blank=True)
    observaciones = models.TextField(blank=True)
    estado = models.CharField(choices=EstadoCompra.choices)
```

#### `DetalleCompra` (`apps/compras/models.py`)
```python
class DetalleCompra(models.Model):
    compra = models.ForeignKey(Compra, related_name='detalles')
    variante = models.ForeignKey(VarianteProducto, ...)
    cantidad = models.IntegerField()
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta_sugerido = models.DecimalField(blank=True, null=True)
    actualizar_costo = models.BooleanField(default=True)
    actualizar_precio = models.BooleanField(default=False)
```

### Servicios

#### `CompraService` (`apps/compras/services.py`)

**`crear_compra()`**
- Valida que haya al menos un producto
- Calcula totales y subtotales
- Crea compra y detalles
- Aumenta stock (llama a `InventarioService`)
- Actualiza costos y precios si se configura
- Todo en transacción atómica

**`cancelar_compra()`**
- Solo para compras completadas
- Devuelve stock (movimientos negativos)
- Cambia estado a CANCELADA
- Registra movimientos de ajuste

### API Endpoints

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/compras/proveedores/` | Listar proveedores | Cajero+ |
| POST | `/api/compras/proveedores/` | Crear proveedor | Admin |
| GET | `/api/compras/proveedores/{id}/` | Detalle proveedor | Cajero+ |
| PUT | `/api/compras/proveedores/{id}/` | Actualizar proveedor | Admin |
| DELETE | `/api/compras/proveedores/{id}/` | Eliminar proveedor | Admin |
| POST | `/api/compras/proveedores/{id}/toggle_active/` | Activar/desactivar | Admin |
| GET | `/api/compras/compras/` | Listar compras | Admin |
| POST | `/api/compras/compras/` | Crear compra | Admin |
| GET | `/api/compras/compras/{id}/` | Detalle compra | Admin |
| POST | `/api/compras/compras/{id}/cancelar/` | Cancelar compra | Admin |
| GET | `/api/compras/compras/por_proveedor/` | Compras por proveedor | Admin |

---

## 💻 Implementación Frontend

### Servicios
- **`comprasService.js`**: API calls para proveedores y compras

### Páginas

#### `RegistrarCompra.jsx`
- Formulario de registro de compra
- Búsqueda de productos (SKU, barcode, nombre)
- Agregar múltiples productos
- Configuración individual de cada item:
  - Cantidad, costo, precio sugerido
  - Checkboxes para actualizar costo/precio
- Selección de proveedor
- Campos opcionales: factura, fecha, observaciones
- Cálculo automático de subtotales y total
- Validaciones en tiempo real

#### `Compras.jsx`
- Listado de todas las compras
- Filtros: estado, búsqueda
- Tabla con información resumida
- Enlace a detalle de cada compra

#### `CompraDetalle.jsx`
- Información completa de la compra
- Lista de productos comprados
- Indicadores de actualizaciones (costo/precio)
- Botón de cancelación (admin only)
- Estado visual (completada/cancelada)

### Rutas
```jsx
/compras                 → Listado de compras (admin only)
/compras/nueva          → Registrar compra (admin only)
/compras/:id            → Detalle de compra (admin only)
```

---

## 🧪 Pruebas Realizadas

### ✅ Test 1: Listar Proveedores
- Endpoint: `GET /api/compras/proveedores/`
- Resultado: 4 proveedores listados correctamente

### ✅ Test 2: Verificar Stock Antes de Compra
- Endpoint: `GET /api/inventario/stocks/2/`
- Producto: ZAN-0002
- Stock inicial: 7 unidades
- Costo inicial: $2800.00

### ✅ Test 3: Crear Compra Simple
- Endpoint: `POST /api/compras/compras/`
- Compra #1: 20 unidades de ZAN-0002
- Costo unitario: $2500.00
- Precio venta: $5200.00
- Total: $50,000.00
- Resultado: Compra creada exitosamente

### ✅ Test 4: Verificar Stock Aumentado
- Stock anterior: 7 unidades
- Cantidad comprada: 20 unidades
- Stock nuevo: 27 unidades ✅
- Incremento correcto: +20

### ✅ Test 5: Verificar Actualización de Costo y Precio
- Costo anterior: $2800.00
- Costo nuevo: $2500.00 ✅
- Precio anterior: null
- Precio nuevo: $5200.00 ✅

### ✅ Test 6: Verificar Movimiento de Stock
- Movimientos tipo COMPRA: 1
- Tipo: Compra
- SKU: ZAN-0002
- Cantidad: +20
- Observaciones: "Compra #1"

### ✅ Test 7: Crear Compra Múltiple
- Endpoint: `POST /api/compras/compras/`
- Compra #2: 2 productos
  - HON-0001: 10 unidades @ $900
  - YAM-0001: 15 unidades @ $2200
- Total: $42,000.00
- Resultado: Compra creada exitosamente

### ✅ Test 8: Listar Todas las Compras
- Total compras: 2
- Compra #1: $50,000.00
- Compra #2: $42,000.00
- Total invertido: $92,000.00

---

## 📊 Resumen de Resultados

### Compras Realizadas
- **Total**: 2 compras
- **Monto invertido**: $92,000.00
- **Estados**: 2 Completadas

### Proveedores
- **Total**: 4 proveedores
- Repuestos Honda Oficial
- Yamaha Parts
- Distribuidora Zanella
- Importadora Universal

### Movimientos de Stock
- **Movimientos tipo COMPRA**: 3
- Todos los stocks actualizados correctamente
- Auditoría completa registrada

### Funcionalidades Verificadas
- ✅ Listar proveedores
- ✅ Crear compra con un producto
- ✅ Crear compra con múltiples productos
- ✅ Aumento automático de stock
- ✅ Movimientos de stock registrados
- ✅ Actualización de costo del producto
- ✅ Actualización de precio de venta
- ✅ Listado de compras
- ✅ Número de factura opcional
- ✅ Observaciones opcionales

---

## 📝 Datos de Prueba

### Proveedores Creados
```bash
python crear_proveedores_prueba.py
```

1. **Repuestos Honda Oficial**
   - CUIT: 30-12345678-9
   - Tel: 011-4444-5555
   - Email: ventas@hondarepuestos.com

2. **Yamaha Parts**
   - CUIT: 30-98765432-1
   - Tel: 011-5555-6666
   - Email: pedidos@yamahaparts.com.ar

3. **Distribuidora Zanella**
   - CUIT: 30-11223344-5
   - Tel: 011-6666-7777

4. **Importadora Universal**
   - CUIT: 30-55667788-9
   - Tel: 011-7777-8888

---

## 🔐 Seguridad y Permisos

- **Listar proveedores**: Cajeros y Administradores
- **Crear/editar proveedores**: Solo Administradores
- **Registrar compras**: Solo Administradores
- **Cancelar compras**: Solo Administradores
- **Ver compras**: Solo Administradores

---

## 🚀 Próximos Pasos

Con el Módulo 6 completado, el sistema ahora tiene:
- ✅ Gestión completa de compras
- ✅ Control de proveedores
- ✅ Actualización automática de stock y costos
- ✅ Auditoría completa de movimientos

**Siguiente módulo**: MÓDULO 7: Reportes

---

## 📌 Notas Técnicas

### Transacciones Atómicas
Todas las operaciones de compra usan `@transaction.atomic` para garantizar:
- Rollback automático en caso de error
- Consistencia de datos
- Integridad referencial

### Validaciones
- Cliente obligatorio (heredado de configuración de ventas)
- Al menos un producto por compra
- Cantidades positivas
- Costos y precios no negativos

### Integración con Inventario
El módulo de compras se integra perfectamente con el sistema de inventario:
- Usa `InventarioService.registrar_movimiento()`
- Respeta la estructura de depósitos
- Mantiene la trazabilidad completa

---

**Fecha de completado**: 11 de febrero de 2026
**Versión**: 0.7.0
