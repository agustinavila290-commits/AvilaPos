from django.urls import path
from . import views

urlpatterns = [
    path('productos-stock/', views.productos_stock),
    path('pedido-recibido/', views.pedido_recibido),
    path('webhook-pedido/', views.webhook_pedido_woocommerce),
]
