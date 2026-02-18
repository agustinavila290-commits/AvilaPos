# 📜 CÓMO OBTENER CERTIFICADOS DIGITALES DE AFIP/ARCA

**Guía paso a paso para obtener tu certificado digital**

---

## ⚠️ IMPORTANTE: CÓMO FUNCIONA REALMENTE

**La clave privada NO se descarga desde ARCA/AFIP.**

- ✅ La clave privada se **genera en tu computadora**
- ✅ Solo subís la **CSR** (Certificate Signing Request) a ARCA
- ✅ ARCA te devuelve el **certificado firmado** (.crt)
- ❌ ARCA nunca tiene acceso a tu clave privada

**Ver guía completa**: `docs/COMO_GENERAR_CERTIFICADO_AFIP_CORRECTO.md`

---

## 🎯 PASO 1: GENERAR CLAVE PRIVADA Y CSR EN TU PC

**ANTES de ingresar a ARCA, necesitás generar:**

1. **Clave privada** (`.key`) - Se genera en tu PC
2. **CSR** (`.csr`) - Se sube a ARCA

### **Instalar OpenSSL:**

- Windows: https://slproweb.com/products/Win32OpenSSL.html
- O usar Git Bash (si tenés Git)
- O usar WSL

### **Generar:**

```bash
# 1. Generar clave privada
openssl genrsa -out clave_privada.key 2048

# 2. Generar CSR
openssl req -new -key clave_privada.key -out solicitud.csr
```

---

## 🎯 PASO 2: INGRESAR A ARCA/AFIP

1. **Abrir navegador** y entrar a: **https://www.afip.gob.ar**

2. **Hacer clic en "Acceso con Clave Fiscal"** (botón azul en la página principal)

   O ir directamente a: **https://auth.afip.gob.ar/contribuyente_/login.xhtml**

---

## 🔐 PASO 2: INICIAR SESIÓN

1. **Ingresar tu CUIT** (11 dígitos sin guiones)
2. **Ingresar tu Clave Fiscal**
3. **Completar el captcha** (si aparece)
4. **Hacer clic en "Ingresar"**

**⚠️ IMPORTANTE**: Necesitás tener **Clave Fiscal nivel 3 o superior** para generar certificados.

---

## 📋 PASO 3: ACCEDER A CERTIFICADOS

Una vez dentro del portal de AFIP:

### **Opción A: Desde el Menú Principal**

1. En la página principal, buscar la sección **"Sistema de Clave Fiscal"**
2. Hacer clic en **"Certificados"** o **"Generar Certificado"**

### **Opción B: Desde "Mis Aplicaciones Web"**

1. En la página principal, buscar **"Mis Aplicaciones Web"** o **"Aplicaciones"**
2. Buscar la aplicación **"Sistema de Clave Fiscal"** o **"Clave Fiscal"**
3. Dentro de esa aplicación, buscar la opción **"Certificados"**

### **Opción C: Ruta Directa**

1. Desde el menú superior, buscar:
   - **"Servicios"** → **"Clave Fiscal"** → **"Certificados"**
   
   O:
   
   - **"Contribuyente"** → **"Clave Fiscal"** → **"Certificados"**

---

## 🔑 PASO 3: SUBIR CSR A ARCA

Una vez en la sección de Certificados:

1. **Buscar la opción** para subir CSR:
   - **"Solicitar Certificado"**
   - **"Subir CSR"**
   - **"Nuevo Certificado"**
   - **"Importar CSR"**

2. **Subir tu archivo CSR** (`solicitud.csr`)

3. **Completar datos adicionales** si se solicitan

4. **Confirmar** y esperar procesamiento

---

## 💾 PASO 4: DESCARGAR CERTIFICADO FIRMADO

Después de que ARCA procese tu CSR:

