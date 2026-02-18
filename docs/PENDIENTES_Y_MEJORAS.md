# Pendientes y mejoras – Qué falta por completar

Resumen de lo que está **incompleto**, **pendiente** o **mejorable** en el sistema. El core (ventas, compras, inventario, clientes, productos) está funcional; lo que sigue son cierres de detalle y mejoras opcionales.

---

## Prioridad alta (cerrar funcionalidad ya usada)

### 1. ~~Historial de ventas por cliente~~ ✅ Hecho
- **Dónde:** Backend `apps/clientes/views.py` → acción `historial`; frontend `ClienteDetalle.jsx` ya muestra la sección.
- **Qué falta:** El endpoint devuelve `ventas: []`, `total_gastado: 0`, etc. El módulo de ventas ya existe y `Venta` tiene `cliente`.
- **Completar:** En `historial`, consultar `Venta.objects.filter(cliente_id=pk, anulada=False)`, serializar las ventas, calcular `total_gastado`, `cantidad_compras` y `ticket_promedio`, y devolverlos. En el frontend, mostrar la tabla de ventas cuando `historial.ventas.length > 0` (el texto “cuando esté implementado el módulo de ventas” ya no aplica).

### 2. ~~Stock inicial en importación Excel~~ ✅ Hecho
- **Dónde:** Backend `apps/productos/views.py` → `importar_excel`; serializer `ImportacionExcelSerializer` ya tiene `stock_inicial`.
- **Qué falta:** Al crear la variante no se crea movimiento de stock ni registro en `Stock` con la cantidad inicial.
- **Completar:** Si la fila trae `stock_inicial` (y hay depósito principal configurado), después de crear la variante crear/actualizar `Stock` y opcionalmente un `MovimientoStock` de tipo “Ajuste” o “Importación” para ese depósito.

---

## Prioridad media (mejoras de configuración y UX)

### 3. Umbral de stock crítico configurable
- **Dónde:** Backend `apps/inventario/models.py` → propiedad `Stock.es_critico` (hoy `return self.cantidad <= 2`); comentario “TODO: Leer de configuración”.
- **Qué falta:** Que el valor “2” salga de configuración.
- **Completar:** En `configuracion` (o en `Configuracion`/parámetros del sistema) definir una clave tipo `STOCK_CRITICO_UMBRAL` (entero). En `Stock.es_critico` (y donde se use el umbral en reportes) leer ese valor; si no existe, usar 2 por defecto. Opcional: exponer el umbral en la pantalla de Reportes / Stock crítico para filtrar por ese valor.

### 4. Gráficos en reportes
- **Dónde:** Frontend `Reportes.jsx`; README menciona “Reportes avanzados: Gráficos con Chart.js/Recharts”.
- **Qué falta:** Hoy los reportes son tablas y números, sin gráficos.
- **Completar (opcional):** Añadir Recharts (o Chart.js) y al menos un gráfico (ej. ventas por día en el reporte por período, o barras de productos más vendidos). Los endpoints de reportes ya devuelven los datos necesarios.

### 5. Avisos de React Router y Electron
- **Dónde:** Consola del navegador al usar la app (React Router future flags; Electron CSP).
- **Qué falta:** Silenciar o adoptar las futuras flags de React Router (`v7_startTransition`, `v7_relativeSplatPath`) y, si usás Electron, documentar o ajustar Content-Security-Policy para quitar “unsafe-eval” en producción.
- **Completar:** En el `Router` (o `createBrowserRouter`) activar las future flags recomendadas; en Electron, revisar `PASOS_ACTIVAR_AFIP` / documentación de empaquetado y CSP.

---

## Prioridad baja / “Preparado para el futuro”

### 6. Facturación AFIP en uso real
- **Estado:** App `facturacion` existe (modelos, vistas, `AFIPService`, autorización). Falta certificado y entorno AFIP real.
- **Qué falta:** Seguir `docs/PASOS_ACTIVAR_AFIP.md`, obtener certificado y configurar; probar emisión real. No es código pendiente sino configuración y pruebas.

### 7. WhatsApp
- **Estado:** `apps/sistema/whatsapp.py` con funciones para envío; API REST “lista para integraciones”.
- **Qué falta:** Definir flujos concretos (ej. recordatorio de pago, aviso de venta), configurar credenciales y conectar desde el frontend o tareas programadas.

### 8. Exportación Excel/PDF desde reportes
- **Estado:** Backend tiene `sistema/excel_export.py` y facturación tiene generación de PDF. Reportes en frontend no tienen botón “Exportar”.
- **Qué falta:** Endpoints o reutilizar export existente para “ventas por período” / “productos más vendidos” y botón en `Reportes.jsx` que descargue Excel o PDF.

### 9. E-commerce / precio web
- **Estado:** Modelo de productos tiene `precio_web`. No hay tienda pública.
- **Qué falta:** Si se quiere tienda online, sería un módulo nuevo (catálogo público, carrito, checkout). Opcional.

### 10. Tests automatizados
- **Estado:** README menciona “Pruebas exitosas”; no hay suite de tests (pytest, Jest) visible en la estructura.
- **Qué falta:** Añadir tests de backend (pytest para endpoints críticos: ventas, stock, clientes) y, si se desea, tests de frontend (Jest + React Testing Library) para flujos clave.

---

## Resumen rápido

| Ítem | Prioridad | Esfuerzo estimado |
|------|-----------|-------------------|
| Historial ventas por cliente | Alta | 1–2 h |
| Stock inicial en importación Excel | Alta | ~1 h |
| Umbral stock crítico configurable | Media | ~1 h |
| Gráficos en reportes | Media | 2–3 h |
| React Router / Electron avisos | Media | ~30 min |
| AFIP en producción | Baja (config) | Según trámites |
| WhatsApp integrado | Baja | Según diseño |
| Export Excel/PDF en reportes | Baja | 1–2 h |
| Tests automatizados | Baja | Variable |

Si querés, se puede bajar esto a tareas concretas (por archivo y cambio) y empezar por historial de cliente y stock inicial en Excel.
