"""
Servicios para lógica de negocio de devoluciones.
"""
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import DevolucionVenta, DetalleDevolucion, NotaCredito
from apps.ventas.models import Venta, DetalleVenta
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock


class DevolucionService:
    """Servicio para gestionar devoluciones de ventas"""
    
    @staticmethod
    @transaction.atomic
    def crear_devolucion(venta_id, usuario, motivo, items, deposito_id, 
                         observaciones=None, genera_nota_credito=True):
        """
        Crea una devolución de venta.
        
        Args:
            venta_id: ID de la venta original
            usuario: Usuario que procesa la devolución
            motivo: Motivo de la devolución
            items: Lista de {'detalle_venta_id', 'cantidad', 'estado_producto'}
            deposito_id: ID del depósito donde reingresan los productos
            observaciones: Observaciones adicionales
            genera_nota_credito: Si debe generar nota de crédito
        
        Returns:
            DevolucionVenta creada
        """
        # Validar venta
        try:
            venta = Venta.objects.get(id=venta_id)
        except Venta.DoesNotExist:
            raise ValueError('La venta no existe')
        
        if venta.estado != Venta.EstadoVenta.COMPLETADA:
            raise ValueError('Solo se pueden devolver ventas completadas')
        
        # Validar items
        if not items:
            raise ValueError('Debe incluir al menos un producto')
        
        # Crear devolución
        devolucion = DevolucionVenta.objects.create(
            venta=venta,
            usuario=usuario,
            motivo=motivo,
            observaciones=observaciones or '',
            deposito_id=deposito_id,
            total=Decimal('0'),
            genera_nota_credito=genera_nota_credito
        )
        
        total_devolucion = Decimal('0')
        
        # Procesar cada item
        for item in items:
            detalle_venta = DetalleVenta.objects.get(id=item['detalle_venta_id'])
            cantidad = item['cantidad']
            
            # Validar que el detalle pertenece a la venta
            if detalle_venta.venta != venta:
                raise ValueError(
                    f'El producto {detalle_venta.variante.nombre_completo} '
                    f'no pertenece a esta venta'
                )
            
            # Validar cantidad disponible para devolver
            cantidad_devuelta_previa = DetalleDevolucion.objects.filter(
                detalle_venta=detalle_venta,
                devolucion__estado__in=[
                    DevolucionVenta.EstadoDevolucion.PENDIENTE,
                    DevolucionVenta.EstadoDevolucion.PROCESADA
                ]
            ).aggregate(total=Sum('cantidad'))['total'] or 0
            
            cantidad_disponible = detalle_venta.cantidad - cantidad_devuelta_previa
            
            if cantidad > cantidad_disponible:
                raise ValueError(
                    f'No se pueden devolver {cantidad} unidades de '
                    f'{detalle_venta.variante.nombre_completo}. '
                    f'Solo hay {cantidad_disponible} disponibles.'
                )
            
            # Calcular subtotal
            subtotal = detalle_venta.precio_unitario * cantidad
            total_devolucion += subtotal
            
            # Crear detalle de devolución
            DetalleDevolucion.objects.create(
                devolucion=devolucion,
                detalle_venta=detalle_venta,
                variante=detalle_venta.variante,
                cantidad=cantidad,
                precio_unitario=detalle_venta.precio_unitario,
                subtotal=subtotal,
                estado_producto=item.get('estado_producto', '')
            )
            
            # Reintegrar stock
            InventarioService.registrar_movimiento(
                variante=detalle_venta.variante,
                deposito_id=deposito_id,
                cantidad=cantidad,
                tipo_movimiento=MovimientoStock.TipoMovimiento.DEVOLUCION,
                observaciones=(
                    f'Devolución #{devolucion.numero} - '
                    f'Venta #{venta.numero} - '
                    f'Motivo: {devolucion.get_motivo_display()}'
                ),
                usuario=usuario
            )
        
        # Actualizar total
        devolucion.total = total_devolucion
        devolucion.estado = DevolucionVenta.EstadoDevolucion.PROCESADA
        devolucion.save()
        
        # Generar nota de crédito si corresponde
        if genera_nota_credito:
            DevolucionService.generar_nota_credito(devolucion)
        
        return devolucion
    
    @staticmethod
    @transaction.atomic
    def generar_nota_credito(devolucion):
        """
        Genera una nota de crédito para una devolución.
        
        Args:
            devolucion: DevolucionVenta
        
        Returns:
            NotaCredito creada
        """
        # Verificar que no exista ya
        if hasattr(devolucion, 'nota_credito'):
            raise ValueError('Esta devolución ya tiene una nota de crédito')
        
        # Crear nota de crédito
        nota = NotaCredito.objects.create(
            devolucion=devolucion,
            cliente=devolucion.venta.cliente,
            monto=devolucion.total,
            observaciones=f'Generada por Devolución #{devolucion.numero}'
        )
        
        return nota
    
    @staticmethod
    @transaction.atomic
    def cancelar_devolucion(devolucion, usuario):
        """
        Cancela una devolución pendiente.
        
        Args:
            devolucion: DevolucionVenta
            usuario: Usuario que cancela
        
        Returns:
            DevolucionVenta actualizada
        """
        if devolucion.estado != DevolucionVenta.EstadoDevolucion.PENDIENTE:
            raise ValueError('Solo se pueden cancelar devoluciones pendientes')
        
        # Actualizar estado
        devolucion.estado = DevolucionVenta.EstadoDevolucion.CANCELADA
        devolucion.save()
        
        return devolucion
    
    @staticmethod
    def obtener_productos_devolubles(venta_id):
        """
        Obtiene los productos de una venta que pueden ser devueltos.
        
        Args:
            venta_id: ID de la venta
        
        Returns:
            Lista de detalles con cantidad disponible para devolver
        """
        try:
            venta = Venta.objects.get(id=venta_id)
        except Venta.DoesNotExist:
            raise ValueError('La venta no existe')
        
        if venta.estado != Venta.EstadoVenta.COMPLETADA:
            raise ValueError('Solo se pueden devolver ventas completadas')
        
        # Obtener detalles de la venta
        detalles = DetalleVenta.objects.filter(venta=venta).select_related('variante')
        
        resultado = []
        
        for detalle in detalles:
            # Calcular cantidad ya devuelta
            cantidad_devuelta = DetalleDevolucion.objects.filter(
                detalle_venta=detalle,
                devolucion__estado__in=[
                    DevolucionVenta.EstadoDevolucion.PENDIENTE,
                    DevolucionVenta.EstadoDevolucion.PROCESADA
                ]
            ).aggregate(total=Sum('cantidad'))['total'] or 0
            
            cantidad_disponible = detalle.cantidad - cantidad_devuelta
            
            if cantidad_disponible > 0:
                resultado.append({
                    'detalle_id': detalle.id,
                    'variante': detalle.variante,
                    'cantidad_vendida': detalle.cantidad,
                    'cantidad_devuelta': cantidad_devuelta,
                    'cantidad_disponible': cantidad_disponible,
                    'precio_unitario': detalle.precio_unitario,
                    'subtotal': detalle.subtotal
                })
        
        return resultado