1. **Buscar tu certificado** en la lista (estado: "Aprobado" o "Activo")
2. **Hacer clic en "Descargar"** o **"Descargar Certificado"**
3. Se descargará un archivo con extensión **`.crt`** o **`.cer`**
4. **Guardarlo** junto con tu clave privada (ej: `backend/certs/certificado.crt`)

**⚠️ IMPORTANTE**: 
- La clave privada ya la tenés (la generaste en tu PC)
- NO se descarga desde ARCA
- Guardá AMBOS archivos en lugar seguro

---

## 📝 PASO 6: VERIFICAR ARCHIVOS DESCARGADOS

Verificá que tengas ambos archivos:

- ✅ **certificado.crt** (o .cer) - Contiene el certificado público
- ✅ **clave_privada.key** (o .pem) - Contiene la clave privada

**Formato del certificado** (al abrirlo con un editor de texto):
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAK...
(muchas líneas de texto codificado)
...
-----END CERTIFICATE-----
```

**Formato de la clave privada**:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQ...
(muchas líneas de texto codificado)
...
-----END PRIVATE KEY-----
```

---

## ⚠️ IMPORTANTE: SEGURIDAD

### **NO HACER:**
- ❌ NO compartir estos archivos con nadie
- ❌ NO subirlos a repositorios públicos (GitHub, etc.)
- ❌ NO enviarlos por email sin cifrar
- ❌ NO perder la contraseña de la clave privada

### **SÍ HACER:**
- ✅ Guardar en carpeta segura y privada
- ✅ Hacer backup en lugar seguro
- ✅ Anotar la contraseña en lugar seguro
- ✅ Usar solo en tu servidor/PC del negocio

---

## 🔍 SI NO ENCONTRÁS LA OPCIÓN

### **Alternativa 1: Buscar en el Portal**

1. En la página principal de AFIP, usar el **buscador** (si hay)
2. Buscar: **"certificado digital"** o **"certificado"**
3. Seguir los resultados

### **Alternativa 2: Contactar Soporte AFIP**

Si no encontrás la opción:

- **Teléfono**: 0800-999-2347
- **Email**: consultas@afip.gob.ar
- **Web**: https://www.afip.gob.ar/contacto

Deciles: *"Necesito generar un certificado digital para facturación electrónica"*

### **Alternativa 3: Usar Certificado Existente**

Si ya tenés un certificado de AFIP:

1. Buscar en tu PC archivos `.crt`, `.cer`, `.key`, `.pem`
2. Si encontrás alguno relacionado con AFIP, podés usarlo
3. Verificar que no esté vencido

---

## 📞 AYUDA ADICIONAL

### **Requisitos para Generar Certificado:**

- ✅ Clave Fiscal nivel 3 o superior
- ✅ CUIT activo
- ✅ Navegador actualizado (Chrome, Firefox, Edge)
- ✅ JavaScript habilitado

### **Si tu Clave Fiscal es nivel 1 o 2:**

Necesitás **elevar el nivel** primero:

1. Ir a **"Sistema de Clave Fiscal"** → **"Elevar Nivel"**
2. Seguir las instrucciones (generalmente requiere validación adicional)
3. Una vez en nivel 3, podés generar certificados

---

## ✅ CHECKLIST

Antes de continuar con la configuración:

- [ ] Certificado `.crt` descargado
- [ ] Clave privada `.key` descargada
- [ ] Contraseña de la clave privada anotada
- [ ] Archivos guardados en lugar seguro
- [ ] Archivos verificados (formato correcto)

---

## 🚀 SIGUIENTE PASO

Una vez que tengas los certificados:

1. **Instalar pyafipws**: `pip install pyafipws`
2. **Configurar en el sistema**: Ver `docs/PASOS_ACTIVAR_AFIP.md` paso 3
3. **Probar conexión**: Ver `docs/PASOS_ACTIVAR_AFIP.md` paso 5

---

**¿Necesitás más ayuda?** Si seguís sin encontrar la opción, contactá a AFIP o decime qué ves en tu pantalla y te guío paso a paso.
