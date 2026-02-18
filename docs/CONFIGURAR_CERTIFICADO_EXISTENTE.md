# 🔧 CONFIGURAR CERTIFICADO QUE YA TENÉS

Ya tenés el certificado descargado. Ahora necesitás:

---

## ✅ LO QUE YA TENÉS

- ✅ **Certificado**: `facturacion_wsfe_32499a40ead51685.crt`
- ✅ **Copiado a**: `backend/certs/certificado.crt`
- ✅ **Válido hasta**: 19/11/2027
- ✅ **CUIT**: 20238543917

---

## ⚠️ LO QUE FALTA

- ❌ **Clave Privada** (`.key`)

**⚠️ IMPORTANTE**: La clave privada NO se descarga desde ARCA/AFIP.

**Se genera en tu computadora** cuando creás el certificado.

### **Si perdiste la clave privada:**

**NO se puede recuperar.** Tenés que:

1. **Revocar el certificado actual** en ARCA
2. **Generar nueva clave privada** en tu PC
3. **Generar nueva CSR**
4. **Subir nueva CSR a ARCA**
5. **Descargar nuevo certificado**

Ver: `docs/COMO_GENERAR_CERTIFICADO_AFIP_CORRECTO.md`

---

## 📋 PASOS PARA CONFIGURAR

### **1. Obtener Clave Privada**

Una vez que la descargues:

1. Copiala a: `backend/certs/clave_privada.key`
2. O guardala con el nombre que prefieras

### **2. Configurar en el Sistema**

#### **Opción A: Desde Django Admin**

1. Ir a: http://localhost:8000/admin
2. **Facturación** → **Configuracion AFIPs**
3. Crear o editar configuración:
   - **CUIT Emisor**: `20238543917`
   - **Razón Social**: Tu razón social
   - **Domicilio Comercial**: Tu dirección
   - **Condición IVA**: Responsable Inscripto / Monotributista / etc.
   - **Inicio de Actividades**: Fecha de inicio
   - **Ambiente**: **H** (Homologación) para probar primero

4. **Certificado**: Abrir `backend/certs/certificado.crt` y copiar TODO el contenido
5. **Clave Privada**: Abrir `backend/certs/clave_privada.key` y copiar TODO el contenido

#### **Opción B: Desde la API**

```bash
POST /api/facturacion/configuracion-afip/
```

```json
{
  "cuit_emisor": "20238543917",
  "razon_social": "Tu Razón Social",
  "domicilio_comercial": "Tu Dirección",
  "condicion_iva": "RI",
  "inicio_actividades": "2020-01-01",
  "ambiente": "H",
  "certificado": "-----BEGIN CERTIFICATE-----\nMIIDSzCCAjOgAwIBAgIIMkmaQOrVFoUwDQYJKoZIhvcNAQENBQAwMzEVMBMGA1UEAwwMQ29tcHV0...\n-----END CERTIFICATE-----",
  "clave_privada": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

---

## 🔍 VERIFICAR CERTIFICADO

Tu certificado es válido y contiene:

- ✅ Formato correcto
- ✅ Para facturación WSFE
- ✅ CUIT: 20238543917
- ✅ Válido hasta: 19/11/2027

---

## 📞 SI NO ENCONTRÁS LA CLAVE PRIVADA

### **Opción 1: Buscar en AFIP**

1. En la misma página donde descargaste el certificado
2. Buscar opciones como "Exportar", "Descargar", "Clave Privada"
3. Puede estar en un menú desplegable junto al certificado

### **Opción 2: Regenerar Certificado**

Si no encontrás la clave privada:

1. Volver a generar un nuevo certificado en AFIP
2. Esta vez asegurarte de descargar AMBOS archivos:
   - Certificado (.crt)
   - Clave Privada (.key)

### **Opción 3: Contactar AFIP**

- **Teléfono**: 0800-999-2347
- **Email**: consultas@afip.gob.ar

---

## ✅ SIGUIENTE PASO

Una vez que tengas la clave privada:

1. **Copiarla** a `backend/certs/clave_privada.key`
2. **Configurar** en el sistema (ver arriba)
3. **Instalar pyafipws**: `pip install pyafipws`
4. **Probar conexión**: Ver `docs/PASOS_ACTIVAR_AFIP.md`

---

**¿Necesitás ayuda para encontrar la clave privada?** Decime qué ves en la página de AFIP donde descargaste el certificado y te guío.
