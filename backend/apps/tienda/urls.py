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
    path('pedidos/<int:numero>/estado/', views.pedido_status),
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
    path('admin/pedidos/<int:pk>/estado/', views.admin_pedido_estado),
    # POS — compatibilidad por moto (lectura)
    path('modelos-moto/<int:moto_id>/productos/', views.productos_por_moto),
    # Gestión de modelos de moto (admin POS)
    path('admin/motos/', views.motos_crud),
    path('admin/motos/importar/', views.motos_importar_excel),
    path('admin/motos/<int:moto_id>/', views.moto_detail),
    path('admin/motos/<int:moto_id>/toggle/', views.moto_toggle_activo),
    # Compatibilidad producto ↔ moto
    path('admin/productos/<int:producto_base_id>/motos/', views.producto_motos_compat),
    path('admin/productos/<int:producto_base_id>/motos/asignar/', views.asignar_moto_producto),
    path('admin/productos/<int:producto_base_id>/motos/<int:moto_id>/', views.quitar_moto_producto),
    path('admin/motos/asignar-masivo/', views.asignar_moto_masivo),
]
