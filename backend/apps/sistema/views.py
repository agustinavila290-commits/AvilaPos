from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.http import FileResponse
from .models import BackupLog, AuditLog
from .serializers import (
    BackupLogSerializer,
    BackupInfoSerializer,
    EstadisticasBackupSerializer,
    AuditLogSerializer
)
from .backup_manager import BackupManager
from .excel_export import ExcelExporter
from apps.ventas.models import Venta
from apps.compras.models import Compra
from apps.clientes.models import Cliente
from apps.productos.models import VarianteProducto
from apps.inventario.models import Stock


class BackupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gestión de backups
    
    Endpoints:
    - GET /backups/ - Listar logs de backups
    - POST /backups/crear/ - Crear nuevo backup
    - GET /backups/listar_archivos/ - Listar archivos de backup
    - POST /backups/restaurar/ - Restaurar backup
    - DELETE /backups/eliminar/ - Eliminar backup
    - GET /backups/estadisticas/ - Estadísticas
    - GET /backups/{id}/descargar/ - Descargar backup
    """
    queryset = BackupLog.objects.all()
    serializer_class = BackupLogSerializer
    permission_classes = [IsAdminUser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.backup_manager = BackupManager()
    
    @action(detail=False, methods=['post'])
    def crear(self, request):
        """Crear un nuevo backup"""
        usuario = request.user
        
        success, mensaje, backup_log = self.backup_manager.crear_backup(usuario=usuario)
        
        if success:
            serializer = BackupLogSerializer(backup_log)
            return Response({
                'success': True,
                'mensaje': mensaje,
                'backup': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'mensaje': mensaje
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def listar_archivos(self, request):
        """Listar todos los archivos de backup disponibles"""
        backups = self.backup_manager.listar_backups()
        serializer = BackupInfoSerializer(backups, many=True)
        
        return Response({
            'count': len(backups),
            'backups': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def restaurar(self, request):
        """Restaurar un backup"""
        filename = request.data.get('filename')
        
        if not filename:
            return Response({
                'success': False,
                'mensaje': 'Debe proporcionar el nombre del archivo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        success, mensaje = self.backup_manager.restaurar_backup(
            filename=filename,
            usuario=request.user
        )
        
        if success:
            return Response({
                'success': True,
                'mensaje': mensaje
            })
        else:
            return Response({
                'success': False,
                'mensaje': mensaje
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['delete'])
    def eliminar(self, request):
        """Eliminar un archivo de backup"""
        filename = request.data.get('filename')
        
        if not filename:
            return Response({
                'success': False,
                'mensaje': 'Debe proporcionar el nombre del archivo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        success, mensaje = self.backup_manager.eliminar_backup(filename)
        
        if success:
            return Response({
                'success': True,
                'mensaje': mensaje
            })
        else:
            return Response({
                'success': False,
                'mensaje': mensaje
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de backups"""
        stats = self.backup_manager.estadisticas()
        serializer = EstadisticasBackupSerializer(stats)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        """Descargar un archivo de backup"""
        backup_log = self.get_object()
        
        if not backup_log.archivo:
            return Response({
                'success': False,
                'mensaje': 'No hay archivo asociado a este backup'
            }, status=status.HTTP_404_NOT_FOUND)
        
        filepath = self.backup_manager.backup_dir / backup_log.archivo
        
        if not filepath.exists():
            return Response({
                'success': False,
                'mensaje': 'Archivo de backup no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return FileResponse(
            open(filepath, 'rb'),
            as_attachment=True,
            filename=backup_log.archivo
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consulta de logs de auditoría
    
    Endpoints:
    - GET /audit-logs/ - Listar logs con filtros
    - GET /audit-logs/{id}/ - Detalle de un log
    - GET /audit-logs/estadisticas/ - Estadísticas de acciones
    """
    queryset = AuditLog.objects.select_related('usuario', 'content_type').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['accion', 'usuario']
    search_fields = ['descripcion', 'usuario__username']
    ordering_fields = ['fecha', 'accion']
    ordering = ['-fecha']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por fecha desde
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha__date__gte=fecha_desde)
        
        # Filtro por fecha hasta
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha__date__lte=fecha_hasta)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de logs de auditoría"""
        from django.db.models import Count
        
        # Contar por tipo de acción
        por_accion = AuditLog.objects.values('accion').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Últimas acciones por usuario
        por_usuario = AuditLog.objects.values(
            'usuario__username'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:10]
        
        return Response({
            'total_logs': AuditLog.objects.count(),
            'por_accion': list(por_accion),
            'por_usuario': list(por_usuario)
        })


# ============ ENDPOINTS DE EXPORTACIÓN ============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def exportar_ventas_excel(request):
    """Exporta ventas a Excel"""
    # Filtros opcionales
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')
    
    ventas = Venta.objects.select_related('cliente', 'usuario').all()
    
    if fecha_desde:
        ventas = ventas.filter(fecha__date__gte=fecha_desde)
    if fecha_hasta:
        ventas = ventas.filter(fecha__date__lte=fecha_hasta)
    
    ventas = ventas.order_by('-fecha')
    
    exporter = ExcelExporter()
    return exporter.exportar_ventas(ventas)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def exportar_productos_excel(request):
    """Exporta productos a Excel"""
    variantes = VarianteProducto.objects.select_related('producto').filter(
        estado='ACTIVO'
    ).order_by('producto__nombre', 'nombre')
    
    exporter = ExcelExporter()
    return exporter.exportar_productos(variantes)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def exportar_clientes_excel(request):
    """Exporta clientes a Excel"""
    clientes = Cliente.objects.filter(activo=True).order_by('nombre_completo')
    
    exporter = ExcelExporter()
    return exporter.exportar_clientes(clientes)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def exportar_inventario_excel(request):
    """Exporta inventario a Excel"""
    stocks = Stock.objects.select_related(
        'variante', 'variante__producto', 'deposito'
    ).all().order_by('deposito__nombre', 'variante__producto__nombre')
    
    exporter = ExcelExporter()
    return exporter.exportar_inventario(stocks)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def exportar_compras_excel(request):
    """Exporta compras a Excel"""
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')
    
    compras = Compra.objects.select_related('proveedor', 'usuario').all()
    
    if fecha_desde:
        compras = compras.filter(fecha__date__gte=fecha_desde)
    if fecha_hasta:
        compras = compras.filter(fecha__date__lte=fecha_hasta)
    
    compras = compras.order_by('-fecha')
    
    exporter = ExcelExporter()
    return exporter.exportar_compras(compras)
