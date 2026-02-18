# MÓDULO 8: CONFIGURACIÓN - COMPLETADO

## ⚙️ Resumen

Se implementó exitosamente el módulo de **Configuración**, que permite:
- Gestionar parámetros del sistema sin modificar código
- Configurar umbrales y límites
- Personalizar comportamiento del sistema
- Actualizar valores en tiempo real
- Validación automática por tipo de dato

---

## 🎯 Funcionalidades Implementadas

### ✅ Modelo de Configuración
- Almacenamiento de parámetros clave-valor
- **4 tipos de datos**: INTEGER, DECIMAL, BOOLEAN, STRING
- Conversión automática según tipo
- Validación de valores
- Parámetros editables vs solo lectura
- Categorización por módulo

### ✅ ConfiguracionManager
Clase helper para facilitar acceso desde código:
- `obtener(clave, default)` - Obtiene valor convertido
- `establecer(clave, valor)` - Establece nuevo valor
- `obtener_por_categoria(categoria)` - Diccionario de configs

### ✅ API REST Completa
- CRUD de configuraciones
- Actualización de valor individual
- Actualización masiva (bulk update)
- Consulta por clave
- Consulta por categoría
- Listado de categorías disponibles

### ✅ Interfaz de Usuario
- Página de configuración intuitiva
- Navegación por categorías
- Inputs adaptados al tipo de dato:
  - **INTEGER**: Input numérico
  - **DECIMAL**: Input con decimales
  - **BOOLEAN**: Checkbox
  - **STRING**: Input de texto
- Botón de guardar solo si hay cambios
- Indicadores visuales (editable, solo lectura)
- Mensajes de éxito/error

---

## 📦 Parámetros Configurables

### Categoría: INVENTARIO (3 parámetros)
| Clave | Valor Default | Tipo | Descripción |
|-------|---------------|------|-------------|
| `UMBRAL_STOCK_BAJO` | 5 | INTEGER | Cantidad para stock bajo |
| `UMBRAL_STOCK_CRITICO` | 2 | INTEGER | Cantidad para stock crítico |
| `PERMITIR_STOCK_NEGATIVO` | true | BOOLEAN | Permitir ventas sin stock |

### Categoría: VENTAS (5 parámetros)
| Clave | Valor Default | Tipo | Descripción |
|-------|---------------|------|-------------|
| `UMBRAL_MARGEN_BAJO` | 5.0 | DECIMAL | Margen % para alerta |
| `DESCUENTO_MAX_CAJERO` | 10.0 | DECIMAL | Descuento máx cajero % |
| `DESCUENTO_MAX_ADMIN` | 50.0 | DECIMAL | Descuento máx admin % |
| `CLIENTE_OBLIGATORIO` | true | BOOLEAN | Requiere cliente en ventas |
| `ALERTAR_MARGEN_BAJO` | true | BOOLEAN | Mostrar alerta margen |

### Categoría: GENERAL (4 parámetros)
| Clave | Valor Default | Tipo | Descripción |
|-------|---------------|------|-------------|
| `NOMBRE_EMPRESA` | Casa de Repuestos | STRING | Nombre de la empresa |
| `TELEFONO_EMPRESA` | (vacío) | STRING | Teléfono contacto |
| `DIRECCION_EMPRESA` | (vacío) | STRING | Dirección |
| `CUIT_EMPRESA` | (vacío) | STRING | CUIT/CUIL |

### Categoría: REPORTES (2 parámetros)
| Clave | Valor Default | Tipo | Descripción |
|-------|---------------|------|-------------|
| `LIMITE_PRODUCTOS_TOP` | 20 | INTEGER | Cantidad en ranking |
| `DIAS_REPORTE_DEFECTO` | 30 | INTEGER | Días default reportes |

### Categoría: SISTEMA (2 parámetros)
| Clave | Valor Default | Tipo | Descripción |
|-------|---------------|------|-------------|
| `VERSION_SISTEMA` | 0.9.0 | STRING | Versión (solo lectura) |
| `MODO_MANTENIMIENTO` | false | BOOLEAN | Modo mantenimiento |

