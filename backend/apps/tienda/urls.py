from django.urls import path
from . import views

urlpatterns = [
    # Catálogo (público)
    path('productos/', views.productos_list),
    path('productos/<int:pk>/', views.producto_detail),
    path('categorias/', views.categorias_list),
    path('marcas/', views.marcas_list),
    path('modelos-moto/', views.modelos_moto_list),
    path('puntos-retiro/', views.puntos_retiro_list),
    # Pedidos (público, pero enlaza al cliente si está logueado)
    path('pedidos/', views.pedido_create),
    # Mercado Pago
    path('mercadopago/preferencia/', views.mercadopago_crear_preferencia),
    path('mercadopago/webhook/', views.mercadopago_webhook),
    # Auth de clientes web
    path('auth/registro/', views.auth_registro),
    path('auth/login/', views.auth_login),
    path('auth/google/', views.auth_google),
    path('auth/me/', views.auth_me),
    path('mis-pedidos/', views.mis_pedidos),
    # Admin POS (requiere auth de staff Django)
    path('admin/pedidos/', views.admin_pedidos_list),
    path('admin/pedidos/<int:pk>/', views.admin_pedido_detail),
    # POS — compatibilidad por moto
    path('modelos-moto/<int:moto_id>/productos/', views.productos_por_moto),
]
