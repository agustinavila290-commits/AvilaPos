"""
Servicio de integración con AFIP Web Services
Requiere: pip install pyafipws
"""
from datetime import datetime, timedelta
from decimal import Decimal


class AFIPService:
    """
    Servicio para integración con AFIP
    
    IMPORTANTE: Esta es una implementación SIMULADA para desarrollo.
    Para producción, debe implementarse con pyafipws o similar.
    """
    
    def __init__(self, config=None):
        """
        Inicializa el servicio AFIP
        
        Args:
            config: Objeto ConfiguracionAFIP (opcional)
        """
        self.config = config
        
        # Activar modo real automáticamente si hay configuración y certificados
        # Para forzar modo simulado, cambiar a: self.modo_simulado = True
        if config and config.certificado and config.clave_privada:
            # Hay certificados configurados, intentar modo real
            self.modo_simulado = False
        else:
            # No hay certificados, usar modo simulado
            self.modo_simulado = True
    
    def autorizar_factura(self, factura):
        """
        Solicita autorización de factura a AFIP
        
        Args:
            factura: Objeto Factura
        
        Returns:
            dict: {'success': bool, 'cae': str, 'error': str}
        """
        if self.modo_simulado:
            return self._autorizar_simulado(factura)
        
        try:
            # Intentar usar integración real si está configurada
            if self.config and not self.modo_simulado:
                from .afip_service_real import AFIPServiceReal
                servicio_real = AFIPServiceReal(self.config)
                return servicio_real.autorizar_factura(factura)
            
            # Si no está configurado, usar modo simulado
            return {
                'success': False,
                'error': 'Integración AFIP no configurada. Modo simulado activo. Ver GUIA_AFIP_REAL.md'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _autorizar_simulado(self, factura):
        """Simulación de autorización AFIP para desarrollo"""
        from .models import Factura
        
        # Generar CAE simulado (14 dígitos)
        timestamp = datetime.now().strftime('%Y%m%d%H%M')
        cae_simulado = f"{timestamp}01"  # 14 caracteres
        
        # Vencimiento CAE: 10 días desde hoy
        vencimiento_cae = datetime.now().date() + timedelta(days=10)
        
        # Actualizar factura
        factura.cae = cae_simulado
        factura.cae_vencimiento = vencimiento_cae
        factura.fecha_proceso_afip = datetime.now()
        factura.resultado_afip = 'A'  # A = Aprobado
        factura.estado = Factura.Estado.AUTORIZADA
        
        # Generar datos QR
        factura.qr_data = self._generar_qr_data(factura)
        
        factura.save()
        
        return {
            'success': True,
            'cae': cae_simulado,
            'vencimiento': vencimiento_cae
        }
    
    def _generar_qr_data(self, factura):
        """
        Genera la URL para el código QR de AFIP
        
        Formato: https://www.afip.gob.ar/fe/qr/?p=...
        """
        from .models import ConfiguracionAFIP
        
        try:
            config = ConfiguracionAFIP.objects.first()
            if not config:
                return ""
            
            # Formato del QR según AFIP
            # Base64 de: {url}?p={base64_data}
            datos = {
                'ver': 1,
                'fecha': factura.fecha_emision.strftime('%Y-%m-%d'),
                'cuit': config.cuit_emisor,
                'ptoVta': factura.punto_venta.numero,
                'tipoCmp': self._get_codigo_afip_comprobante(factura.tipo_comprobante),
                'nroCmp': factura.numero,
                'importe': float(factura.total),
                'moneda': 'PES',
                'ctz': 1,
                'tipoDocRec': 80,  # CUIT
                'nroDocRec': factura.cliente_cuit.replace('-', ''),
                'tipoCodAut': 'E',  # E = CAE
                'codAut': factura.cae
            }
            
            # En producción, esto debe codificarse en base64
            import json
            return json.dumps(datos)
            
        except Exception:
            return ""
    
    def _get_codigo_afip_comprobante(self, tipo_comprobante):
        """Mapea tipo interno a código AFIP"""
        mapping = {
            'FA': 1,   # Factura A
            'FB': 6,   # Factura B
            'FC': 11,  # Factura C
            'NCA': 3,  # Nota de Crédito A
            'NCB': 8,  # Nota de Crédito B
            'NCC': 13, # Nota de Crédito C
        }
        return mapping.get(tipo_comprobante, 6)
    
    def obtener_token(self, config=None):
        """
        Obtiene token y sign de AFIP
        
        Args:
            config: ConfiguracionAFIP (opcional, usa self.config si no se pasa)
        
        Returns:
            dict: {'success': bool, 'error': str}
        """
        if not config:
            config = self.config
        
        if not config:
            return {
                'success': False,
                'error': 'No hay configuración AFIP disponible'
            }
        
        if self.modo_simulado:
            # Simular token
            config.token = f"TOKEN_SIMULADO_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            config.sign = f"SIGN_SIMULADO_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            config.token_expiracion = datetime.now() + timedelta(hours=12)
            config.save()
            
            return {
                'success': True,
                'mensaje': 'Token simulado generado (modo desarrollo)'
            }
        
        try:
            # Intentar usar integración real si está configurada
            if self.config and not self.modo_simulado:
                from .afip_service_real import AFIPServiceReal
                servicio_real = AFIPServiceReal(self.config)
                return servicio_real.obtener_token()
            
            # Si no está configurado, usar modo simulado
            return {
                'success': False,
                'error': 'Integración AFIP no configurada. Ver GUIA_AFIP_REAL.md'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def probar_conexion(self, config=None):
        """
        Prueba la conexión con AFIP
        
        Args:
            config: ConfiguracionAFIP (opcional, usa self.config si no se pasa)
        
        Returns:
            dict: {'success': bool, 'mensaje': str}
        """
        if not config:
            config = self.config
        
        if not config:
            return {
                'success': False,
                'mensaje': 'No hay configuración AFIP disponible'
            }
        
        if self.modo_simulado:
            return {
                'success': True,
                'mensaje': 'Modo simulado activo. Conexión OK (simulada)',
                'ambiente': config.get_ambiente_display(),
                'cuit': config.cuit_emisor
            }
        
        try:
            # Intentar usar integración real si está configurada
            if self.config and not self.modo_simulado:
                from .afip_service_real import AFIPServiceReal
                servicio_real = AFIPServiceReal(self.config)
                return servicio_real.probar_conexion()
            
            # Si no está configurado, usar modo simulado
            return {
                'success': False,
                'mensaje': 'Integración AFIP no configurada. Ver GUIA_AFIP_REAL.md'
            }
        except Exception as e:
            return {
                'success': False,
                'mensaje': f'Error: {str(e)}'
            }
