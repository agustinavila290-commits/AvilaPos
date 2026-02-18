# Integración con WhatsApp Business

## Descripción

El sistema incluye capacidad para enviar mensajes automáticos por WhatsApp usando **Twilio WhatsApp Business API**.

## Características

### Casos de Uso Implementados

1. **Notificaciones de Venta**
   - Envío automático de comprobante al cliente
   - Incluye número de venta, total y método de pago

2. **Alertas de Stock Crítico**
   - Notifica a administradores cuando hay stock bajo
   - Permite tomar decisiones de reposición

3. **Recordatorios de Pago**
   - Envío manual de recordatorios a clientes
   - Útil para cuentas corrientes

## Requisitos

### 1. Cuenta Twilio

1. Crear cuenta en [twilio.com](https://www.twilio.com/)
2. Activar WhatsApp Business API
3. Verificar número de WhatsApp
4. Obtener credenciales:
   - Account SID
   - Auth Token
   - WhatsApp Number

### 2. Instalación de Twilio SDK

```bash
cd backend
.\venv\Scripts\activate
pip install twilio
```

Agregar a `requirements.txt`:
```
twilio==8.10.0
```

### 3. Configuración

Editar `backend/.env`:

```env
# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Uso

### Desde el Código

```python
from apps.sistema.whatsapp import whatsapp_manager

# Verificar si está configurado
if whatsapp_manager.enabled:
    # Notificar venta
    result = whatsapp_manager.notificar_venta(
        venta=venta_obj,
        cliente_telefono='whatsapp:+5491134567890'
    )
    
    if result['success']:
        print(f"Mensaje enviado: {result['message_sid']}")
    else:
        print(f"Error: {result['error']}")
```

### Integrar en Views

```python
# En apps/ventas/views.py
from apps.sistema.whatsapp import whatsapp_manager

class VentaViewSet(viewsets.ModelViewSet):
    # ...
    
    def create(self, request):
        # ... crear venta ...
        
        # Enviar notificación por WhatsApp
        if venta.cliente.telefono:
            whatsapp_manager.notificar_venta(venta)
        
        # ... resto del código ...
```

## API Endpoints (Futuro)

Endpoints propuestos para gestión desde frontend:

```
POST /api/sistema/whatsapp/send/
- Envío manual de mensajes

POST /api/sistema/whatsapp/notify-venta/{venta_id}/
- Reenviar notificación de venta

POST /api/sistema/whatsapp/recordatorio-pago/{cliente_id}/
- Enviar recordatorio de pago
```

## Formato de Números

Los números de teléfono deben estar en formato E.164:

```
Correcto:
- whatsapp:+5491134567890
- whatsapp:+5493415123456

Incorrecto:
- +54 9 11 3456-7890
- 011 3456-7890
```

El sistema convierte automáticamente si falta el prefijo `whatsapp:`.

## Limitaciones

### Twilio WhatsApp Sandbox (Desarrollo)

- Requiere que destinatarios se unan al sandbox
- Mensaje de prueba: "join [palabra-clave]"
- Limitado a 24 horas por sesión

### Twilio WhatsApp Business API (Producción)

- Requiere aprobación de Facebook
- Costo por mensaje (~$0.005 USD por mensaje)
- Plantillas de mensajes pre-aprobadas

## Costos Aproximados

| Servicio | Costo por Mensaje | Notas |
|----------|-------------------|-------|
| Twilio WhatsApp | ~$0.005 USD | Varía por país |
| Twilio SMS (alternativa) | ~$0.0075 USD | Sin requerir WhatsApp |

Para 1000 mensajes/mes: ~$5 USD

## Alternativas

### 1. WhatsApp Business API Directa (Meta)
- Más complejo de configurar
- Sin intermediarios
- Requiere infraestructura propia

### 2. Otros Proveedores
- **Vonage** (ex-Nexmo)
- **MessageBird**
- **Plivo**

### 3. Solución Local
- WhatsApp Web API (no oficial)
- Requiere mantener sesión activa
- Riesgo de baneo

## Estado Actual

**Implementación**: ⚠️ Básica/Lista para usar

- ✅ Código base implementado
- ✅ Funciones principales creadas
- ❌ NO activado por defecto (requiere configuración)
- ❌ NO probado (requiere cuenta Twilio)
- ❌ NO integrado en flujos automáticos

## Próximos Pasos

1. **Crear cuenta Twilio** y obtener credenciales
2. **Configurar .env** con las credenciales
3. **Instalar twilio**: `pip install twilio`
4. **Probar envío** con número de prueba
5. **Integrar en views** de ventas/compras
6. **Crear frontend** para envío manual

## Soporte

- Documentación Twilio: https://www.twilio.com/docs/whatsapp
- API Reference: https://www.twilio.com/docs/whatsapp/api
- Precios: https://www.twilio.com/whatsapp/pricing
