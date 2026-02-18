from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'depositos', views.DepositoViewSet, basename='deposito')
router.register(r'stocks', views.StockViewSet, basename='stock')
router.register(r'movimientos', views.MovimientoStockViewSet, basename='movimiento')

urlpatterns = [
    path('', include(router.urls)),
]
