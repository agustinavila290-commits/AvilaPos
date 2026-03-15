from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Usuario"""
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'is_active', 'date_joined', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'date_joined', 'fecha_creacion']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'rol'
        ]
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        usuario = Usuario.objects.create(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para obtener tokens JWT con información del usuario"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Agregar información adicional del usuario al response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'rol': self.user.rol,
            'es_administrador': self.user.es_administrador,
            'es_cajero': self.user.es_cajero,
        }
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = (data.get('username') or '').strip()
        password = (data.get('password') or '')
        # No hacer strip a la contraseña para no romper si tiene espacios intencionales
        if not username:
            raise serializers.ValidationError('Debes proporcionar usuario y contraseña.')

        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Credenciales inválidas. Por favor verifica tu usuario y contraseña.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Esta cuenta ha sido desactivada.'
                )
            
            data['user'] = user
        else:
            raise serializers.ValidationError(
                'Debes proporcionar usuario y contraseña.'
            )

        return data
