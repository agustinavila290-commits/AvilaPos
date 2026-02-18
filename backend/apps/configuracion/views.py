"""
Views para configuración del sistema.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Configuracion, ConfiguracionManager
from .serializers import (
    ConfiguracionSerializer,
    ConfiguracionUpdateSerializer,
    ConfiguracionBulkUpdateSerializer
)
from apps.usuarios.permissions import IsAdministrador

# Claves que el POS puede leer (cualquier usuario autenticado)
POS_CONFIG_KEYS = [
    'CLIENTE_OBLIGATORIO',
    'DESCUENTO_MAX_CAJERO',
    'DESCUENTO_MAX_ADMIN',
    'ALERTAR_MARGEN_BAJO',
]


class ConfiguracionPOSView(APIView):
    """
    Devuelve solo las configuraciones necesarias para el Punto de Venta.
    Cualquier usuario autenticado puede leer (cajeros, admin).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = {}
        for clave in POS_CONFIG_KEYS:
            result[clave] = ConfiguracionManager.obtener(clave)
        return Response(result)


class ConfiguracionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de configuraciones del sistema.
    Solo administradores pueden modificar.
    """
    queryset = Configuracion.objects.all()
    serializer_class = ConfiguracionSerializer
    permission_classes = [IsAuthenticated, IsAdministrador]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'tipo_dato', 'es_editable']
    search_fields = ['clave', 'descripcion']
    ordering_fields = ['categoria', 'clave', 'fecha_modificacion']
    ordering = ['categoria', 'clave']
    
    @action(detail=True, methods=['patch'])
    def actualizar_valor(self, request, pk=None):
        """
        Actualiza solo el valor de una configuración.
        Más simple que un update completo.
        """
        configuracion = self.get_object()
        
        if not configuracion.es_editable:
            return Response(
                {'error': 'Este parámetro no es editable'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ConfiguracionUpdateSerializer(
            data=request.data,
            context={'configuracion': configuracion}
        )
        serializer.is_valid(raise_exception=True)
        
        configuracion.valor = serializer.validated_data['valor']
        configuracion.save()
        
        output_serializer = ConfiguracionSerializer(configuracion)
        return Response(output_serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """
        Obtiene todas las configuraciones agrupadas por categoría.
        """
        categoria = request.query_params.get('categoria')
        
        if not categoria:
            return Response(
                {'error': 'Se requiere el parámetro categoria'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        configs = self.get_queryset().filter(categoria=categoria)
        serializer = self.get_serializer(configs, many=True)
        
        return Response({
            'categoria': categoria,
            'configuraciones': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def categorias(self, request):
        """
        Lista todas las categorías disponibles.
        """
        categorias = Configuracion.objects.values_list(
            'categoria', flat=True
        ).distinct().order_by('categoria')
        
        return Response({
            'categorias': list(categorias)
        })
    
    @action(detail=False, methods=['post'])
    def actualizar_multiple(self, request):
        """
        Actualiza múltiples configuraciones a la vez.
        Body: {"configuraciones": {"clave1": "valor1", "clave2": "valor2"}}
        """
        serializer = ConfiguracionBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        configuraciones_data = serializer.validated_data['configuraciones']
        resultados = []
        errores = []
        
        for clave, valor in configuraciones_data.items():
            try:
                config = Configuracion.objects.get(clave=clave)
                
                if not config.es_editable:
                    errores.append({
                        'clave': clave,
                        'error': 'No es editable'
                    })
                    continue
                
                # Validar el valor
                config_serializer = ConfiguracionUpdateSerializer(
                    data={'valor': valor},
                    context={'configuracion': config}
                )
                config_serializer.is_valid(raise_exception=True)
                
                config.valor = valor
                config.save()
                
                resultados.append({
                    'clave': clave,
                    'valor': valor,
                    'status': 'actualizado'
                })
                
            except Configuracion.DoesNotExist:
                errores.append({
                    'clave': clave,
                    'error': 'Configuración no encontrada'
                })
            except Exception as e:
                errores.append({
                    'clave': clave,
                    'error': str(e)
                })
        
        return Response({
            'actualizados': resultados,
            'errores': errores
        })
    
    @action(detail=False, methods=['get'])
    def obtener_valor(self, request):
        """
        Obtiene el valor convertido de una configuración específica.
        """
        clave = request.query_params.get('clave')
        
        if not clave:
            return Response(
                {'error': 'Se requiere el parámetro clave'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            config = Configuracion.objects.get(clave=clave)
            return Response({
                'clave': clave,
                'valor': config.get_valor_convertido(),
                'tipo_dato': config.tipo_dato,
                'descripcion': config.descripcion
            })
        except Configuracion.DoesNotExist:
            return Response(
                {'error': 'Configuración no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
