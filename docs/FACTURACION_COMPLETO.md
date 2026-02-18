# 📄 SISTEMA DE FACTURACIÓN ELECTRÓNICA

**Estado**: ✅ IMPLEMENTADO - Listo para usar en modo simulado

---

## 📋 Índice

1. [Características Implementadas](#características-implementadas)
2. [Modelos Creados](#modelos-creados)
3. [API Endpoints](#api-endpoints)
4. [Cómo Usar](#cómo-usar)
5. [Configuración AFIP](#configuración-afip)
6. [Generar PDFs](#generar-pdfs)
7. [Modo Simulado vs Producción](#modo-simulado-vs-producción)
8. [Próximos Pasos](#próximos-pasos)

---

## ✅ Características Implementadas

### Tipos de Comprobantes
- ✅ **Factura A** - Para Responsables Inscriptos
- ✅ **Factura B** - Para Consumidores Finales y Monotributistas
- ✅ **Factura C** - Para IVA Exento
- ✅ **Nota de Crédito A, B, C** - Para devoluciones
- ✅ **Presupuesto** - Sin validación AFIP

### Funcionalidades
- ✅ Numeración automática por punto de venta y tipo
- ✅ Cálculo automático de IVA (10.5%, 21%, 27%)
- ✅ Múltiples alícuotas de IVA por ítem
- ✅ Generación de PDF con formato AFIP
- ✅ Integración con AFIP (modo simulado)
- ✅ CAE y código QR (simulado)
- ✅ Gestión de puntos de venta
- ✅ Configuración AFIP centralizada
- ✅ Asociación con ventas del sistema

---

## 🗄️ Modelos Creados

### 1. PuntoVenta
Representa un punto de venta registrado en AFIP.

```python
PuntoVenta(
    numero=1,  # Número del punto de venta (1, 2, 3...)
    nombre="Casa Central",
    activo=True
)
```

Lleva el control de la numeración de cada tipo de comprobante.

### 2. Factura
Factura electrónica principal.

**Campos principales:**
- `tipo_comprobante`: FA, FB, FC, NCA, NCB, NCC, PRE
- `punto_venta`: Relación con PuntoVenta
- `numero`: Número del comprobante (autoincremental)
- `fecha_emision`: Fecha de emisión
- `cliente`: Relación con Cliente
- `cliente_razon_social`, `cliente_cuit`, `cliente_condicion_iva`
- `subtotal`, `iva_105`, `iva_21`, `iva_27`, `otros_tributos`, `total`
- `cae`: Código de Autorización Electrónico
- `cae_vencimiento`: Vencimiento del CAE
- `estado`: BORRADOR, AUTORIZADA, RECHAZADA, ANULADA
- `qr_data`: Datos para generar código QR

### 3. ItemFactura
Línea/ítem de una factura.

**Campos:**
- `factura`: Relación con Factura
- `codigo`: Código del producto/servicio
- `descripcion`: Descripción del ítem
- `cantidad`: Cantidad
- `precio_unitario`: Precio unitario
- `alicuota_iva`: 0%, 10.5%, 21%, 27%
- `subtotal`, `iva_105`, `iva_21`, `iva_27`, `total`

### 4. ConfiguracionAFIP
Configuración para integración con AFIP (singleton).

**Campos:**
- `cuit_emisor`: CUIT del contribuyente
- `razon_social`: Razón social
- `domicilio_comercial`: Domicilio
- `condicion_iva`: RI, MT, EX, CF
- `inicio_actividades`: Fecha de inicio
- `ambiente`: H (Homologación) o P (Producción)
- `certificado`: Certificado digital
- `clave_privada`: Clave privada
- `token`, `sign`, `token_expiracion`: Autenticación AFIP

---

## 🌐 API Endpoints

### Puntos de Venta

```
GET    /api/facturacion/puntos-venta/          # Listar
POST   /api/facturacion/puntos-venta/          # Crear
GET    /api/facturacion/puntos-venta/{id}/     # Detalle
PUT    /api/facturacion/puntos-venta/{id}/     # Actualizar
DELETE /api/facturacion/puntos-venta/{id}/     # Eliminar
```

### Facturas

```
GET    /api/facturacion/facturas/                    # Listar
POST   /api/facturacion/facturas/                    # Crear
GET    /api/facturacion/facturas/{id}/               # Detalle
PUT    /api/facturacion/facturas/{id}/               # Actualizar
DELETE /api/facturacion/facturas/{id}/               # Eliminar

POST   /api/facturacion/facturas/{id}/autorizar_afip/  # Solicitar CAE a AFIP
GET    /api/facturacion/facturas/{id}/generar_pdf/     # Descargar PDF
POST   /api/facturacion/facturas/{id}/anular/          # Anular factura
GET    /api/facturacion/facturas/estadisticas/         # Estadísticas
```

### Configuración AFIP

```
GET    /api/facturacion/configuracion-afip/                  # Listar
POST   /api/facturacion/configuracion-afip/                  # Crear
GET    /api/facturacion/configuracion-afip/{id}/            # Detalle
PUT    /api/facturacion/configuracion-afip/{id}/            # Actualizar

POST   /api/facturacion/configuracion-afip/{id}/renovar_token/     # Renovar token
POST   /api/facturacion/configuracion-afip/{id}/probar_conexion/   # Probar conexión
```

---

## 🚀 Cómo Usar

### 1. Crear Configuración AFIP

**Endpoint**: `POST /api/facturacion/configuracion-afip/`

```json
{
  "cuit_emisor": "20123456789",
  "razon_social": "Casa de Repuestos SRL",
  "domicilio_comercial": "Av. Principal 123, Ciudad, Provincia",
  "condicion_iva": "RI",
  "inicio_actividades": "2020-01-15",
  "ambiente": "H"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "cuit_emisor": "20123456789",
  "razon_social": "Casa de Repuestos SRL",
  ...
}
```

### 2. Crear Punto de Venta

**Endpoint**: `POST /api/facturacion/puntos-venta/`

```json
{
  "numero": 1,
  "nombre": "Casa Central",
  "activo": true
}
```

### 3. Crear Factura

**Endpoint**: `POST /api/facturacion/facturas/`

```json
{
  "tipo_comprobante": "FB",
  "punto_venta": 1,
  "cliente": 1,
  "cliente_razon_social": "Juan Pérez",
  "cliente_cuit": "20301234567",
  "cliente_condicion_iva": "CF",
  "cliente_domicilio": "Calle Falsa 123",
  "observaciones": "Factura de prueba",
  "otros_tributos": 0,
  "items": [
    {
      "codigo": "PROD001",
      "descripcion": "Producto de prueba",
      "cantidad": 2,
      "precio_unitario": 1000.00,
      "alicuota_iva": "21"
    },
    {
      "codigo": "PROD002",
      "descripcion": "Otro producto",
      "cantidad": 1,
      "precio_unitario": 500.00,
      "alicuota_iva": "21"
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": 1,
  "tipo_comprobante": "FB",
  "numero_completo": "0001-00000001",
  "fecha_emision": "2026-02-11",
  "estado": "BORRADOR",
  "subtotal": "2500.00",
  "iva_21": "525.00",
  "total": "3025.00",
  "items": [
    {
      "id": 1,
      "descripcion": "Producto de prueba",
      "cantidad": "2.00",
      "precio_unitario": "1000.00",
      "total": "2420.00"
    },
    ...
  ]
}
```

### 4. Autorizar en AFIP

**Endpoint**: `POST /api/facturacion/facturas/1/autorizar_afip/`

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Factura autorizada correctamente",
  "factura": {
    "id": 1,
    "estado": "AUTORIZADA",
    "cae": "20260211145501",
    "cae_vencimiento": "2026-02-21",
    ...
  }
}
```

### 5. Descargar PDF

**Endpoint**: `GET /api/facturacion/facturas/1/generar_pdf/`

Descarga automáticamente el PDF de la factura.

---

## 📝 Generar PDFs

Los PDFs se generan automáticamente con:
- Logo y datos del emisor
- Letra del comprobante (A, B, C)
- Datos del cliente
- Detalle de ítems con IVA
- Totales discriminados (Factura A)
- CAE y código QR
- Formato según normativa AFIP

**Uso desde código:**
```python
from apps.facturacion.pdf_generator import generar_pdf_factura

buffer = generar_pdf_factura(factura)
# buffer es un BytesIO con el PDF
```

---

## ⚙️ Configuración AFIP

### Modo Simulado (Desarrollo) ⭐ ACTUAL

**Estado**: Activo por defecto  
**Ventajas:**
- No requiere certificados AFIP
- Genera CAE simulados
- Permite desarrollo sin conexión a AFIP
- Ideal para pruebas

**Cómo funciona:**
- CAE se genera con timestamp
- Vencimiento CAE: +10 días
- Estado automático: AUTORIZADA
- QR simulado

### Modo Producción (AFIP Real)

Para usar AFIP real necesitás:

#### 1. Certificado Digital

Generar certificado en AFIP:
1. Ir a https://www.afip.gob.ar/ws/
2. Sistema Registral → Administrador de Relaciones
3. Generar certificado para Web Services
4. Descargar `.crt` y `.key`

#### 2. Installar pyafipws

```bash
pip install pyafipws
```

#### 3. Configurar en Django Admin

1. Ir a `/admin/facturacion/configuracionafip/`
2. Completar:
   - CUIT emisor
   - Razón social
   - Domicilio
   - **Certificado**: Pegar contenido del `.crt`
   - **Clave privada**: Pegar contenido del `.key`
   - Ambiente: H (testing) o P (producción)

#### 4. Modificar afip_service.py

Cambiar:
```python
self.modo_simulado = False  # Era True
```

Y descomentar código de pyafipws.

---

## 🔄 Modo Simulado vs Producción

| Característica | Simulado | Producción |
|----------------|----------|------------|
| Certificado AFIP | ❌ No requiere | ✅ Requerido |
| pyafipws | ❌ No requiere | ✅ Requerido |
| CAE | Generado localmente | Otorgado por AFIP |
| Validez legal | ❌ No válido | ✅ Válido |
| Uso | Desarrollo/Testing | Producción |
| Conexión internet | ❌ No requiere | ✅ Requerido |

**IMPORTANTE**: Las facturas en modo simulado NO tienen validez legal.

---

## 🎯 Próximos Pasos

### Para Usar en Producción

1. **Obtener certificado AFIP**
   - Tramitar en AFIP Web Services
   - Descargar certificado y clave

2. **Instalar pyafipws**
   ```bash
   pip install pyafipws
   ```

3. **Configurar en Admin**
   - Cargar certificado y clave
   - Configurar CUIT y datos fiscales

4. **Cambiar a modo producción**
   - Editar `afip_service.py`
   - `modo_simulado = False`

5. **Probar en Homologación (H)**
   - Ambiente: Homologación
   - Probar todas las operaciones
   - Verificar CAE en AFIP

6. **Pasar a Producción (P)**
   - Cambiar ambiente a Producción
   - Verificar última vez
   - ¡Listo para facturar!

### Funcionalidades Adicionales (Futuras)

- [ ] Frontend para emitir facturas
- [ ] Impresión de facturas
- [ ] Envío por email
- [ ] Reportes de facturación
- [ ] Libro IVA digital
- [ ] Integración con contabilidad
- [ ] Facturación masiva
- [ ] Notas de débito
- [ ] Remitos electrónicos

---

## 📊 Archivos Creados

```
backend/apps/facturacion/
├── __init__.py
├── apps.py
├── models.py                # Modelos: Factura, ItemFactura, PuntoVenta, ConfiguracionAFIP
├── serializers.py           # Serializers DRF
├── views.py                 # ViewSets y endpoints
├── urls.py                  # Rutas API
├── admin.py                 # Admin Django
├── afip_service.py          # Integración AFIP (simulado/real)
├── pdf_generator.py         # Generador de PDFs
└── migrations/
    └── 0001_initial.py
```

---

## 🧪 Testing

### Probar en Postman/Thunder Client

**1. Crear Configuración AFIP:**
```
POST http://localhost:8000/api/facturacion/configuracion-afip/
```

**2. Crear Punto de Venta:**
```
POST http://localhost:8000/api/facturacion/puntos-venta/
```

**3. Crear Factura:**
```
POST http://localhost:8000/api/facturacion/facturas/
```

**4. Autorizar:**
```
POST http://localhost:8000/api/facturacion/facturas/1/autorizar_afip/
```

**5. Descargar PDF:**
```
GET http://localhost:8000/api/facturacion/facturas/1/generar_pdf/
```

---

## ⚠️ Advertencias

### Modo Simulado
- ⚠️ **No genera facturas con validez legal**
- ⚠️ CAE simulado, no verificable en AFIP
- ⚠️ Solo para desarrollo y testing
- ⚠️ No usar para facturación real

### Modo Producción
- ⚠️ Requiere certificado AFIP válido
- ⚠️ Errores en producción pueden generar problemas fiscales
- ⚠️ Probar SIEMPRE en homologación primero
- ⚠️ Mantener certificados seguros

---

## 📚 Documentación AFIP

- **Web Services AFIP**: https://www.afip.gob.ar/ws/
- **Manual WSFEV1**: https://www.afip.gob.ar/fe/documentos/manual_desarrollador_COMPG_v2_10.pdf
- **pyafipws Docs**: https://github.com/reingart/pyafipws

---

## ✅ Checklist de Implementación

- [x] Modelos de facturación
- [x] Serializers y validaciones
- [x] API REST completa
- [x] Admin Django
- [x] Numeración automática
- [x] Cálculo de IVA
- [x] Generación de PDFs
- [x] Servicio AFIP (simulado)
- [x] CAE y QR (simulado)
- [ ] Frontend para emitir facturas
- [ ] Integración AFIP real
- [ ] Impresión de facturas
- [ ] Envío por email

---

**Fecha de implementación**: 11/02/2026  
**Estado**: ✅ Funcional en modo simulado  
**Próximo paso**: Crear frontend y configurar AFIP real

---

## 🆘 Soporte

Si tenés dudas:
1. Revisar esta documentación
2. Probar en modo simulado primero
3. Consultar documentación AFIP
4. Verificar logs del servidor
