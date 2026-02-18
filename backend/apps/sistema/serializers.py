from rest_framework import serializers
from .models import BackupLog, AuditLog


class BackupLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de backup"""
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    tamanio_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = BackupLog
        fields = [
            'id', 'fecha', 'estado', 'archivo', 'tamanio', 'tamanio_mb',
            'duracion', 'error', 'usuario', 'usuario_nombre'
        ]
        read_only_fields = ['id', 'fecha']
    
    def get_tamanio_mb(self, obj):
        """Retorna tamaño en MB"""
        if obj.tamanio:
            return round(obj.tamanio / (1024 * 1024), 2)
        return None


class BackupInfoSerializer(serializers.Serializer):
    """Serializer para información de backups disponibles"""
    nombre = serializers.CharField()
    tamanio = serializers.IntegerField()
    tamanio_mb = serializers.SerializerMethodField()
    fecha = serializers.DateTimeField()
    ruta = serializers.CharField()
    
    def get_tamanio_mb(self, obj):
        return round(obj['tamanio'] / (1024 * 1024), 2)


class EstadisticasBackupSerializer(serializers.Serializer):
    """Serializer para estadísticas de backups"""
    total_backups = serializers.IntegerField()
    tamanio_total = serializers.IntegerField()
    tamanio_total_mb = serializers.SerializerMethodField()
    ultimo_backup = serializers.DateTimeField(allow_null=True)
    backups_exitosos = serializers.IntegerField()
    backups_fallidos = serializers.IntegerField()
    
    def get_tamanio_total_mb(self, obj):
        return round(obj['tamanio_total'] / (1024 * 1024), 2)


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de auditoría"""
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    modelo = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'fecha', 'usuario', 'usuario_nombre', 'accion',
            'descripcion', 'modelo', 'object_id',
            'datos_anteriores', 'datos_nuevos',
            'ip_address', 'user_agent'
        ]
        read_only_fields = fields
    
    def get_modelo(self, obj):
        """Retorna el nombre del modelo afectado"""
        if obj.content_type:
            return obj.content_type.model
        return None
