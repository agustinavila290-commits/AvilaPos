from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard/', views.resumen_dashboard, name='dashboard'),

    # Auxiliar — cajeros para filtros
    path('cajeros/', views.cajeros_list, name='cajeros-list'),

    # Reportes de ventas (existentes)
    path('ventas/periodo/', views.ventas_por_periodo, name='ventas-periodo'),
    path('ventas/periodo/export-excel/', views.export_ventas_periodo_excel, name='ventas-periodo-export-excel'),

    # Reportes de ventas (nuevos Fase 9)
    path('ventas/anuladas/', views.ventas_anuladas, name='ventas-anuladas'),
    path('ventas/anuladas/export-excel/', views.export_ventas_anuladas_excel, name='ventas-anuladas-export-excel'),
    path('ventas/descuentos/', views.descuentos_resumen, name='descuentos-resumen'),

    # Reportes de productos
    path('productos/mas-vendidos/', views.productos_mas_vendidos, name='productos-mas-vendidos'),
    path('productos/mas-vendidos/export-excel/', views.export_productos_mas_vendidos_excel, name='productos-mas-vendidos-export-excel'),
    path('productos/margen/', views.margen_por_producto, name='margen-por-producto'),

    # Reportes de inventario
    path('inventario/stock-critico/', views.stock_critico, name='stock-critico'),

    # Reportes de clientes
    path('clientes/<int:cliente_id>/historial/', views.historial_cliente, name='historial-cliente'),
    path('clientes/deuda/', views.clientes_deuda, name='clientes-deuda'),
    path('clientes/deuda/export-excel/', views.export_clientes_deuda_excel, name='clientes-deuda-export-excel'),

    # Reportes de compras (nuevos Fase 9)
    path('compras/por-proveedor/', views.compras_por_proveedor, name='compras-por-proveedor'),
    path('compras/por-proveedor/export-excel/', views.export_compras_proveedor_excel, name='compras-proveedor-export-excel'),
]
