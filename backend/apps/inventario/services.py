"""
Servicios para gestión de inventario.
Lógica de negocio centralizada para movimientos de stock.
"""
from django.db import transaction
from .models import Stock, MovimientoStock, Deposito


class InventarioService:
    """Servicio para gestionar movimientos de stock"""
    
    @staticmethod
    def obtener_o_crear_stock(variante, deposito):
        """Obtiene o crea el registro de stock para una variante en un depósito"""
        stock, created = Stock.objects.get_or_create(
            variante=variante,
            deposito=deposito,
            defaults={'cantidad': 0}
        )
        return stock
    
    @staticmethod
    @transaction.atomic
    def registrar_movimiento(
        variante,
        deposito,
        tipo_movimiento,
        cantidad,
        usuario,
        referencia_tipo=None,
        referencia_id=None,
        observaciones=None
    ):
        """
        Registra un movimiento de stock y actualiza el stock.
        
        Args:
            variante: VarianteProducto
            deposito: Deposito
            tipo_movimiento: Tipo de MovimientoStock.TipoMovimiento
            cantidad: int (positivo para entradas, negativo para salidas)
            usuario: Usuario que realiza el movimiento
            referencia_tipo: str opcional (venta, compra, etc.)
            referencia_id: int opcional (ID del documento)
            observaciones: str opcional
        
        Returns:
            MovimientoStock creado
        """
        # Obtener o crear el stock
        stock = InventarioService.obtener_o_crear_stock(variante, deposito)
        
        # Guardar stock anterior
        stock_anterior = stock.cantidad
        
        # Actualizar stock
        stock.cantidad += cantidad
        stock.save()
        
        # Crear movimiento
        movimiento = MovimientoStock.objects.create(
            variante=variante,
            deposito=deposito,
            tipo=tipo_movimiento,
            cantidad=cantidad,
            usuario=usuario,
            referencia_tipo=referencia_tipo,
            referencia_id=referencia_id,
            observaciones=observaciones,
            stock_anterior=stock_anterior,
            stock_posterior=stock.cantidad
        )
        
        return movimiento
    
    @staticmethod
    def obtener_stock_actual(variante, deposito):
        """Obtiene el stock actual de una variante en un depósito"""
        try:
            stock = Stock.objects.get(variante=variante, deposito=deposito)
            return stock.cantidad
        except Stock.DoesNotExist:
            return 0
    
    @staticmethod
    def obtener_stock_critico(deposito=None, limite=None):
        """
        Obtiene lista de productos con stock crítico.

        Args:
            deposito: Deposito opcional (si no se proporciona, busca en todos)
            limite: int opcional - umbral de stock crítico (default: lee UMBRAL_STOCK_CRITICO de configuración, o 2)

        Returns:
            QuerySet de Stock con cantidad <= limite
        """
        if limite is None:
            from apps.configuracion.models import ConfiguracionManager
            limite = ConfiguracionManager.obtener('UMBRAL_STOCK_CRITICO', 2)
        queryset = Stock.objects.select_related(
            'variante',
            'variante__producto_base',
            'variante__producto_base__marca',
            'deposito'
        ).filter(cantidad__lte=limite)
        
        if deposito:
            queryset = queryset.filter(deposito=deposito)
        
        return queryset.order_by('cantidad', 'variante__producto_base__nombre')
    
    @staticmethod
    @transaction.atomic
    def ajuste_stock(variante, deposito, nueva_cantidad, usuario, observaciones):
        """
        Realiza un ajuste manual de stock (solo admin).
        Calcula la diferencia y crea el movimiento correspondiente.
        """
        stock_actual = InventarioService.obtener_stock_actual(variante, deposito)
        diferencia = nueva_cantidad - stock_actual
        
        if diferencia != 0:
            return InventarioService.registrar_movimiento(
                variante=variante,
                deposito=deposito,
                tipo_movimiento=MovimientoStock.TipoMovimiento.AJUSTE,
                cantidad=diferencia,
                usuario=usuario,
                observaciones=observaciones
            )
        
        return None
    
    @staticmethod
    @transaction.atomic
    def inventario_inicial(variante, deposito, cantidad, usuario):
        """Establece el inventario inicial de una variante"""
        return InventarioService.registrar_movimiento(
            variante=variante,
            deposito=deposito,
            tipo_movimiento=MovimientoStock.TipoMovimiento.INVENTARIO_INICIAL,
            cantidad=cantidad,
            usuario=usuario,
            observaciones='Inventario inicial'
        )
