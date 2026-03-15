"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.usuarios.urls')),
    path('api/clientes/', include('apps.clientes.urls')),
    path('api/productos/', include('apps.productos.urls')),
    path('api/inventario/', include('apps.inventario.urls')),
    path('api/ventas/', include('apps.ventas.urls')),
    path('api/compras/', include('apps.compras.urls')),
    path('api/reportes/', include('apps.reportes.urls')),
    path('api/configuracion/', include('apps.configuracion.urls')),
    path('api/devoluciones/', include('apps.devoluciones.urls')),
    path('api/cuenta-corriente/', include('apps.cuenta_corriente.urls')),
    path('api/sistema/', include('apps.sistema.urls')),
    path('api/facturacion/', include('apps.facturacion.urls')),
    path('api/clover/', include('apps.clover.urls')),
    path('api/woocommerce/', include('apps.woocommerce.urls')),
    path('api/tienda/', include('apps.tienda.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Personalizar admin
admin.site.site_header = 'Casa de Repuestos - Administración'
admin.site.site_title = 'Casa de Repuestos'
admin.site.index_title = 'Panel de Administración'
