"""
Utilidades de permisos compartidas entre aplicaciones.
"""
from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso que permite al propietario del objeto o a un administrador realizar la acción.
    """
    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.es_administrador:
            return True
        
        # Verificar si el objeto tiene un campo 'usuario' que coincida con el usuario actual
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        
        # Verificar si el objeto es el mismo usuario
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class ReadOnly(permissions.BasePermission):
    """
    Permiso de solo lectura para cualquier usuario autenticado.
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
