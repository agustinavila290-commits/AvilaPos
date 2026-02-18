# 🚀 PASOS PARA ACTIVAR FACTURACIÓN AFIP/ARCA REAL

## 📋 ACLARACIÓN: ARCA = AFIP

**ARCA** es el nombre del sistema de **Facturación Electrónica de AFIP**. Cuando entrás a "Mis Aplicaciones Web" en AFIP y ves ARCA, es la aplicación de facturación electrónica. **Es el mismo sistema**: integrar con AFIP (WSFE) es integrar con ARCA.

---

## 📋 RESUMEN RÁPIDO

Para hacer válida la facturación AFIP/ARCA necesitás:

1. ✅ **Certificado digital** de AFIP
2. ✅ **Instalar pyafipws**
3. ✅ **Configurar certificados** en el sistema
4. ✅ **Cambiar modo simulado a False**
5. ✅ **Probar en Homologación** primero

---

## 🔧 PASO A PASO

### **1. Generar Clave Privada y Obtener Certificado**

**📖 Guía detallada**: Ver `docs/COMO_GENERAR_CERTIFICADO_AFIP_CORRECTO.md`

**⚠️ IMPORTANTE**: La clave privada NO se descarga desde ARCA. Se genera en tu PC.

**Proceso correcto:**

1. **Generar clave privada y CSR en tu PC**:
   ```bash
   openssl genrsa -out clave_privada.key 2048
   openssl req -new -key clave_privada.key -out solicitud.csr
   ```

2. **Subir CSR a ARCA**:
   - Ingresar a: https://www.afip.gob.ar → "Mis Aplicaciones Web" → "ARCA"
   - Ir a Certificados → "Subir CSR" o "Solicitar Certificado"
   - Subir tu archivo `solicitud.csr`

3. **Descargar certificado firmado**:
   - ARCA procesa y te devuelve el certificado (`.crt`)
   - Descargarlo y guardarlo junto con tu clave privada

**⚠️ IMPORTANTE**: 
- Guardá AMBOS archivos en lugar seguro: `clave_privada.key` y `certificado.crt`
- Si perdiste la clave privada, NO se puede recuperar. Tenés que generar una nueva.
- Ver guía completa: `docs/COMO_GENERAR_CERTIFICADO_AFIP_CORRECTO.md`

---

### **2. Instalar pyafipws**

```bash
cd backend
.\venv\Scripts\activate
pip install pyafipws
```

Verificar instalación:
```bash
python -c "import pyafipws; print('OK')"
```

---

### **3. Configurar en el Sistema**

#### **Opción A: Desde el Admin Django**

1. Iniciá sesión en Django Admin: http://localhost:8000/admin
2. Ve a: **Facturación** → **Configuracion AFIPs**
3. Creá o editá la configuración:
   - **CUIT Emisor**: Tu CUIT (11 dígitos)
   - **Razón Social**: Tu razón social
   - **Domicilio Comercial**: Tu dirección
   - **Condición IVA**: Responsable Inscripto / Monotributista / etc.
   - **Inicio de Actividades**: Fecha de inicio
   - **Ambiente**: **Homologación** (para probar primero)
   - **Certificado**: Abrí tu archivo `.crt` y copiá TODO el contenido
   - **Clave Privada**: Abrí tu archivo `.key` y copiá TODO el contenido

#### **Opción B: Desde la API**

```bash
POST /api/facturacion/configuracion-afip/
```

```json
{
  "cuit_emisor": "20123456789",
  "razon_social": "Tu Razón Social",
  "domicilio_comercial": "Tu Dirección",
  "condicion_iva": "RI",
  "inicio_actividades": "2020-01-01",
  "ambiente": "H",
  "certificado": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "clave_privada": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

---

### **4. Activar Modo Real**

Editar archivo: `backend/apps/facturacion/afip_service.py`

**Línea 18**, cambiar:
```python
self.modo_simulado = True  # ❌ ANTES
```

Por:
```python
self.modo_simulado = False  # ✅ DESPUÉS
```

**O mejor aún**: Configurarlo según la configuración:

```python
def __init__(self, config=None):
    self.config = config
    # Activar modo real si hay configuración y certificados
    self.modo_simulado = not (config and config.certificado and config.clave_privada)
```

---

### **5. Probar Conexión**

**Endpoint**: `POST /api/facturacion/configuracion-afip/{id}/probar_conexion/`

Debería responder:
```json
{
  "success": true,
  "mensaje": "Conexión exitosa con AFIP Homologación",
  "ambiente": "Homologación (Testing)",
  "cuit": "20123456789",
  "token_valido_hasta": "2026-02-12 20:00:00"
}
```

---

### **6. Renovar Token**

**Endpoint**: `POST /api/facturacion/configuracion-afip/{id}/renovar_token/`

Esto obtiene el token y sign de AFIP (válido por 12 horas).

---

### **7. Crear Factura de Prueba**

1. Crear una factura (Factura B para consumidor final)
2. Autorizar con AFIP: `POST /api/facturacion/facturas/{id}/autorizar_afip/`
3. Verificar que obtenga CAE válido de AFIP

---

### **8. Activar Producción**

**⚠️ SOLO DESPUÉS DE PROBAR EN HOMOLOGACIÓN**

1. En la configuración AFIP, cambiar:
   - **Ambiente**: **P** (Producción)

2. Verificar certificado de producción

3. Probar conexión de producción

4. Crear primera factura real

---

## 🔍 VERIFICAR QUE FUNCIONA

### ✅ Checklist:

- [ ] pyafipws instalado correctamente
- [ ] Certificados configurados en el sistema
- [ ] Modo simulado = False
- [ ] Prueba de conexión exitosa
- [ ] Token obtenido correctamente
- [ ] Factura autorizada con CAE válido de AFIP
- [ ] PDF generado con QR válido

---

## 📞 AYUDA

### **Error: "pyafipws no instalado"**
```bash
pip install pyafipws
```

### **Error: "Certificado no válido"**
- Verificar que el certificado no esté vencido
- Verificar formato correcto (debe empezar con `-----BEGIN CERTIFICATE-----`)
- Verificar que la clave privada corresponda al certificado

### **Error: "Token expirado"**
- Usar endpoint `/renovar_token/` para renovar

### **Error: "Punto de venta no habilitado"**
- Verificar en AFIP que el punto de venta esté registrado
- Verificar que esté habilitado para facturación electrónica

---

## 📚 DOCUMENTACIÓN

- **Guía Completa**: Ver `docs/GUIA_AFIP_REAL.md`
- **AFIP**: https://www.afip.gob.ar
- **pyafipws**: https://github.com/reingart/pyafipws

---

## ⚠️ IMPORTANTE

- 🔒 **NUNCA** compartas tu certificado o clave privada
- 🔒 Mantené backups seguros de tus certificados
- 🧪 **SIEMPRE** probá en Homologación antes de Producción
- ⏰ Los CAE tienen vencimiento (10 días), respétalo

---

**¿Listo para activar?** Seguí los pasos arriba y tu facturación será válida con AFIP! 🎉
