# 📱 ACCESO AL SISTEMA DESDE CELULAR

## ✅ Configuración Completada

El sistema ahora acepta conexiones desde tu red local WiFi.

---

## 📋 REQUISITOS

1. ✅ Tu PC y celular deben estar en la **misma red WiFi**
2. ✅ El backend (Django) debe estar corriendo
3. ✅ El frontend (Vite) debe estar corriendo

---

## 🌐 TU DIRECCIÓN IP LOCAL

**IP de tu PC:** `192.168.1.23`

---

## 📱 CÓMO CONECTARTE DESDE EL CELULAR

### **PASO 1: Verificar que todo esté corriendo**

En tu PC, asegúrate de que los servidores estén activos:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### **PASO 2: Conectar el celular a la misma WiFi**

Ambos dispositivos deben estar en la **misma red**.

### **PASO 3: Abrir en el celular**

En el navegador de tu celular, ingresa:

```
http://192.168.1.23:5173
```

⚠️ **IMPORTANTE:** Usa `http://` (NO `https://`)

---

## 🔐 CREDENCIALES DE ACCESO

```
Usuario:  admin
Password: admin123
```

---

## ✅ LO QUE DEBERÍAS VER

1. Pantalla de **Login**
2. Después de ingresar, el **Dashboard**
3. Botón verde grande: **"PUNTO DE VENTA"**
4. Todo el POS adaptado a tu celular (responsive)

---

## 🛠️ SI NO FUNCIONA, VERIFICA:

### **1. Ambos dispositivos en la misma red**
- PC y celular conectados a la misma WiFi

### **2. Firewall de Windows**
Si no carga, puede que el firewall bloquee la conexión:

```powershell
# Ejecuta esto en PowerShell (como administrador):
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### **3. Servidores corriendo**
Verifica que ambos servidores estén activos:
- Backend: `http://localhost:8000/api/` debe responder
- Frontend: Debe haber un proceso Node.js corriendo

### **4. IP correcta**
Si cambió tu IP local, obtén la nueva ejecutando en PowerShell:
```powershell
ipconfig
```
Busca **"Dirección IPv4"** (algo como 192.168.X.X)

---

## 🔄 SI LA IP CAMBIÓ

Si tu PC obtiene una nueva IP (después de reiniciar, por ejemplo):

1. Ejecuta en PowerShell:
   ```powershell
   ipconfig | Select-String "IPv4"
   ```

2. Anota la nueva IP

3. Úsala en tu celular:
   ```
   http://[NUEVA_IP]:5173
   ```

---

## 📊 VENTAJAS DEL ACCESO MÓVIL

✅ Usa el POS desde cualquier lugar de tu tienda  
✅ Interfaz totalmente responsive (adaptada a celular)  
✅ Vista de cards para productos en móvil  
✅ Botones táctiles grandes  
✅ Mismo sistema, diferentes dispositivos  

---

## 🎯 CASOS DE USO

1. **Vendedor móvil:** Camina por la tienda con el celular
2. **Múltiples puntos de venta:** Varios vendedores en diferentes dispositivos
3. **Atención en mostrador:** PC para cajero principal
4. **Inventario móvil:** Verificar stock desde el depósito

---

## ⚠️ LIMITACIONES

- Solo funciona en tu red local (WiFi)
- No funciona desde Internet (sin configuración adicional)
- La PC debe estar encendida y con servidores corriendo
- Si usas VPN, puede no funcionar

---

## 🚀 ACCESO DESDE INTERNET (OPCIONAL)

Si quieres acceder desde cualquier lugar (no solo WiFi local), necesitarías:

1. IP pública estática o servicio DNS dinámico
2. Configurar Port Forwarding en tu router
3. Certificado SSL/HTTPS
4. Medidas de seguridad adicionales

**No recomendado** sin conocimientos de seguridad.

---

## 📝 RESUMEN RÁPIDO

```
✅ PC IP: 192.168.1.23
✅ URL Celular: http://192.168.1.23:5173
✅ Misma WiFi: SÍ
✅ Usuario: admin
✅ Password: admin123
```

---

## 🎉 ¡LISTO PARA USAR!

Ahora puedes usar el sistema desde tu celular.  
El POS está completamente adaptado para pantallas táctiles.

**¿Problemas? Revisa la sección "SI NO FUNCIONA" arriba.**

---

**Documentación creada:** 12 de febrero de 2026  
**Última actualización de IP:** 192.168.1.23
