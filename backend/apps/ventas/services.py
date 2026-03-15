"""
Servicios para gestión de ventas.
Lógica de negocio centralizada.
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import Venta, DetalleVenta
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock


class VentaService:
    """Servicio para gestionar ventas"""
    
    @staticmethod
    @transaction.atomic
    def crear_venta(
        cliente,
        usuario,
        deposito,
        items,  # Lista de dicts: [{variante, cantidad, precio_unitario, descuento_unitario}]
        metodo_pago,
        descuento_porcentaje=0,
        descuento_monto=0
    ):
        """
        Crea una venta completa con sus detalles y actualiza el stock.
        
        Args:
            cliente: Cliente (obligatorio)
            usuario: Usuario que realiza la venta (cajero)
            deposito: Depósito desde donde se vende
            items: Lista de items a vender
            metodo_pago: Método de pago
            descuento_porcentaje: Descuento general en %
            descuento_monto: Descuento general en $
        
        Returns:
            Venta creada
        """
        
        # Validar items
        if not items:
            raise ValueError("La venta debe tener al menos un producto")
        
        # Calcular subtotal de items
        subtotal = Decimal('0')
        detalles_data = []
        
        for item in items:
            variante = item['variante']
            cantidad = item['cantidad']
            precio_unitario = Decimal(str(item['precio_unitario']))
            descuento_unitario = Decimal(str(item.get('descuento_unitario', 0)))
            
            # Validar cantidad
            if cantidad <= 0:
                raise ValueError(f"Cantidad inválida para {variante.sku}")
            
            # Calcular subtotal del item
            precio_final = precio_unitario - descuento_unitario
            subtotal_item = precio_final * cantidad
            subtotal += subtotal_item
            
            detalles_data.append({
                'variante': variante,
                'cantidad': cantidad,
                'precio_unitario': precio_unitario,
                'descuento_unitario': descuento_unitario,
                'subtotal': subtotal_item,
                'costo_unitario': variante.costo
            })
        
        # Aplicar descuento general
        if descuento_monto > 0:
            total = subtotal - descuento_monto
        elif descuento_porcentaje > 0:
            descuento_monto = subtotal * (Decimal(str(descuento_porcentaje)) / 100)
            total = subtotal - descuento_monto
        else:
            total = subtotal
        
        # Validar total positivo
        if total < 0:
            raise ValueError("El total no puede ser negativo")
        
        # Crear venta
        venta = Venta.objects.create(
            cliente=cliente,
            usuario=usuario,
            deposito=deposito,
            subtotal=subtotal,
            descuento_porcentaje=descuento_porcentaje,
            descuento_monto=descuento_monto,
            total=total,
            metodo_pago=metodo_pago,
            estado=Venta.EstadoVenta.COMPLETADA
        )
        
        # Crear detalles y descontar stock
        for detalle_data in detalles_data:
            # Crear detalle
            DetalleVenta.objects.create(
                venta=venta,
                **detalle_data
            )
            
            # Descontar stock
            InventarioService.registrar_movimiento(
                variante=detalle_data['variante'],
                deposito=deposito,
                tipo_movimiento=MovimientoStock.TipoMovimiento.VENTA,
                cantidad=-detalle_data['cantidad'],  # Negativo para salida
                usuario=usuario,
                referencia_tipo='venta',
                referencia_id=venta.id,
                observaciones=f'Venta #{venta.numero}'
            )
        
        return venta
    
    @staticmethod
    @transaction.atomic
    def anular_venta(venta, usuario_admin, motivo):
        """
        Anula una venta y devuelve el stock.
        Solo admin puede anular.
        
        Args:
            venta: Venta a anular
            usuario_admin: Usuario administrador
            motivo: Motivo de anulación (obligatorio)
        
        Returns:
            Venta anulada
        """
        
        # Validar que no esté ya anulada
        if venta.estado == Venta.EstadoVenta.ANULADA:
            raise ValueError("La venta ya está anulada")
        
        # Validar motivo
        if not motivo or len(motivo.strip()) < 10:
            raise ValueError("El motivo debe tener al menos 10 caracteres")
        
        # Actualizar venta
        venta.estado = Venta.EstadoVenta.ANULADA
        venta.motivo_anulacion = motivo
        venta.usuario_anulacion = usuario_admin
        venta.fecha_anulacion = timezone.now()
        venta.save()
        
        # Devolver stock
        for detalle in venta.detalles.all():
            InventarioService.registrar_movimiento(
                variante=detalle.variante,
                deposito=venta.deposito,
                tipo_movimiento=MovimientoStock.TipoMovimiento.ANULACION,
                cantidad=detalle.cantidad,  # Positivo para entrada
                usuario=usuario_admin,
                referencia_tipo='venta',
                referencia_id=venta.id,
                observaciones=f'Anulación de venta #{venta.numero}: {motivo}'
            )
        
        return venta
    
    @staticmethod
    def calcular_margen_bajo_umbral(margen_porcentaje, umbral=5):
        """Verifica si un margen está por debajo del umbral"""
        return margen_porcentaje < umbral
    
    @staticmethod
    @transaction.atomic
    def crear_venta_desde_ticket_cc(ticket, usuario, metodo_pago):
        """
        Crea Venta y DetalleVenta desde un ticket de cuenta corriente.
        NO descuenta stock (ya fue descontado al agregar al ticket).
        """
        from apps.cuenta_corriente.models import TicketCuentaCorriente
        subtotal = ticket.subtotal
        total = ticket.total

        venta = Venta.objects.create(
            cliente=ticket.cliente,
            usuario=usuario,
            deposito=ticket.deposito,
            subtotal=subtotal,
            descuento_porcentaje=0,
            descuento_monto=0,
            total=total,
            metodo_pago=metodo_pago,
            estado=Venta.EstadoVenta.COMPLETADA,
        )

        for det in ticket.detalles.all():
            DetalleVenta.objects.create(
                venta=venta,
                variante=det.variante,
                cantidad=det.cantidad,
                precio_unitario=det.precio_unitario,
                descuento_unitario=det.descuento_unitario,
                subtotal=det.subtotal,
                costo_unitario=det.costo_unitario,
            )

        return venta

    @staticmethod
    def validar_descuento_permitido(usuario, descuento_porcentaje):
        """
        Valida si el usuario puede aplicar el descuento.
        Cajero: hasta 50%
        Admin: sin límite
        """
        if usuario.es_administrador:
            return True
        
        if usuario.es_cajero and descuento_porcentaje <= 50:
            return True
        
        return False
