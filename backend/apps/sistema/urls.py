from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BackupViewSet,
    AuditLogViewSet,
    exportar_ventas_excel,
    exportar_productos_excel,
    exportar_clientes_excel,
    exportar_inventario_excel,
    exportar_compras_excel
)

router = DefaultRouter()
router.register(r'backups', BackupViewSet, basename='backup')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    
    # Exportaciones Excel
    path('export/ventas/', exportar_ventas_excel, name='exportar-ventas'),
    path('export/productos/', exportar_productos_excel, name='exportar-productos'),
    path('export/clientes/', exportar_clientes_excel, name='exportar-clientes'),
    path('export/inventario/', exportar_inventario_excel, name='exportar-inventario'),
    path('export/compras/', exportar_compras_excel, name='exportar-compras'),
]
