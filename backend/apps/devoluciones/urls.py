"""
URLs para devoluciones.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'devoluciones', views.DevolucionVentaViewSet, basename='devolucion')
router.register(r'notas-credito', views.NotaCreditoViewSet, basename='nota-credito')

urlpatterns = [
    path('', include(router.urls)),
]
