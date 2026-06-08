from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .presupuesto_views import PresupuestoViewSet

router = DefaultRouter()
router.register(r'ventas', views.VentaViewSet, basename='venta')
router.register(r'presupuestos', PresupuestoViewSet, basename='presupuesto')

urlpatterns = [
    path('', include(router.urls)),
]
