from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AuthViewSet, UsuarioViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    # JWT endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Router endpoints
    path('', include(router.urls)),
]
