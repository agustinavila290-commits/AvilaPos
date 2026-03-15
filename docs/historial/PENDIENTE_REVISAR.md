# 📋 CHECKLIST DE REVISIÓN Y PRUEBAS

**Fecha de creación**: 11 de Febrero 2026  
**Última actualización**: 11 de Febrero 2026  
**Estado**: Módulo F + Facturación + Electron implementados - Pendiente de pruebas

---

## 🔴 CRÍTICO - Probar Antes de Producción

### 0. Versión Electron (NUEVO) ⭐
- [ ] **Probar aplicación de escritorio**
  - Ejecutar: `.\iniciar_electron.bat`
  - Verificar que se abre ventana sin navegador
  - Probar todas las funcionalidades
  - Verificar menú (F5, F11, F12)
  - Probar zoom (Ctrl +/-)

- [ ] **Generar instalador .exe**
  ```bash
  cd frontend
  npm run electron:build
  ```
  - Verificar que se crea el instalador
  - Ubicación: `frontend/dist-electron/Casa de Repuestos-Setup-1.0.0.exe`
  - Tamaño aproximado: 100-150 MB

- [ ] **Probar instalación**
  - Instalar el .exe en otra carpeta
  - Verificar icono en escritorio
  - Verificar acceso directo en Menú Inicio
  - Abrir la aplicación instalada
  - Verificar que funciona correctamente

- [ ] **Crear icono personalizado** (Opcional pero recomendado)
  - Descargar/crear PNG 512x512
  - Convertir a ICO
  - Reemplazar `frontend/build/icon.png` e `icon.ico`
  - Ver: `frontend/INSTRUCCIONES_ICONO.md`
  - Recompilar: `npm run electron:build`

## 🔴 CRÍTICO - Probar Antes de Producción (Continuación)

### 1. Sistema de Backups
- [ ] **Probar creación de backup manual**
  - Ir a http://localhost:5173/backups
  - Click en "Crear Backup Ahora"
  - Verificar que se crea archivo en `backend/backups/`
  - Verificar que aparece en la lista de backups

- [ ] **Probar restauración de backup**
  - ⚠️ PRECAUCIÓN: Esto reemplaza toda la base de datos
  - Hacer un backup de prueba primero
  - Intentar restaurar el backup
  - Verificar que los datos se restauran correctamente

- [ ] **Verificar comando de backup**
  ```bash
  cd backend
  .\venv\Scripts\activate
  python manage.py backup_database
  ```
  - Verificar que se crea el archivo
  - Verificar que se registra en BackupLog

- [ ] **Configurar backup automático**
  - Windows Task Scheduler: Crear tarea diaria a las 3:00 AM
  - Comando: `python manage.py backup_database`
  - Directorio: `C:\Users\Agustin\Avila\backend`
  - Verificar que se ejecuta correctamente

### 2. Logs de Auditoría
- [ ] **Verificar que se registran acciones**
  - Hacer login → verificar en `/audit-logs` que aparece
  - Crear una venta → verificar que se registra
  - Hacer una compra → verificar que se registra
  - Ajustar stock → verificar que se registra

- [ ] **Probar filtros de audit logs**
  - Filtrar por tipo de acción (VENTA, COMPRA, etc.)
  - Filtrar por usuario
  - Filtrar por rango de fechas

- [ ] **Integrar AuditLogger en todas las operaciones críticas**
  - ❌ PENDIENTE: Agregar en VentaViewSet.create()
  - ❌ PENDIENTE: Agregar en CompraViewSet.create()
  - ❌ PENDIENTE: Agregar en anulaciones de venta
  - ❌ PENDIENTE: Agregar en ajustes de stock
  - ❌ PENDIENTE: Agregar en login/logout (views de auth)

### 3. Exportación a Excel
- [ ] **Probar exportación de ventas**
  - Postman/Thunder Client: `GET http://localhost:8000/api/sistema/export/ventas/`
  - Verificar que descarga archivo Excel
  - Abrir archivo y verificar datos
  - Probar con filtros de fecha: `?fecha_desde=2026-02-01&fecha_hasta=2026-02-28`

- [ ] **Probar exportación de productos**
  - `GET http://localhost:8000/api/sistema/export/productos/`
  - Verificar que incluye todas las variantes

- [ ] **Probar exportación de clientes**
  - `GET http://localhost:8000/api/sistema/export/clientes/`

