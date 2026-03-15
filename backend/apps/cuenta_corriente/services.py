"""
Servicios para tickets de cuenta corriente.
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import TicketCuentaCorriente, DetalleTicketCC
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock


class TicketCuentaCorrienteService:
    """Servicio para gestionar tickets de cuenta corriente."""

    @staticmethod
    @transaction.atomic
    def abrir_ticket(cliente, deposito, usuario, descripcion=''):
        """Crea un nuevo ticket en estado A_SALDAR."""
        ticket = TicketCuentaCorriente.objects.create(
            cliente=cliente,
            deposito=deposito,
            usuario_apertura=usuario,
            descripcion=descripcion or '',
            estado=TicketCuentaCorriente.Estado.A_SALDAR,
        )
        return ticket

    @staticmethod
    @transaction.atomic
    def agregar_item(ticket, variante, cantidad, precio_unitario, usuario, descuento_unitario=0):
        """
        Agrega un ítem al ticket. Si la variante ya existe, suma cantidad.
        Descuenta stock.
        """
        if ticket.estado != TicketCuentaCorriente.Estado.A_SALDAR:
            raise ValueError("Solo se pueden agregar ítems a tickets a saldar")

        if cantidad <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")

        stock_actual = InventarioService.obtener_stock_actual(variante, ticket.deposito)
        if stock_actual < cantidad:
            raise ValueError(
                f"Stock insuficiente. Disponible: {stock_actual}, solicitado: {cantidad}"
            )

        precio_unitario = Decimal(str(precio_unitario))
        descuento_unitario = Decimal(str(descuento_unitario))
        costo = getattr(variante, 'costo', Decimal('0')) or Decimal('0')
        subtotal_item = (precio_unitario - descuento_unitario) * cantidad

        detalle, created = DetalleTicketCC.objects.get_or_create(
            ticket=ticket,
            variante=variante,
            defaults={
                'cantidad': cantidad,
                'precio_unitario': precio_unitario,
                'descuento_unitario': descuento_unitario,
                'subtotal': subtotal_item,
                'costo_unitario': costo,
            },
        )

        if not created:
            detalle.cantidad += cantidad
            detalle.subtotal = (detalle.precio_unitario - detalle.descuento_unitario) * detalle.cantidad
            detalle.save(update_fields=['cantidad', 'subtotal'])

        InventarioService.registrar_movimiento(
            variante=variante,
            deposito=ticket.deposito,
            tipo_movimiento=MovimientoStock.TipoMovimiento.SALIDA_TICKET_CC,
            cantidad=-cantidad,
            usuario=usuario,
            referencia_tipo='ticket_cc',
            referencia_id=ticket.id,
            observaciones=f'Ticket CC #{ticket.numero}',
        )

        ticket.recalcular_totales()
        return detalle

    @staticmethod
    @transaction.atomic
    def devolver_item(ticket, detalle, cantidad_a_devolver, usuario):
        """
        Reduce la cantidad de un detalle y devuelve stock.
        Si cantidad queda 0, elimina el detalle.
        """
        if ticket.estado != TicketCuentaCorriente.Estado.A_SALDAR:
            raise ValueError("Solo se pueden devolver ítems de tickets a saldar")

        if detalle.ticket_id != ticket.id:
            raise ValueError("El detalle no pertenece a este ticket")

        if cantidad_a_devolver <= 0:
            raise ValueError("La cantidad a devolver debe ser mayor a 0")

        if cantidad_a_devolver > detalle.cantidad:
            raise ValueError(
                f"No se puede devolver más de lo que tiene. Cantidad en ticket: {detalle.cantidad}"
            )

        InventarioService.registrar_movimiento(
            variante=detalle.variante,
            deposito=ticket.deposito,
            tipo_movimiento=MovimientoStock.TipoMovimiento.DEVOLUCION_TICKET_CC,
            cantidad=cantidad_a_devolver,
            usuario=usuario,
            referencia_tipo='ticket_cc',
            referencia_id=ticket.id,
            observaciones=f'Devolución Ticket CC #{ticket.numero}',
        )

        if cantidad_a_devolver >= detalle.cantidad:
            detalle.delete()
        else:
            detalle.cantidad -= cantidad_a_devolver
            detalle.subtotal = (
                detalle.precio_unitario - detalle.descuento_unitario
            ) * detalle.cantidad
            detalle.save(update_fields=['cantidad', 'subtotal'])

        ticket.recalcular_totales()

    @staticmethod
    @transaction.atomic
    def cerrar_ticket(ticket, usuario, metodo_pago):
        """
        Cierra el ticket: crea la Venta (sin descontar stock) y marca el ticket como ABONADO.
        """
        if ticket.estado != TicketCuentaCorriente.Estado.A_SALDAR:
            raise ValueError("Solo se pueden cerrar tickets a saldar")

        detalles = list(ticket.detalles.all().select_related('variante'))
        if not detalles:
            raise ValueError("El ticket debe tener al menos un ítem para cerrar")

        from apps.ventas.services import VentaService
        venta = VentaService.crear_venta_desde_ticket_cc(
            ticket=ticket,
            usuario=usuario,
            metodo_pago=metodo_pago,
        )

        ticket.estado = TicketCuentaCorriente.Estado.ABONADO
        ticket.venta = venta
        ticket.usuario_cierre = usuario
        ticket.fecha_cierre = timezone.now()
        ticket.save(update_fields=['estado', 'venta', 'usuario_cierre', 'fecha_cierre'])

        return venta


