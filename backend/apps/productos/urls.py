from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarcaViewSet, CategoriaViewSet, ProductoBaseViewSet, VarianteProductoViewSet

router = DefaultRouter()
router.register(r'marcas', MarcaViewSet, basename='marcas')
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'productos', ProductoBaseViewSet, basename='productos')
router.register(r'variantes', VarianteProductoViewSet, basename='variantes')

urlpatterns = [
    path('', include(router.urls)),
]
