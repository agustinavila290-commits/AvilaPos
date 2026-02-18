# 🔐 CÓMO GENERAR CERTIFICADO AFIP/ARCA CORRECTO

**Proceso REAL para obtener certificado válido de ARCA/AFIP**

---

## ⚠️ ACLARACIÓN IMPORTANTE

**La clave privada NUNCA se descarga desde ARCA/AFIP.**

- ✅ La clave privada se **genera en tu computadora**
- ✅ Solo subís la **CSR** (Certificate Signing Request) a ARCA
- ✅ ARCA te devuelve el **certificado firmado** (.crt)
- ❌ ARCA nunca tiene acceso a tu clave privada

---

## 📋 PROCESO COMPLETO

### **PASO 1: Generar Clave Privada y CSR en tu PC**

Necesitás generar:
1. **Clave privada** (`.key`) - Se queda en tu PC
2. **CSR** (`.csr`) - Se sube a ARCA

#### **Opción A: Usar OpenSSL (Recomendado)**

**Instalar OpenSSL:**

1. Descargar desde: https://slproweb.com/products/Win32OpenSSL.html
2. O usar Git Bash (si tenés Git instalado)
3. O usar WSL (Windows Subsystem for Linux)

**Generar clave privada y CSR:**

```bash
# 1. Generar clave privada (2048 bits)
openssl genrsa -out clave_privada.key 2048

# 2. Generar CSR (Certificate Signing Request)
openssl req -new -key clave_privada.key -out solicitud.csr
```

**Al generar la CSR te pedirá:**
- Country Name: **AR** (Argentina)
- State or Province: Tu provincia
- Locality Name: Tu localidad
- Organization Name: Tu razón social
- Organizational Unit: (opcional)
- Common Name: **facturacion_wsfe** (o el nombre que prefieras)
- Email Address: (opcional)
- Challenge password: (dejar vacío)
- Optional company name: (dejar vacío)

#### **Opción B: Usar Herramienta GUI**

Si preferís una interfaz gráfica:

1. **KeyStore Explorer**: https://keystore-explorer.org/
2. **XCA**: https://www.hohnstaedt.de/xca/
3. **PuTTYgen** (solo para SSH, no recomendado para AFIP)

---

### **PASO 2: Subir CSR a ARCA/AFIP**

1. **Ingresar a ARCA**: https://www.afip.gob.ar → "Mis Aplicaciones Web" → "ARCA"

2. **Ir a Certificados**:
   - Buscar sección de certificados
   - Opción: "Solicitar Certificado" o "Subir CSR"

3. **Subir el archivo CSR**:
   - Seleccionar tu archivo `solicitud.csr`
   - Completar datos adicionales si se solicitan
   - Confirmar

4. **ARCA procesa y te devuelve**:
   - El certificado firmado (`.crt`)
   - Este es el que ya descargaste: `facturacion_wsfe_32499a40ead51685.crt`

---

### **PASO 3: Verificar que Tenés Ambos Archivos**

Necesitás tener:

- ✅ **clave_privada.key** (generada en tu PC)
- ✅ **certificado.crt** (descargado de ARCA)

**⚠️ IMPORTANTE**: Si perdiste la clave privada, NO podés recuperarla. Tenés que generar una nueva.

---

## 🚨 SI PERDISTE LA CLAVE PRIVADA

### **Solución: Generar Nuevo Certificado**

1. **Revocar certificado actual en ARCA**:
   - Ir a ARCA → Certificados
   - Buscar tu certificado actual
   - Opción: "Revocar" o "Anular"

2. **Generar nueva clave privada** (ver PASO 1)

3. **Generar nueva CSR** (ver PASO 1)

4. **Subir nueva CSR a ARCA**

5. **Descargar nuevo certificado**

---

## 🔧 CONFIGURAR EN EL SISTEMA

Una vez que tengas AMBOS archivos:

### **1. Copiar Archivos al Proyecto**

```bash
# Copiar clave privada
copy clave_privada.key backend\certs\clave_privada.key

# Copiar certificado (ya lo hicimos)
# backend\certs\certificado.crt
```

### **2. Configurar en Django Admin**

1. Ir a: http://localhost:8000/admin
2. **Facturación** → **Configuracion AFIPs**
3. Crear o editar:
   - **CUIT Emisor**: `20238543917`
   - **Razón Social**: Tu razón social
   - **Domicilio Comercial**: Tu dirección
   - **Condición IVA**: Responsable Inscripto / Monotributista
   - **Inicio de Actividades**: Fecha de inicio
   - **Ambiente**: **H** (Homologación)

4. **Certificado**: Abrir `backend/certs/certificado.crt` y copiar TODO
5. **Clave Privada**: Abrir `backend/certs/clave_privada.key` y copiar TODO

---

## 📝 SCRIPT PARA GENERAR CLAVE Y CSR

Creé un script para facilitar el proceso:

```bash
# Generar clave privada y CSR automáticamente
openssl genrsa -out clave_privada.key 2048
openssl req -new -key clave_privada.key -out solicitud.csr -subj "/C=AR/ST=Buenos Aires/L=Tu Ciudad/O=Tu Razon Social/CN=facturacion_wsfe"
```

---

## ✅ CHECKLIST

- [ ] Clave privada generada en tu PC
- [ ] CSR generada
- [ ] CSR subida a ARCA
- [ ] Certificado descargado de ARCA
- [ ] Ambos archivos guardados en lugar seguro
- [ ] Configurados en el sistema

---

## 🔍 VERIFICAR CERTIFICADO Y CLAVE

```bash
# Verificar certificado
openssl x509 -in certificado.crt -text -noout

# Verificar que la clave privada corresponde al certificado
openssl x509 -noout -modulus -in certificado.crt | openssl md5
openssl rsa -noout -modulus -in clave_privada.key | openssl md5
```

Si ambos MD5 coinciden, están emparejados correctamente.

---

## 📞 AYUDA

Si tenés problemas:

- **OpenSSL no instalado**: Ver opciones de instalación arriba
- **Error generando CSR**: Verificar que todos los datos sean correctos
- **ARCA rechaza CSR**: Verificar formato y datos

---

**¿Necesitás ayuda para generar la clave privada y CSR?** Decime si tenés OpenSSL instalado o qué herramienta preferís usar.
