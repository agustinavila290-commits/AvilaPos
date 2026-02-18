"""
Integración con WhatsApp Business API (Twilio)
NOTA: Requiere configuración de cuenta Twilio y credenciales
"""
import os
from typing import Optional


class WhatsAppManager:
    """
    Gestor para envío de mensajes por WhatsApp Business
    
    Requiere:
    - Cuenta Twilio (https://www.twilio.com/)
    - WhatsApp Business API habilitada
    - Número de WhatsApp verificado
    
    Configuración en .env:
    TWILIO_ACCOUNT_SID=your_account_sid
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
    """
    
    def __init__(self):
        # Nota: Requiere instalación de twilio: pip install twilio
        try:
            from twilio.rest import Client
            
            account_sid = os.getenv('TWILIO_ACCOUNT_SID')
            auth_token = os.getenv('TWILIO_AUTH_TOKEN')
            self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
            
            if account_sid and auth_token:
                self.client = Client(account_sid, auth_token)
                self.enabled = True
            else:
                self.client = None
                self.enabled = False
                print("[WhatsApp] Credenciales no configuradas")
        except ImportError:
            self.client = None
            self.enabled = False
            print("[WhatsApp] Twilio no instalado. Ejecutar: pip install twilio")
    
    def enviar_mensaje(self, to_number: str, mensaje: str) -> dict:
        """
        Envía un mensaje de WhatsApp
        
        Args:
            to_number: Número de teléfono destino (formato: whatsapp:+5491234567890)
            mensaje: Texto del mensaje
        
        Returns:
            dict: {'success': bool, 'message_sid': str, 'error': str}
        """
        if not self.enabled:
            return {
                'success': False,
                'error': 'WhatsApp no configurado'
            }
        
        try:
            # Asegurar formato correcto
            if not to_number.startswith('whatsapp:'):
                to_number = f'whatsapp:{to_number}'
            
            message = self.client.messages.create(
                from_=self.whatsapp_from,
                body=mensaje,
                to=to_number
            )
            
            return {
                'success': True,
                'message_sid': message.sid
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def notificar_venta(self, venta, cliente_telefono: Optional[str] = None) -> dict:
        """
        Envía notificación de venta por WhatsApp
        
        Args:
            venta: Objeto Venta
            cliente_telefono: Teléfono del cliente (opcional, usa el de venta.cliente)
        
        Returns:
            dict: Resultado del envío
        """
        telefono = cliente_telefono or venta.cliente.telefono
        
        if not telefono:
            return {
                'success': False,
                'error': 'Cliente sin teléfono'
            }
        
        mensaje = f"""
🧾 *COMPROBANTE DE VENTA*

📋 Venta N°: {venta.numero}
👤 Cliente: {venta.cliente.nombre_completo}
💰 Total: ${venta.total}
💳 Pago: {venta.get_metodo_pago_display()}

Gracias por su compra!
        """.strip()
        
        return self.enviar_mensaje(telefono, mensaje)
    
    def notificar_stock_critico(self, variante, telefono_admin: str) -> dict:
        """
        Notifica stock crítico a administrador
        
        Args:
            variante: VarianteProducto con stock crítico
            telefono_admin: Teléfono del admin
        
        Returns:
            dict: Resultado del envío
        """
        mensaje = f"""
⚠️ *ALERTA DE STOCK*

📦 Producto: {variante.nombre_completo}
📊 Stock actual: {variante.stock_total}
🔴 Stock mínimo: Se requiere reposición

Revisar inventario urgente.
        """.strip()
        
        return self.enviar_mensaje(telefono_admin, mensaje)
    
    def enviar_recordatorio_pago(self, cliente, deuda_total: float) -> dict:
        """
        Envía recordatorio de pago pendiente
        
        Args:
            cliente: Cliente con deuda
            deuda_total: Monto total adeudado
        
        Returns:
            dict: Resultado del envío
        """
        if not cliente.telefono:
            return {
                'success': False,
                'error': 'Cliente sin teléfono'
            }
        
        mensaje = f"""
💌 Hola {cliente.nombre_completo}!

📋 Recordatorio amistoso de pago pendiente
💰 Monto: ${deuda_total}

Por favor comuníquese con nosotros para coordinar el pago.

Gracias!
        """.strip()
        
        return self.enviar_mensaje(cliente.telefono, mensaje)


# Instancia global
whatsapp_manager = WhatsAppManager()