- [ ] **Probar exportación de inventario**
  - `GET http://localhost:8000/api/sistema/export/inventario/`
  - Verificar que muestra stocks por depósito

- [ ] **Probar exportación de compras**
  - `GET http://localhost:8000/api/sistema/export/compras/`

- [ ] **Agregar botones "Exportar Excel" en el frontend**
  - ❌ PENDIENTE: Botón en página de Ventas
  - ❌ PENDIENTE: Botón en página de Productos
  - ❌ PENDIENTE: Botón en página de Clientes
  - ❌ PENDIENTE: Botón en página de Inventario
  - ❌ PENDIENTE: Botón en página de Compras

### 4. Sistema de Permisos Granulares
- [ ] **Verificar que los nuevos roles funcionan**
  - Crear usuario con rol VENDEDOR
  - Crear usuario con rol DEPOSITO
  - Crear usuario con rol SUPERVISOR
  - Verificar que cada uno tiene acceso correcto

- [ ] **Probar asignación de permisos personalizados**
  - Admin Django: `/admin`
  - Crear algunos permisos (si no existen)
  - Asignar permisos a un usuario
  - Verificar método `usuario.tiene_permiso('ventas.crear')`

- [ ] **Crear interfaz de gestión de permisos en frontend**
  - ❌ PENDIENTE: Página para listar permisos
  - ❌ PENDIENTE: Página para asignar permisos a usuarios
  - ❌ PENDIENTE: Página para gestionar roles

---

## 🟡 IMPORTANTE - Probar Cuando Sea Posible

### 5. Modo Offline (PWA)
- [ ] **Activar Service Worker**
  - Editar `frontend/src/main.jsx`
  - Agregar código de registro del SW (ver MODO_OFFLINE.md)
  - Agregar `<link rel="manifest" href="/manifest.json">` en index.html

- [ ] **Probar funcionamiento offline**
  - Abrir Chrome DevTools → Application → Service Workers
  - Verificar que SW está "activated"
  - Network tab → Cambiar a "Offline"
  - Recargar página → debería funcionar parcialmente

- [ ] **Implementar indicador de conexión**
  - ❌ PENDIENTE: Componente que muestre "Online" / "Offline"
  - ❌ PENDIENTE: Deshabilitar botones críticos en modo offline

### 6. Integración WhatsApp
- [ ] **Crear cuenta Twilio** (si se desea implementar)
  - Registrarse en https://www.twilio.com/
  - Obtener Account SID y Auth Token
  - Configurar WhatsApp Sandbox

- [ ] **Configurar credenciales**
  - Editar `backend/.env`:
    ```env
    TWILIO_ACCOUNT_SID=ACxxxxx
    TWILIO_AUTH_TOKEN=xxxxx
    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
    ```
  - Instalar: `pip install twilio`

- [ ] **Probar envío de mensajes**
  - Desde shell de Django:
    ```python
    from apps.sistema.whatsapp import whatsapp_manager
    result = whatsapp_manager.enviar_mensaje(
        'whatsapp:+5491134567890',
        'Mensaje de prueba'
    )
    print(result)
    ```

- [ ] **Integrar en flujos automáticos**
  - ❌ PENDIENTE: Enviar notificación al crear venta
  - ❌ PENDIENTE: Enviar alerta cuando stock crítico
  - ❌ PENDIENTE: Crear endpoints en API para envío manual

---

## 🟠 FACTURACIÓN ELECTRÓNICA (NUEVO)

### Facturación AFIP
- [ ] **Probar facturación en modo simulado**
  - Admin: http://localhost:8000/admin
  - Crear Configuración AFIP
  - Crear Punto de Venta
  - Crear Factura B de prueba
  - Autorizar factura (genera CAE simulado)
  - Descargar PDF

- [ ] **Verificar tipos de comprobantes**
  - Crear Factura A
  - Crear Factura B
  - Crear Presupuesto
  - Verificar cálculo de IVA

- [ ] **Probar generación de PDF**
  - Descargar PDF de factura
  - Verificar formato AFIP
  - Verificar que aparece CAE
  - Verificar datos del cliente

- [ ] **Para producción** (Cuando esté listo)
  - Obtener certificado AFIP
  - Instalar: `pip install pyafipws`
  - Configurar certificado en Admin
  - Cambiar `modo_simulado = False` en `afip_service.py`
  - Probar en ambiente de Homologación
  - Pasar a Producción

