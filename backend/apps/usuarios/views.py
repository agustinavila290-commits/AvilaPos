from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import logout

from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    CustomTokenObtainPairSerializer,
    LoginSerializer
)
from .permissions import IsAdministrador


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtener tokens JWT"""
    serializer_class = CustomTokenObtainPairSerializer


class AuthViewSet(viewsets.GenericViewSet):
    """ViewSet para operaciones de autenticación"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        Login de usuario.
        Retorna tokens JWT y información del usuario.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol,
                'es_administrador': user.es_administrador,
                'es_cajero': user.es_cajero,
            }
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """
        Logout de usuario.
        Invalida el refresh token.
        """
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logout(request)
            return Response({
                'message': 'Sesión cerrada exitosamente.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Error al cerrar sesión.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Obtiene la información del usuario autenticado actual.
        """
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios (solo administradores)"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer
    
    def get_queryset(self):
        """Filtrar usuarios por rol si se especifica"""
        queryset = super().get_queryset()
        rol = self.request.query_params.get('rol', None)
        
        if rol:
            queryset = queryset.filter(rol=rol)
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar usuario"""
        usuario = self.get_object()
        usuario.is_active = not usuario.is_active
        usuario.save()
        
        serializer = self.get_serializer(usuario)
        return Response(serializer.data)
