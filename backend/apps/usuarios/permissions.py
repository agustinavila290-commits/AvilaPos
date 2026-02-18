"""
Sistema de permisos personalizados
"""
from rest_framework.permissions import BasePermission


class IsAdministrador(BasePermission):
    """
    Permission que verifica si el usuario es administrador
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.es_administrador or request.user.is_superuser)
        )


class IsCajero(BasePermission):
    """
    Permission que verifica si el usuario es cajero o administrador
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.es_cajero or request.user.es_administrador or request.user.is_superuser)
        )


class TienePermiso(BasePermission):
    """
    Permission class que verifica si el usuario tiene un permiso específico
    
    Uso en ViewSets:
        permission_classes = [TienePermiso]
        permiso_requerido = 'ventas.crear'
    """
    
    def has_permission(self, request, view):
        # Si no hay usuario autenticado, denegar
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Obtener permiso requerido del view
        permiso_requerido = getattr(view, 'permiso_requerido', None)
        
        if not permiso_requerido:
            # Si no hay permiso especificado, permitir
            return True
        
        # Verificar permiso
        return request.user.tiene_permiso(permiso_requerido)


# Códigos de permisos predefinidos
PERMISOS_SISTEMA = {
    # VENTAS
    'ventas.crear': {
        'nombre': 'Crear Ventas',
        'descripcion': 'Permite crear nuevas ventas',
        'modulo': 'Ventas'
    },
    'ventas.ver': {
        'nombre': 'Ver Ventas',
        'descripcion': 'Permite ver el listado de ventas',
        'modulo': 'Ventas'
    },
    'ventas.anular': {
        'nombre': 'Anular Ventas',
        'descripcion': 'Permite anular ventas completadas',
        'modulo': 'Ventas'
    },
    'ventas.descuentos': {
        'nombre': 'Aplicar Descuentos',
        'descripcion': 'Permite aplicar descuentos en ventas',
        'modulo': 'Ventas'
    },
    
    # COMPRAS
    'compras.crear': {
        'nombre': 'Crear Compras',
        'descripcion': 'Permite registrar nuevas compras',
        'modulo': 'Compras'
    },
    'compras.ver': {
        'nombre': 'Ver Compras',
        'descripcion': 'Permite ver el listado de compras',
        'modulo': 'Compras'
    },
    'compras.anular': {
        'nombre': 'Anular Compras',
        'descripcion': 'Permite anular compras',
        'modulo': 'Compras'
    },
    
    # PRODUCTOS
    'productos.crear': {
        'nombre': 'Crear Productos',
        'descripcion': 'Permite crear nuevos productos',
        'modulo': 'Productos'
    },
    'productos.editar': {
        'nombre': 'Editar Productos',
        'descripcion': 'Permite editar productos existentes',
        'modulo': 'Productos'
    },
    'productos.eliminar': {
        'nombre': 'Eliminar Productos',
        'descripcion': 'Permite eliminar productos',
        'modulo': 'Productos'
    },
    'productos.ver_costos': {
        'nombre': 'Ver Costos',
        'descripcion': 'Permite ver costos de productos',
        'modulo': 'Productos'
    },
    
    # CLIENTES
    'clientes.crear': {
        'nombre': 'Crear Clientes',
        'descripcion': 'Permite crear nuevos clientes',
        'modulo': 'Clientes'
    },
    'clientes.editar': {
        'nombre': 'Editar Clientes',
        'descripcion': 'Permite editar clientes existentes',
        'modulo': 'Clientes'
    },
    'clientes.eliminar': {
        'nombre': 'Eliminar Clientes',
        'descripcion': 'Permite eliminar clientes',
        'modulo': 'Clientes'
    },
    
    # INVENTARIO
    'inventario.ver': {
        'nombre': 'Ver Inventario',
        'descripcion': 'Permite ver el inventario',
        'modulo': 'Inventario'
    },
    'inventario.ajustar': {
        'nombre': 'Ajustar Stock',
        'descripcion': 'Permite hacer ajustes manuales de stock',
        'modulo': 'Inventario'
    },
    'inventario.transferir': {
        'nombre': 'Transferir Stock',
        'descripcion': 'Permite transferir stock entre depósitos',
        'modulo': 'Inventario'
    },
    
    # REPORTES
    'reportes.ver': {
        'nombre': 'Ver Reportes',
        'descripcion': 'Permite acceder a reportes del sistema',
        'modulo': 'Reportes'
    },
    'reportes.exportar': {
        'nombre': 'Exportar Reportes',
        'descripcion': 'Permite exportar reportes a Excel/PDF',
        'modulo': 'Reportes'
    },
    
    # CONFIGURACIÓN
    'configuracion.ver': {
        'nombre': 'Ver Configuración',
        'descripcion': 'Permite ver configuración del sistema',
        'modulo': 'Configuración'
    },
    'configuracion.editar': {
        'nombre': 'Editar Configuración',
        'descripcion': 'Permite modificar configuración del sistema',
        'modulo': 'Configuración'
    },
    
    # USUARIOS
    'usuarios.crear': {
        'nombre': 'Crear Usuarios',
        'descripcion': 'Permite crear nuevos usuarios',
        'modulo': 'Usuarios'
    },
    'usuarios.editar': {
        'nombre': 'Editar Usuarios',
        'descripcion': 'Permite editar usuarios existentes',
        'modulo': 'Usuarios'
    },
    'usuarios.eliminar': {
        'nombre': 'Eliminar Usuarios',
        'descripcion': 'Permite eliminar usuarios',
        'modulo': 'Usuarios'
    },
    'usuarios.ver_permisos': {
        'nombre': 'Ver Permisos',
        'descripcion': 'Permite ver y gestionar permisos de usuarios',
        'modulo': 'Usuarios'
    },
    
    # SISTEMA
    'sistema.backups': {
        'nombre': 'Gestionar Backups',
        'descripcion': 'Permite crear y restaurar backups',
        'modulo': 'Sistema'
    },
    'sistema.audit_logs': {
        'nombre': 'Ver Logs de Auditoría',
        'descripcion': 'Permite ver logs de auditoría del sistema',
        'modulo': 'Sistema'
    },
}


# Permisos por rol predefinidos
PERMISOS_POR_ROL = {
    'VENDEDOR': [
        'ventas.crear',
        'ventas.ver',
        'clientes.crear',
        'clientes.ver',
        'productos.ver',
        'inventario.ver',
    ],
    'CAJERO': [
        'ventas.crear',
        'ventas.ver',
        'ventas.descuentos',
        'clientes.ver',
        'productos.ver',
    ],
    'DEPOSITO': [
        'inventario.ver',
        'inventario.ajustar',
        'inventario.transferir',
        'compras.ver',
        'productos.ver',
    ],
    'SUPERVISOR': [
        'ventas.crear',
        'ventas.ver',
        'ventas.anular',
        'ventas.descuentos',
        'compras.ver',
        'clientes.crear',
        'clientes.editar',
        'productos.ver',
        'productos.editar',
        'inventario.ver',
        'inventario.ajustar',
        'reportes.ver',
        'reportes.exportar',
    ],
    'ADMIN': ['*'],  # Todos los permisos
}
