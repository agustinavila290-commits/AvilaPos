"""
Vistas para integración Clover.
Endpoints: procesar pago, obtener config.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import ProcesarPagoCloverSerializer
from .services import CloverPayService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def procesar_pago_clover(request):
    """
    Procesa un pago con tarjeta vía dispositivo Clover.
    Body: { "monto": 1500.00, "descripcion": "Venta", "orden_id": "opcional" }
    """
    serializer = ProcesarPagoCloverSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    monto = serializer.validated_data['monto']
    descripcion = serializer.validated_data.get('descripcion') or 'Venta'
    orden_id = serializer.validated_data.get('orden_id')

    resultado = CloverPayService.procesar_pago(
        monto=monto,
        descripcion=descripcion,
        orden_id_externo=orden_id,
    )

    # Siempre 200: la solicitud se procesó; exito/error va en el body (evita 400 en consola cuando Clover no está configurado)
    return Response(resultado, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def config_clover(request):
    """Indica si Clover está configurado y activo (para mostrar/ocultar opción tarjeta con Clover)."""
    config = CloverPayService.get_config_activa()
    return Response({
        'activo': config is not None,
        'nombre': config.nombre if config else None,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def probar_conexion_clover(request):
    """
    Prueba la conexión con Clover (endpoint, credenciales, red).
    No crea órdenes ni procesa pagos.
    """
    resultado = CloverPayService.probar_conexion()
    return Response(resultado, status=status.HTTP_200_OK)
