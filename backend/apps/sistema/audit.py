"""
Utilidades para registro de auditoría
"""
from .models import AuditLog


class AuditLogger:
    """Helper para registrar acciones en el log de auditoría"""
    
    @staticmethod
    def log(usuario, accion, descripcion, objeto=None, datos_anteriores=None, 
            datos_nuevos=None, ip_address=None, user_agent=None):
        """
        Registra una acción en el log de auditoría
        
        Args:
            usuario: Usuario que realiza la acción
            accion: Tipo de acción (AuditLog.AccionChoices)
            descripcion: Descripción textual de la acción
            objeto: Objeto del modelo afectado (opcional)
            datos_anteriores: Dict con datos antes del cambio
            datos_nuevos: Dict con datos después del cambio
            ip_address: IP del usuario
            user_agent: User agent del navegador
        
        Returns:
            AuditLog: Registro creado
        """
        return AuditLog.objects.create(
            usuario=usuario,
            accion=accion,
            descripcion=descripcion,
            objeto=objeto,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_venta(usuario, venta, request=None):
        """Registra una venta"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.VENTA,
            descripcion=f"Venta #{venta.numero} - Total: ${venta.total} - Cliente: {venta.cliente.nombre_completo}",
            objeto=venta,
            datos_nuevos={
                'numero': venta.numero,
                'total': str(venta.total),
                'cliente': venta.cliente.nombre_completo,
                'metodo_pago': venta.metodo_pago
            },
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
    
    @staticmethod
    def log_compra(usuario, compra, request=None):
        """Registra una compra"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.COMPRA,
            descripcion=f"Compra #{compra.numero} - Total: ${compra.total} - Proveedor: {compra.proveedor.nombre}",
            objeto=compra,
            datos_nuevos={
                'numero': compra.numero,
                'total': str(compra.total),
                'proveedor': compra.proveedor.nombre
            },
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
    
    @staticmethod
    def log_ajuste_stock(usuario, movimiento, request=None):
        """Registra un ajuste manual de stock"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.AJUSTE_STOCK,
            descripcion=f"Ajuste de stock - {movimiento.variante.nombre_completo} - {movimiento.tipo_movimiento}",
            objeto=movimiento,
            datos_nuevos={
                'variante': movimiento.variante.nombre_completo,
                'cantidad': movimiento.cantidad,
                'tipo': movimiento.tipo_movimiento
            },
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
    
    @staticmethod
    def log_anulacion(usuario, venta, motivo, request=None):
        """Registra una anulación de venta"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.ANULACION,
            descripcion=f"Anulación Venta #{venta.numero} - Motivo: {motivo}",
            objeto=venta,
            datos_anteriores={
                'estado': 'COMPLETADA',
                'total': str(venta.total)
            },
            datos_nuevos={
                'estado': 'ANULADA',
                'motivo': motivo
            },
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
    
    @staticmethod
    def log_login(usuario, request=None):
        """Registra un inicio de sesión"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.LOGIN,
            descripcion=f"Inicio de sesión: {usuario.username}",
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
    
    @staticmethod
    def log_logout(usuario, request=None):
        """Registra un cierre de sesión"""
        return AuditLogger.log(
            usuario=usuario,
            accion=AuditLog.AccionChoices.LOGOUT,
            descripcion=f"Cierre de sesión: {usuario.username}",
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )


def get_client_ip(request):
    """Obtiene la IP del cliente desde el request"""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Obtiene el user agent del cliente"""
    if not request:
        return None
    
    return request.META.get('HTTP_USER_AGENT', '')