---

## 🔧 Implementación Backend

### Modelo (`apps/configuracion/models.py`)

```python
class Configuracion(models.Model):
    clave = models.CharField(max_length=100, unique=True)
    valor = models.CharField(max_length=255)
    tipo_dato = models.CharField(choices=TipoDato.choices)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50)
    es_editable = models.BooleanField(default=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    
    def get_valor_convertido(self):
        # Convierte según tipo_dato
        ...
```

### Manager Helper

```python
from apps.configuracion.models import ConfiguracionManager

# Obtener valor
umbral = ConfiguracionManager.obtener('UMBRAL_STOCK_BAJO', default=5)

# Establecer valor
ConfiguracionManager.establecer('UMBRAL_STOCK_BAJO', 10)

# Por categoría
configs_ventas = ConfiguracionManager.obtener_por_categoria('VENTAS')
```

### API Endpoints

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/configuracion/configuraciones/` | Listar todas | Admin |
| GET | `/api/configuracion/configuraciones/{id}/` | Detalle | Admin |
| PUT | `/api/configuracion/configuraciones/{id}/` | Actualizar completo | Admin |
| PATCH | `/api/configuracion/configuraciones/{id}/actualizar_valor/` | Actualizar solo valor | Admin |
| POST | `/api/configuracion/configuraciones/actualizar_multiple/` | Actualizar varias | Admin |
| GET | `/api/configuracion/configuraciones/por_categoria/` | Por categoría | Admin |
| GET | `/api/configuracion/configuraciones/categorias/` | Listar categorías | Admin |
| GET | `/api/configuracion/configuraciones/obtener_valor/` | Obtener por clave | Admin |

---

## 💻 Implementación Frontend

### Servicio (`configuracionService.js`)
- `getConfiguraciones()` - Listar todas
- `actualizarValorConfig(id, valor)` - Actualizar individual
- `getConfiguracionesPorCategoria(categoria)` - Por categoría
- `getValorConfig(clave, default)` - Helper con fallback

### Página (`Configuracion.jsx`)
**Características**:
- Sidebar con navegación por categorías
- Contador de parámetros por categoría
- Inputs adaptados al tipo de dato
- Botón "Guardar" solo si hay cambios
- Indicadores visuales (editable, solo lectura)
- Mensajes de éxito/error
- Tooltip con descripción

**Validaciones**:
- Números según tipo (entero o decimal)
- Checkbox para booleanos
- Texto libre para strings
- No permitir guardar en parámetros de solo lectura

### Integración
- Icono de configuración en header (admin only)
- Ruta protegida `/configuracion`
- Acceso solo para administradores

---

## 🧪 Pruebas Realizadas

### ✅ Test 1: Listar Configuraciones
- Endpoint: `GET /api/configuracion/configuraciones/`
- Resultado: 16 configuraciones creadas correctamente

### ✅ Test 2: Obtener por Categoría (INVENTARIO)
- Endpoint: `GET /api/configuracion/configuraciones/por_categoria/?categoria=INVENTARIO`
- Resultado:
  ```
  PERMITIR_STOCK_NEGATIVO = true
  UMBRAL_STOCK_BAJO = 5
  UMBRAL_STOCK_CRITICO = 2
  ```

### ✅ Test 3: Obtener Valor por Clave
- Endpoint: `GET /api/configuracion/configuraciones/obtener_valor/?clave=DESCUENTO_MAX_CAJERO`
- Resultado:
  - Valor: 10.0
  - Descripción: "Porcentaje máximo de descuento que puede aplicar un cajero"

### ✅ Test 4: Actualizar Valor
- Endpoint: `PATCH /api/configuracion/configuraciones/{id}/actualizar_valor/`
- Parámetro: `UMBRAL_MARGEN_BAJO`
- Valor anterior: 5.0
- Valor nuevo: 7.5
- Resultado: Actualizado correctamente con validación de tipo

---

## 📊 Resumen de Parámetros

### Por Categoría
- **INVENTARIO**: 3 parámetros
- **VENTAS**: 5 parámetros
- **GENERAL**: 4 parámetros
- **REPORTES**: 2 parámetros
- **SISTEMA**: 2 parámetros

### Por Tipo de Dato
- **INTEGER**: 5 parámetros
- **DECIMAL**: 4 parámetros
- **BOOLEAN**: 5 parámetros
- **STRING**: 6 parámetros

### Por Editabilidad
- **Editables**: 15 parámetros
- **Solo lectura**: 1 parámetro (VERSION_SISTEMA)

---

## 🔐 Seguridad y Permisos

- **Acceso a configuración**: Solo Administradores
- **Lectura**: Solo Administradores
- **Modificación**: Solo Administradores
- **Parámetros críticos**: Marcados como solo lectura
- **Validación**: Por tipo de dato antes de guardar

---

## 🚀 Casos de Uso

### Ajustar Umbrales de Stock
Un administrador puede:
1. Ir a Configuración → INVENTARIO
2. Cambiar `UMBRAL_STOCK_CRITICO` de 2 a 3
3. Los productos con 3 o menos unidades aparecerán como críticos

### Limitar Descuentos por Rol
Un administrador puede:
1. Configurar `DESCUENTO_MAX_CAJERO` en 15%
2. Los cajeros solo podrán aplicar hasta 15% de descuento
3. Los administradores mantienen su límite (`DESCUENTO_MAX_ADMIN`)

### Personalizar Empresa
Un administrador puede:
1. Completar datos de la empresa (nombre, CUIT, dirección)
2. Estos datos se usarán en reportes y tickets
3. No requiere reiniciar el sistema

### Configurar Reportes
Un administrador puede:
1. Cambiar `DIAS_REPORTE_DEFECTO` de 30 a 60 días
2. Los reportes mostrarán 60 días por defecto
3. Ajustar `LIMITE_PRODUCTOS_TOP` para rankings

---

## 📝 Notas Técnicas

### Conversión de Tipos
El sistema convierte automáticamente:
- `"5"` → `5` (INTEGER)
- `"10.5"` → `10.5` (DECIMAL)
- `"true"` → `True` (BOOLEAN)
- `"texto"` → `"texto"` (STRING)

### Validaciones
- No se puede guardar un texto en un INTEGER
- No se puede guardar decimales en BOOLEAN
- Valores booleanos aceptan: true/false, 1/0, yes/no, si/no
- Parámetros solo lectura no se pueden modificar desde la API

### Performance
- Índices en clave y categoría
- Caché recomendado para producción
- Consultas optimizadas con filtros

### Auditoría
- Campo `fecha_modificacion` actualizado automáticamente
- Registro de cambios en logs (futuro)
- Valores anteriores no se pierden (migrations)

---

## 🔮 Mejoras Futuras

### Historial de Cambios
- Tabla `ConfiguracionHistorial` con valores anteriores
- Usuario que hizo el cambio
- Fecha y hora del cambio
- Posibilidad de revertir cambios

### Validaciones Avanzadas
- Valores mínimos y máximos por parámetro
- Expresiones regulares para strings
- Dependencias entre parámetros
- Warnings al cambiar parámetros críticos

### Importación/Exportación
- Exportar configuración a JSON
- Importar configuración desde archivo
- Profiles de configuración (desarrollo, producción)
- Backup de configuraciones

### Interfaz Mejorada
- Agrupación por módulo
- Búsqueda de parámetros
- Vista de cambios recientes
- Valores default originales
- Reset a valores por defecto

---

## 🎯 Próximos Pasos

Con el Módulo 8 completado, el sistema ahora tiene:
- ✅ Parámetros configurables centralizados
- ✅ Sistema flexible y adaptable
- ✅ No requiere modificar código para ajustes
- ✅ Interfaz gráfica para administradores

**Sistema completado**: 8/9 módulos (89%)

**Módulo 9 (Devoluciones)**: Ya implementado parcialmente en el módulo de ventas con la funcionalidad de anulación.

---

**Fecha de completado**: 11 de febrero de 2026  
**Versión**: 0.9.0
