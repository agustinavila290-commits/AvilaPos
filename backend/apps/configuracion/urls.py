from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'configuraciones', views.ConfiguracionViewSet, basename='configuracion')

urlpatterns = [
    path('pos/', views.ConfiguracionPOSView.as_view(), name='configuracion-pos'),
    path('', include(router.urls)),
]
