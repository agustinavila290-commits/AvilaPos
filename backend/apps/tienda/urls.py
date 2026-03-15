from django.urls import path
from . import views

urlpatterns = [
    # Público
    path('productos/', views.productos_list),
    path('productos/<int:pk>/', views.producto_detail),
    path('categorias/', views.categorias_list),
    path('marcas/', views.marcas_list),
    path('puntos-retiro/', views.puntos_retiro_list),
    path('pedidos/', views.pedido_create),
    path('mercadopago/preferencia/', views.mercadopago_crear_preferencia),
    path('mercadopago/webhook/', views.mercadopago_webhook),
    # Admin (requiere auth)
    path('admin/pedidos/', views.admin_pedidos_list),
    path('admin/pedidos/<int:pk>/', views.admin_pedido_detail),
]
