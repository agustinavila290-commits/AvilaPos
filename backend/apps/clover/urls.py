from django.urls import path
from . import views

urlpatterns = [
    path('procesar-pago/', views.procesar_pago_clover),
    path('config/', views.config_clover),
]