- [ ] **Crear frontend para facturas** (Futuro)
  - ❌ PENDIENTE: Página para emitir facturas
  - ❌ PENDIENTE: Botón "Facturar" en ventas
  - ❌ PENDIENTE: Visor de facturas emitidas

---

## 🔵 FUNCIONALIDADES EXISTENTES - Verificar

### POS (Punto de Venta)
- [ ] **Probar POS con precios CONTADO vs TARJETA**
  - Crear venta con método CONTADO → verificar que usa precio_mostrador
  - Crear venta con método TARJETA → verificar que usa precio_tarjeta
  - Verificar que el total se calcula correctamente

- [ ] **Probar atajos de teclado**
  - ENTER → Buscar producto
  - F10 → Finalizar venta
  - F12 → Cancelar venta
  - F4 → Cambiar método de pago
  - ESC → Limpiar búsqueda
  - DEL → Eliminar ítem seleccionado

- [ ] **Probar impresión de ticket térmico**
  - Crear venta
  - Click en "Imprimir Ticket"
  - Verificar que se abre ventana de impresión
  - Verificar formato 80mm

- [ ] **Probar en diferentes resoluciones**
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)

- [ ] **Acceso desde celular**
  - Seguir guía en `ACCESO_DESDE_CELULAR.md`
  - Verificar que funciona en red local
  - Probar hacer una venta desde el celular

### Ventas
- [ ] **Probar creación de venta completa**
  - Seleccionar cliente
  - Agregar productos
  - Aplicar descuento
  - Seleccionar método de pago
  - Verificar que descuenta stock

- [ ] **Probar anulación de venta**
  - Crear venta
  - Anularla
  - Verificar que devuelve stock
  - Verificar que aparece en audit logs

### Devoluciones
- [ ] **Probar devolución total**
  - Crear venta
  - Hacer devolución total
  - Verificar que genera nota de crédito
  - Verificar que devuelve stock

- [ ] **Probar devolución parcial**
  - Crear venta con múltiples ítems
  - Devolver solo algunos ítems
  - Verificar montos

### Reportes
- [ ] **Probar todos los reportes**
  - Ventas por período
  - Productos más vendidos
  - Ventas por cliente
  - Stock crítico
  - Movimientos de inventario

### Compras
- [ ] **Probar registro de compra**
  - Crear compra
  - Verificar que suma stock
  - Verificar cálculo de total

### Inventario
- [ ] **Probar ajuste de stock**
  - Ajustar stock de un producto
  - Verificar que se registra movimiento
  - Verificar nuevo stock

- [ ] **Probar transferencia entre depósitos**
  - Transferir stock de un depósito a otro
  - Verificar que se actualiza en ambos

### Clientes
- [ ] **Probar CRUD de clientes**
  - Crear cliente
  - Editar cliente
  - Buscar cliente
  - Verificar validaciones

### Productos
- [ ] **Probar CRUD de productos**
  - Crear producto base
  - Agregar variantes
  - Editar precios (contado y tarjeta)
  - Buscar por SKU y código de barras

---

## 🟢 MEJORAS FUTURAS (No Urgentes)

### Frontend
- [ ] Agregar indicador de carga global (loading spinner)
- [ ] Implementar notificaciones toast (éxito, error)
- [ ] Mejorar manejo de errores (mensajes más claros)
- [ ] Agregar confirmaciones antes de acciones destructivas
- [ ] Implementar paginación en todas las listas
- [ ] Agregar buscadores más avanzados (autocompletado)
- [ ] Tema oscuro (dark mode)
- [ ] Personalización de colores del sistema

### Backend
- [ ] Implementar caché (Redis) para consultas frecuentes
- [ ] Optimizar queries N+1 con `select_related` y `prefetch_related`
- [ ] Agregar índices a campos frecuentemente consultados
- [ ] Implementar rate limiting en API
- [ ] Agregar compresión de respuestas (gzip)
- [ ] Implementar versionado de API (v1, v2)

### Seguridad
- [ ] Configurar HTTPS en producción
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Agregar CAPTCHA en login
- [ ] Implementar política de contraseñas fuertes
- [ ] Rotación automática de tokens JWT
- [ ] Auditoría de accesos fallidos

### Reportes
- [ ] Agregar gráficos interactivos (Chart.js)
- [ ] Dashboard con KPIs en tiempo real
- [ ] Reportes programados (envío por email)
- [ ] Comparativas entre períodos
- [ ] Exportación a PDF de reportes

