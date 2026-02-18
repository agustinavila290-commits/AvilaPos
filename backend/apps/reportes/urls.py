from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard/', views.resumen_dashboard, name='dashboard'),
    
    # Reportes de ventas
    path('ventas/periodo/', views.ventas_por_periodo, name='ventas-periodo'),
    path('ventas/periodo/export-excel/', views.export_ventas_periodo_excel, name='ventas-periodo-export-excel'),
    
    # Reportes de productos
    path('productos/mas-vendidos/', views.productos_mas_vendidos, name='productos-mas-vendidos'),
    path('productos/mas-vendidos/export-excel/', views.export_productos_mas_vendidos_excel, name='productos-mas-vendidos-export-excel'),
    path('productos/margen/', views.margen_por_producto, name='margen-por-producto'),
    
    # Reportes de inventario
    path('inventario/stock-critico/', views.stock_critico, name='stock-critico'),
    
    # Reportes de clientes
    path('clientes/<int:cliente_id>/historial/', views.historial_cliente, name='historial-cliente'),
]
