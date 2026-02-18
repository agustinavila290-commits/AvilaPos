from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'proveedores', views.ProveedorViewSet, basename='proveedor')
router.register(r'compras', views.CompraViewSet, basename='compra')

urlpatterns = [
    path('', include(router.urls)),
]
