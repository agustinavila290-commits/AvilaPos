from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PuntoVentaViewSet, FacturaViewSet, ConfiguracionAFIPViewSet

router = DefaultRouter()
router.register(r'puntos-venta', PuntoVentaViewSet, basename='punto-venta')
router.register(r'facturas', FacturaViewSet, basename='factura')
router.register(r'configuracion-afip', ConfiguracionAFIPViewSet, basename='configuracion-afip')

urlpatterns = [
    path('', include(router.urls)),
]
