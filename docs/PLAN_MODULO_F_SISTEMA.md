# 📋 PLAN DE IMPLEMENTACIÓN - MÓDULO F: SISTEMA

**Fecha de inicio:** 12 de febrero de 2026  
**Estado:** 🚀 En planificación

---

## 🎯 OBJETIVO

Implementar funcionalidades avanzadas del sistema para mejorar seguridad, confiabilidad, administración y conectividad.

---

## 📦 FUNCIONALIDADES A DESARROLLAR

### **F1: Backup Automático de Base de Datos** ⏰
**Prioridad:** 🔴 ALTA (seguridad de datos)

**Descripción:**
- Respaldo automático de la base de datos PostgreSQL
- Programación diaria/semanal/mensual
- Almacenamiento local y opcional en la nube
- Restauración fácil desde el panel admin

**Tecnologías:**
- Backend: Script Python con `pg_dump`
- Programación: `APScheduler` o `Celery Beat`
- Almacenamiento: Filesystem local + opcional AWS S3/Google Drive

**Archivos a crear:**
- `backend/apps/sistema/backup_manager.py`
- `backend/apps/sistema/tasks.py`
- `backend/apps/sistema/views.py` (endpoints para backup/restore)

---

### **F2: Logs de Auditoría Más Detallados** 📝
**Prioridad:** 🟡 MEDIA (trazabilidad)

**Descripción:**
- Registro detallado de TODAS las acciones críticas
- Quién, qué, cuándo, desde dónde (IP)
- Logs de: ventas, compras, ajustes de stock, cambios de precios, etc.
- Visor de logs en el admin con filtros

**Tecnologías:**
- Middleware Django personalizado
- Modelo `AuditLog` con campos: usuario, acción, modelo, antes/después, IP, timestamp
- Frontend: Tabla con búsqueda y filtros

**Archivos a crear:**
- `backend/apps/sistema/models.py` (modelo AuditLog)
- `backend/apps/sistema/middleware.py`
- `frontend/src/pages/AuditLogs.jsx`

---

### **F3: Gestión de Usuarios y Permisos Granular** 👥
**Prioridad:** 🟠 MEDIA-ALTA (seguridad)

**Descripción:**
- Permisos específicos por módulo y acción
- Ejemplo: "Vendedor puede crear ventas pero no anular"
- Roles personalizables
- Restricciones a nivel de API

**Tecnologías:**
- Django Rest Framework Permissions personalizados
- Modelo de permisos expandido
- Frontend: Panel de gestión de roles y permisos

**Archivos a modificar/crear:**
- `backend/apps/usuarios/models.py` (expandir permisos)
- `backend/apps/usuarios/permissions.py`
- `frontend/src/pages/Usuarios.jsx` (CRUD completo)
- `frontend/src/pages/Roles.jsx` (nuevo)

---

### **F4: Modo Offline (Sin Internet)** 🔌
**Prioridad:** 🟡 MEDIA (opcional pero útil)

**Descripción:**
- El POS funciona sin conexión a internet
- Sincronización automática al recuperar conexión
- Caché local de productos y clientes
- Cola de operaciones pendientes

**Tecnologías:**
- Service Workers (PWA)
- IndexedDB para almacenamiento local
- Sincronización con Background Sync API
- Estado de conexión en tiempo real

**Archivos a crear:**
- `frontend/public/service-worker.js`
- `frontend/src/utils/offlineManager.js`
- `frontend/src/hooks/useOnlineStatus.js`

---

### **F5: Exportación de Datos a Excel** 📊
**Prioridad:** 🟢 BAJA-MEDIA (comodidad)

**Descripción:**
- Exportar reportes a Excel (.xlsx)
- Desde: ventas, productos, clientes, inventario
- Formato personalizable
- Descarga directa desde navegador

**Tecnologías:**
- Backend: `openpyxl` o `xlsxwriter`
- Endpoints de exportación por módulo
- Frontend: Botones "Exportar a Excel"

**Archivos a crear:**
- `backend/apps/sistema/exporters.py`
- `backend/apps/ventas/views.py` (endpoint export)
- `backend/apps/productos/views.py` (endpoint export)
- `frontend/src/components/ExportButton.jsx`