class NotaCreditoService:
    """Servicio para gestionar notas de crédito"""
    
    @staticmethod
    @transaction.atomic
    def utilizar_nota_credito(nota_credito, monto, venta=None):
        """
        Utiliza (descuenta) monto de una nota de crédito.
        
        Args:
            nota_credito: NotaCredito
            monto: Monto a utilizar
            venta: Venta donde se aplica (opcional)
        
        Returns:
            NotaCredito actualizada
        """
        if nota_credito.estado != NotaCredito.EstadoNota.ACTIVA:
            raise ValueError('La nota de crédito no está activa')
        
        saldo = nota_credito.saldo_disponible
        
        if monto > saldo:
            raise ValueError(
                f'El monto a utilizar (${monto}) excede el saldo disponible (${saldo})'
            )
        
        # Actualizar monto utilizado
        nota_credito.monto_utilizado += monto
        
        # Si se agotó, marcar como utilizada
        if nota_credito.saldo_disponible == 0:
            nota_credito.estado = NotaCredito.EstadoNota.UTILIZADA
        
        nota_credito.save()
        
        return nota_credito
    
    @staticmethod
    def obtener_notas_activas_cliente(cliente_id):
        """
        Obtiene las notas de crédito activas de un cliente.
        
        Args:
            cliente_id: ID del cliente
        
        Returns:
            QuerySet de NotaCredito
        """
        hoy = timezone.now().date()
        
        notas = NotaCredito.objects.filter(
            cliente_id=cliente_id,
            estado=NotaCredito.EstadoNota.ACTIVA
        ).filter(
            # Sin vencimiento o no vencida
            models.Q(fecha_vencimiento__isnull=True) |
            models.Q(fecha_vencimiento__gte=hoy)
        )
        
        return notas
    
    @staticmethod
    @transaction.atomic
    def cancelar_nota_credito(nota_credito, usuario):
        """
        Cancela una nota de crédito.
        
        Args:
            nota_credito: NotaCredito
            usuario: Usuario que cancela
        
        Returns:
            NotaCredito actualizada
        """
        if nota_credito.monto_utilizado > 0:
            raise ValueError(
                'No se puede cancelar una nota de crédito que ya fue utilizada'
            )
        
        nota_credito.estado = NotaCredito.EstadoNota.CANCELADA
        nota_credito.save()
        
        return nota_credito
