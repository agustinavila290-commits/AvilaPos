"""
Servicio de integración REAL con AFIP Web Services
Requiere: pip install pyafipws
"""
from datetime import datetime, timedelta
from decimal import Decimal
import os
import base64
import json


class AFIPServiceReal:
    """
    Servicio para integración REAL con AFIP usando pyafipws
    
    IMPORTANTE: Configurar certificados antes de usar
    """
    
    def __init__(self, config):
        """
        Inicializa el servicio con configuración AFIP
        
        Args:
            config: Objeto ConfiguracionAFIP
        """
        self.config = config
        self.modo_simulado = config.ambiente == 'H' and False  # Cambiar según necesidad
        
        # Rutas de certificados (ajustar según tu configuración)
        self.cert_path = None
        self.key_path = None
        
        # Si los certificados están en archivos de texto en la BD
        if config.certificado and config.clave_privada:
            self._guardar_certificados_temporales()
    
    def _guardar_certificados_temporales(self):
        """Guarda certificados desde BD a archivos temporales"""
        import tempfile
        
        # Crear directorio temporal para certificados
        cert_dir = os.path.join(tempfile.gettempdir(), 'afip_certs')
        os.makedirs(cert_dir, exist_ok=True)
        
        # Guardar certificado
        cert_file = os.path.join(cert_dir, f'cert_{self.config.id}.crt')
        with open(cert_file, 'w') as f:
            f.write(self.config.certificado)
        self.cert_path = cert_file
        
        # Guardar clave privada
        key_file = os.path.join(cert_dir, f'key_{self.config.id}.key')
        with open(key_file, 'w') as f:
            f.write(self.config.clave_privada)
        os.chmod(key_file, 0o600)  # Permisos restrictivos
        self.key_path = key_file
    
    def obtener_token(self):
        """
        Obtiene token y sign de AFIP usando WSAA
        
        Returns:
            dict: {'success': bool, 'token': str, 'sign': str, 'error': str}
        """
        try:
            from pyafipws.wsaa import WSAA
            
            # Configurar ambiente
            ambiente = 'homologacion' if self.config.ambiente == 'H' else 'produccion'
            wsaa_url = (
                'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl'
                if self.config.ambiente == 'H'
                else 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl'
            )
            
            # Crear instancia WSAA
            wsaa = WSAA()
            
            # Configurar certificado y clave
            if not self.cert_path or not self.key_path:
                return {
                    'success': False,
                    'error': 'Certificados no configurados'
                }

            # Compatibilidad pyafipws: la API de WSAA varía según versión/instalación.
            # Preferimos el flujo CreateTRA/SignTRA/LoginCMS (manual oficial).
            create_tra = (
                getattr(wsaa, 'CreateTRA', None) or
                getattr(wsaa, 'CrearTRA', None) or
                getattr(wsaa, 'CrearTra', None) or
                getattr(wsaa, 'CrearTRA', None)
            )
            sign_tra = (
                getattr(wsaa, 'SignTRA', None) or
                getattr(wsaa, 'SignarTRA', None) or
                getattr(wsaa, 'SignarTra', None)
            )
            login_cms = (
                getattr(wsaa, 'LoginCMS', None) or
                getattr(wsaa, 'LoginCms', None) or
                getattr(wsaa, 'LoginCMS', None)
            )

            if create_tra and sign_tra and login_cms:
                # Conectar a WSAA: distintas firmas según versión
                conectado = False
                # 1) Intentar firma (cache, wsaa_url)
                try:
                    wsaa.Conectar('', wsaa_url)
                    conectado = True
                except TypeError:
                    pass
                except Exception:
                    pass
                # 2) Intentar keyword ambiente (algunas builds)
                if not conectado:
                    try:
                        wsaa.Conectar(ambiente=ambiente)
                        conectado = True
                    except TypeError:
                        pass
                    except Exception:
                        pass
                # 3) Intentar posicional ambiente
                if not conectado:
                    try:
                        wsaa.Conectar(ambiente)
                        conectado = True
                    except Exception:
                        pass

                tra = create_tra("wsfe")
                cms = sign_tra(tra, self.cert_path, self.key_path)
                login_cms(cms)
            else:
                # Fallback: API antigua usada por algunas instalaciones (mantener compatibilidad)
                try:
                    wsaa.Conectar(ambiente=ambiente)
                except TypeError:
                    wsaa.Conectar(ambiente)
                if hasattr(wsaa, 'CargarCertificado'):
                    wsaa.CargarCertificado(self.cert_path, self.key_path)
                if hasattr(wsaa, 'CrearTra'):
                    wsaa.CrearTra()
                if hasattr(wsaa, 'GenerarTra'):
                    wsaa.GenerarTra()
                if hasattr(wsaa, 'SignarTra'):
                    wsaa.SignarTra()
                if hasattr(wsaa, 'LoginCMS'):
                    wsaa.LoginCMS()
            
            token = getattr(wsaa, 'Token', None) or getattr(wsaa, 'token', None)
            sign = getattr(wsaa, 'Sign', None) or getattr(wsaa, 'sign', None)
            if not token or not sign:
                attrs = [a for a in dir(wsaa) if a.lower() in ('token', 'sign', 'ta', 'ticket', 'cms')]
                raise AttributeError(
                    "WSAA no expuso Token/Sign luego de LoginCMS. "
                    f"Atributos relacionados: {attrs}"
                )
            
            # Guardar en configuración
            self.config.token = token
            self.config.sign = sign
            try:
                from django.utils import timezone
                now = timezone.now()
            except Exception:
                now = datetime.now()
            self.config.token_expiracion = now + timedelta(hours=12)
            self.config.save()
            
            return {
                'success': True,
                'token': token,
                'sign': sign,
                'expiracion': self.config.token_expiracion
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'pyafipws no instalado. Ejecutar: pip install pyafipws'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error obteniendo token: {str(e)}'
            }
    
    def autorizar_factura(self, factura):
        """
        Solicita autorización de factura a AFIP usando WSFEv1
        
        Args:
            factura: Objeto Factura
        
        Returns:
            dict: {'success': bool, 'cae': str, 'vencimiento': date, 'error': str}
        """
        try:
            # En PyAfipWs el cliente WSFE es wsfev1 (no wsfe)
            from pyafipws.wsfev1 import WSFEv1
            
            # Verificar token válido
            if not self.config.token or not self.config.sign:
                token_result = self.obtener_token()
                if not token_result['success']:
                    return {
                        'success': False,
                        'error': f"No se pudo obtener token: {token_result.get('error')}"
                    }
            
            # Verificar expiración de token
            try:
                from django.utils import timezone
                now = timezone.now()
            except Exception:
                now = datetime.now()
            if self.config.token_expiracion and self.config.token_expiracion < now:
                token_result = self.obtener_token()
                if not token_result['success']:
                    return {
                        'success': False,
                        'error': f"Token expirado y no se pudo renovar: {token_result.get('error')}"
                    }
            
            # Configurar ambiente
            ambiente = 'homologacion' if self.config.ambiente == 'H' else 'produccion'
            
            # Crear instancia WSFEv1
            wsfe = WSFEv1()
            # Compatibilidad: algunas versiones de pyafipws no aceptan keyword `ambiente`
            try:
                wsfe.Conectar(ambiente=ambiente)
            except TypeError:
                wsfe.Conectar(ambiente)
            
            # Configurar autenticación
            # Compatibilidad: según versión, SetTicketAcceso acepta (token, sign) o (ta_xml)
            try:
                wsfe.SetTicketAcceso(self.config.token, self.config.sign)
            except TypeError:
                # Alternativa 1: asignar atributos directos (muy común en pyafipws)
                if hasattr(wsfe, 'Token') and hasattr(wsfe, 'Sign'):
                    wsfe.Token = self.config.token
                    wsfe.Sign = self.config.sign
                else:
                    # Alternativa 2: intentar pasar un TA si estuviera disponible
                    ta = getattr(self.config, 'ta', None)  # por si existiera en alguna instalación
                    if not ta:
                        raise
                    wsfe.SetTicketAcceso(ta)
            wsfe.Cuit = self.config.cuit_emisor
            
            # Configurar punto de venta
            wsfe.PtoVta = factura.punto_venta.numero
            
            # Crear comprobante
            wsfe.CrearFactura()
            
            # Tipo de comprobante
            tipo_cbte = self._get_codigo_afip_comprobante(factura.tipo_comprobante)
            wsfe.CbteTipo = tipo_cbte
            
            # Número de comprobante
            wsfe.CbteNro = factura.numero
            
            # Fecha
            wsfe.FechaCbte = factura.fecha_emision.strftime('%Y%m%d')
            
            # Cliente
            # `Factura` no guarda tipo de documento explícito: asumir por defecto DNI (Consumidor Final)
            tipo_doc = getattr(factura, 'cliente_tipo_documento', None) or 'DNI'
            nro_doc_raw = (getattr(factura, 'cliente_cuit', None) or '').strip()
            nro_doc = ''.join(ch for ch in nro_doc_raw if ch.isdigit())
            # Si no hay documento válido, AFIP exige Consumidor Final (99) con doc 0
            if not nro_doc:
                wsfe.TipoDoc = 99
                wsfe.NroDoc = '0'
            else:
                wsfe.TipoDoc = self._get_tipo_documento(tipo_doc)
                wsfe.NroDoc = nro_doc
            
            # Totales
            total = Decimal(str(factura.total or 0))
            neto = Decimal(str(factura.subtotal or 0))
            iva = Decimal(str((factura.iva_105 or 0) + (factura.iva_21 or 0) + (factura.iva_27 or 0)))
            tot_conc = neto - iva
            wsfe.ImpTotal = float(total)
            wsfe.ImpTotConc = float(tot_conc if tot_conc > 0 else Decimal('0'))
            wsfe.ImpNeto = float(neto)
            wsfe.ImpOpEx = 0.0
            wsfe.ImpIVA = float(iva)
            wsfe.ImpTrib = float(Decimal(str(factura.otros_tributos or 0)))
            
            # IVA
            if factura.iva_105 > 0:
                wsfe.IVA = [
                    {
                        'Id': 4,  # 10.5%
                        'BaseImp': float(factura.subtotal),
                        'Importe': float(factura.iva_105)
                    }
                ]
            elif factura.iva_21 > 0:
                wsfe.IVA = [
                    {
                        'Id': 5,  # 21%
                        'BaseImp': float(factura.subtotal),
                        'Importe': float(factura.iva_21)
                    }
                ]
            elif factura.iva_27 > 0:
                wsfe.IVA = [
                    {
                        'Id': 6,  # 27%
                        'BaseImp': float(factura.subtotal),
                        'Importe': float(factura.iva_27)
                    }
                ]
            else:
                wsfe.IVA = []
            
            # Autorizar
            wsfe.CAESolicitar()
            
            # Verificar resultado
            if wsfe.Resultado == 'A':  # Aprobado
                # Actualizar factura
                factura.cae = str(wsfe.CAE)
                factura.cae_vencimiento = datetime.strptime(wsfe.Vencimiento, '%Y%m%d').date()
                try:
                    from django.utils import timezone
                    factura.fecha_proceso_afip = timezone.now()
                except Exception:
                    factura.fecha_proceso_afip = datetime.now()
                factura.resultado_afip = 'A'
                factura.estado = factura.Estado.AUTORIZADA
                factura.qr_data = self._generar_qr_data(factura, wsfe.CAE)
                factura.save()
                
                return {
                    'success': True,
                    'cae': str(wsfe.CAE),
                    'vencimiento': factura.cae_vencimiento,
                    'numero': wsfe.CbteNro
                }
            else:
                # Rechazado
                factura.resultado_afip = 'R'
                factura.observaciones_afip = wsfe.Obs
                factura.estado = factura.Estado.RECHAZADA
                factura.save()
                
                return {
                    'success': False,
                    'error': f"AFIP rechazó la factura: {wsfe.Obs}",
                    'observaciones': wsfe.Obs
                }
                
        except ImportError:
            return {
                'success': False,
                'error': 'pyafipws no instalado. Ejecutar: pip install pyafipws'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error autorizando factura: {str(e)}'
            }
    
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
    
    def _get_tipo_documento(self, tipo_doc):
        """Mapea tipo de documento a código AFIP"""
        mapping = {
            'CUIT': 80,
            'CUIL': 86,
            'CDI': 87,
            'LE': 89,
            'LC': 90,
            'DNI': 96,
        }
        return mapping.get(tipo_doc, 96)  # Default: DNI
    
    def _generar_qr_data(self, factura, cae):
        """Genera datos para código QR según formato AFIP"""
        try:
            tipo_doc = getattr(factura, 'cliente_tipo_documento', None) or 'DNI'
            datos = {
                'ver': 1,
                'fecha': factura.fecha_emision.strftime('%Y-%m-%d'),
                'cuit': self.config.cuit_emisor,
                'ptoVta': factura.punto_venta.numero,
                'tipoCmp': self._get_codigo_afip_comprobante(factura.tipo_comprobante),
                'nroCmp': factura.numero,
                'importe': float(factura.total),
                'moneda': 'PES',
                'ctz': 1,
                'tipoDocRec': self._get_tipo_documento(tipo_doc),
                'nroDocRec': factura.cliente_cuit.replace('-', '').replace('.', ''),
                'tipoCodAut': 'E',  # E = CAE
                'codAut': str(cae)
            }
            
            # Codificar en base64
            json_str = json.dumps(datos, separators=(',', ':'))
            base64_data = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
            
            # URL del QR
            qr_url = f"https://www.afip.gob.ar/fe/qr/?p={base64_data}"
            
            return qr_url
            
        except Exception:
            return ""
    
    def probar_conexion(self):
        """
        Prueba la conexión con AFIP
        
        Returns:
            dict: {'success': bool, 'mensaje': str}
        """
        try:
            token_result = self.obtener_token()
            
            if token_result['success']:
                return {
                    'success': True,
                    'mensaje': f'Conexión exitosa con AFIP {"Homologación" if self.config.ambiente == "H" else "Producción"}',
                    'ambiente': self.config.get_ambiente_display(),
                    'cuit': self.config.cuit_emisor,
                    'token_valido_hasta': self.config.token_expiracion.strftime('%Y-%m-%d %H:%M:%S') if self.config.token_expiracion else None
                }
            else:
                return {
                    'success': False,
                    'mensaje': f'Error de conexión: {token_result.get("error")}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'mensaje': f'Error probando conexión: {str(e)}'
            }