### Optimización
- [ ] Implementar lazy loading en listados grandes
- [ ] Comprimir imágenes automáticamente
- [ ] Minificar archivos JS/CSS
- [ ] Implementar CDN para recursos estáticos
- [ ] Configurar caché del navegador

---

## 📊 MÉTRICAS DE ÉXITO

### Funcionalidades Core (Completado)
- ✅ Sistema de usuarios y autenticación
- ✅ Gestión de clientes
- ✅ Gestión de productos y variantes
- ✅ Inventario multi-depósito
- ✅ Punto de Venta (POS)
- ✅ Ventas y facturación
- ✅ Compras a proveedores
- ✅ Reportes
- ✅ Devoluciones
- ✅ Configuración del sistema

### Módulo F - Sistema (Recién Implementado)
- ✅ F1: Backup automático
- ✅ F2: Logs de auditoría
- ✅ F3: Permisos granulares
- ⚠️ F4: Modo offline (básico, requiere activación)
- ✅ F5: Exportación Excel
- ⚠️ F6: WhatsApp (básico, requiere Twilio)

---

## 🎯 PRIORIDAD DE PRUEBAS

### Alta Prioridad (Esta Semana)
1. ✅ Probar backups (crear y restaurar)
2. ✅ Verificar exportación a Excel
3. ✅ Probar POS completo (precios, atajos, ticket)
4. ✅ Verificar que ventas descuentan stock
5. ✅ Probar devoluciones

### Media Prioridad (Próxima Semana)
1. ✅ Integrar AuditLogger en todas las operaciones
2. ✅ Agregar botones "Exportar Excel" en frontend
3. ✅ Configurar backup automático (Task Scheduler)
4. ✅ Probar todos los reportes
5. ✅ Verificar sistema de permisos

### Baja Prioridad (Cuando Sea Posible)
1. ✅ Activar PWA (modo offline)
2. ✅ Configurar WhatsApp (si se necesita)
3. ✅ Implementar mejoras futuras
4. ✅ Optimizaciones de performance

---

## 📝 NOTAS IMPORTANTES

### Antes de Ir a Producción
- [ ] Cambiar `DEBUG = False` en settings.py
- [ ] Configurar `ALLOWED_HOSTS` correctamente
- [ ] Usar base de datos PostgreSQL en producción
- [ ] Configurar backups automáticos
- [ ] Configurar HTTPS
- [ ] Revisar todas las claves secretas (.env)
- [ ] Configurar servidor (Nginx + Gunicorn)
- [ ] Configurar dominio y DNS

### Documentación Disponible
- ✅ README.md - Guía general del proyecto
- ✅ INSTALL.md - Instrucciones de instalación
- ✅ PRUEBAS_EXITOSAS.md - Historial de pruebas
- ✅ MODULO_F_COMPLETADO.md - Resumen Módulo F
- ✅ MODO_OFFLINE.md - Guía PWA
- ✅ INTEGRACION_WHATSAPP.md - Guía WhatsApp
- ✅ ACCESO_DESDE_CELULAR.md - Guía acceso móvil
- ✅ PLAN_MODULO_F_SISTEMA.md - Plan inicial
- ✅ GUIA_WORDPRESS.md - Guía WordPress
- ✅ PENDIENTE_REVISAR.md - Este archivo

---

## ✅ COMPLETADO (Para Referencia)

### Ya Implementado y Funcionando
- ✅ Toda la estructura base del sistema
- ✅ Autenticación JWT
- ✅ CRUD de clientes, productos, ventas, compras
- ✅ Inventario con movimientos y alertas
- ✅ POS con teclado y doble precio
- ✅ Tickets térmicos
- ✅ Devoluciones con nota de crédito
- ✅ Reportes múltiples
- ✅ Sistema responsive
- ✅ Acceso desde celular
- ✅ Módulo F completo (6 funcionalidades)

---

**Última actualización**: 11/02/2026  
**Estado general**: Sistema funcional, pendiente pruebas del Módulo F

---

## 🚀 CÓMO USAR ESTE ARCHIVO

1. **Ir marcando con [x]** cada tarea que se complete
2. **Agregar nuevas tareas** según surjan
3. **Comentar problemas** encontrados en cada sección
4. **Priorizar** según necesidad del negocio

**Ejemplo de uso:**
```markdown
- [x] Probar creación de backup manual
  - ✅ Funciona correctamente
  - Archivo generado: backup_casarepuestos_20260211_153045.sql
  - Tamaño: 2.3 MB
```
