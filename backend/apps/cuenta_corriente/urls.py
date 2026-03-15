from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tickets', views.TicketCuentaCorrienteViewSet, basename='ticket-cc')

urlpatterns = [
    path('', include(router.urls)),
]