---

### **F6: Integración con WhatsApp Business** 💬
**Prioridad:** 🟢 BAJA (marketing/comunicación)

**Descripción:**
- Enviar tickets de venta por WhatsApp
- Notificaciones de stock bajo a proveedores
- Promociones a clientes
- Integración con WhatsApp Business API

**Tecnologías:**
- WhatsApp Business API (oficial o Twilio)
- Backend: Endpoints para envío de mensajes
- Frontend: Botón "Enviar por WhatsApp" en ventas

**Archivos a crear:**
- `backend/apps/notificaciones/whatsapp.py`
- `backend/apps/notificaciones/views.py`
- `frontend/src/components/WhatsAppButton.jsx`

---

## 📅 CRONOGRAMA PROPUESTO

### **Fase 1: Seguridad y Confiabilidad** (Semana 1)
1. ✅ F1: Backup automático
2. ✅ F2: Logs de auditoría

### **Fase 2: Administración** (Semana 2)
3. ✅ F3: Gestión de usuarios y permisos
4. ✅ F5: Exportación a Excel

### **Fase 3: Avanzado** (Semana 3)
5. ✅ F4: Modo offline
6. ✅ F6: Integración WhatsApp

---

## 🔧 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

Por **prioridad** y **dependencias**:

1. **F1 - Backup automático** (crítico, independiente)
2. **F2 - Logs de auditoría** (importante, independiente)
3. **F5 - Exportación Excel** (útil, rápido de implementar)
4. **F3 - Gestión de permisos** (complejo, modifica varios módulos)
5. **F4 - Modo offline** (complejo, requiere testing extensivo)
6. **F6 - WhatsApp** (opcional, requiere cuenta/API externa)

---

## 📝 NOTAS IMPORTANTES

### **F1 - Backup:**
- Configurar rotación de backups (mantener últimos 7 días)
- Considerar encriptación de backups
- Notificar al admin si un backup falla

### **F2 - Logs:**
- Evitar loguear información sensible (contraseñas, tokens)
- Implementar limpieza automática de logs antiguos
- Considerar indexación para búsquedas rápidas

### **F3 - Permisos:**
- No romper funcionalidad existente
- Permisos por defecto seguros
- Admin siempre tiene todos los permisos

### **F4 - Offline:**
- Solo POS necesita funcionar offline
- Admin y reportes pueden requerir conexión
- Sincronización debe ser robusta (evitar duplicados)

### **F5 - Excel:**
- Limitar cantidad de registros exportables (performance)
- Incluir filtros aplicados en la exportación
- Formato profesional y legible

### **F6 - WhatsApp:**
- Requiere cuenta de WhatsApp Business verificada
- Costos por mensaje (según proveedor)
- Cumplir con políticas de WhatsApp (no spam)

---

## 🎯 RESULTADO ESPERADO

Al completar el Módulo F, el sistema tendrá:

✅ **Seguridad mejorada** con backups y auditoría  
✅ **Gestión avanzada** de usuarios con permisos granulares  
✅ **Resiliencia** con modo offline  
✅ **Flexibilidad** con exportación de datos  
✅ **Conectividad** con clientes vía WhatsApp  

---

## 📊 ESTIMACIÓN DE ESFUERZO

| Funcionalidad | Complejidad | Tiempo Estimado |
|---------------|-------------|-----------------|
| F1 - Backup | Media | 4-6 horas |
| F2 - Logs | Media | 6-8 horas |
| F3 - Permisos | Alta | 10-12 horas |
| F4 - Offline | Muy Alta | 16-20 horas |
| F5 - Excel | Baja | 3-4 horas |
| F6 - WhatsApp | Media | 6-8 horas |
| **TOTAL** | | **45-58 horas** |

---

## 🚀 ¿POR DÓNDE EMPEZAMOS?

Sugiero comenzar con **F1 (Backup automático)** porque:
- Es **crítico** para seguridad de datos
- Es **independiente** (no afecta otros módulos)
- Es **rápido** de implementar (4-6 horas)
- Da **tranquilidad** inmediata

Después seguimos con F2, F5, F3, F4 y F6 en ese orden.

---

**¿Comenzamos con F1 - Backup Automático?** 🎯
