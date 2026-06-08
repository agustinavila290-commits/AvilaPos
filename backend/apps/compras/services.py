"""
Servicios para gestión de compras.
Lógica de negocio centralizada.
"""
from decimal import Decimal
from django.db import transaction
from .models import Compra, DetalleCompra, HistorialCosto, OrdenCompra, DetalleOrdenCompra
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock


def _registrar_historial_costo(variante, costo_anterior, costo_nuevo, usuario,
                                 referencia_tipo=None, referencia_id=None, observaciones=None):
    """Registra un cambio de costo en el historial si el costo cambió."""
    if costo_anterior != costo_nuevo:
        HistorialCosto.objects.create(
            variante=variante,
            costo_anterior=costo_anterior,
            costo_nuevo=costo_nuevo,
            usuario=usuario,
            referencia_tipo=referencia_tipo,
            referencia_id=referencia_id,
            observaciones=observaciones,
        )


class CompraService:
    """Servicio para gestionar compras"""
    
    @staticmethod
    @transaction.atomic
    def crear_compra(
        proveedor,
        usuario,
        deposito,
        items,  # Lista de dicts: [{variante, cantidad, costo_unitario, precio_venta_sugerido, actualizar_costo, actualizar_precio}]
        numero_factura=None,
        fecha_compra=None,
        observaciones=None
    ):
        """
        Crea una compra completa con sus detalles y actualiza el stock.
        Opcionalmente actualiza costos y precios de los productos.
        
        Args:
            proveedor: Proveedor
            usuario: Usuario que registra la compra
            deposito: Depósito donde ingresa la mercadería
            items: Lista de items comprados
            numero_factura: Número de factura (opcional)
            fecha_compra: Fecha real de compra (opcional)
            observaciones: Observaciones (opcional)
        
        Returns:
            Compra creada
        """
        
        # Validar items
        if not items:
            raise ValueError("La compra debe tener al menos un producto")
        
        # Calcular total
        total = Decimal('0')
        detalles_data = []
        
        for item in items:
            variante = item['variante']
            cantidad = item['cantidad']
            costo_unitario = Decimal(str(item['costo_unitario']))
            
            # Validar cantidad
            if cantidad <= 0:
                raise ValueError(f"Cantidad inválida para {variante.sku}")
            
            # Calcular subtotal
            subtotal = costo_unitario * cantidad
            total += subtotal
            
            detalles_data.append({
                'variante': variante,
                'cantidad': cantidad,
                'costo_unitario': costo_unitario,
                'subtotal': subtotal,
                'precio_venta_sugerido': item.get('precio_venta_sugerido'),
                'actualizar_costo': item.get('actualizar_costo', True),
                'actualizar_precio': item.get('actualizar_precio', False)
            })
        
        # Crear compra
        compra = Compra.objects.create(
            proveedor=proveedor,
            usuario=usuario,
            deposito=deposito,
            total=total,
            numero_factura=numero_factura,
            fecha_compra=fecha_compra,
            observaciones=observaciones,
            estado=Compra.EstadoCompra.COMPLETADA
        )
        
        # Crear detalles, aumentar stock y actualizar costos/precios
        for detalle_data in detalles_data:
            variante = detalle_data['variante']
            
            # Crear detalle
            DetalleCompra.objects.create(
                compra=compra,
                **detalle_data
            )
            
            # Aumentar stock
            InventarioService.registrar_movimiento(
                variante=variante,
                deposito=deposito,
                tipo_movimiento=MovimientoStock.TipoMovimiento.COMPRA,
                cantidad=detalle_data['cantidad'],  # Positivo para entrada
                usuario=usuario,
                referencia_tipo='compra',
                referencia_id=compra.id,
                observaciones=f'Compra #{compra.numero}'
            )
            
            # Actualizar costo del producto y registrar historial
            if detalle_data['actualizar_costo']:
                costo_anterior = variante.costo
                costo_nuevo = detalle_data['costo_unitario']
                variante.costo = costo_nuevo
                _registrar_historial_costo(
                    variante=variante,
                    costo_anterior=costo_anterior,
                    costo_nuevo=costo_nuevo,
                    usuario=usuario,
                    referencia_tipo='compra',
                    referencia_id=compra.id,
                    observaciones=f'Compra #{compra.numero}',
                )

            # Actualizar precio de venta
            if detalle_data['actualizar_precio'] and detalle_data['precio_venta_sugerido']:
                variante.precio_mostrador = detalle_data['precio_venta_sugerido']

            # Guardar cambios en la variante
            if detalle_data['actualizar_costo'] or (detalle_data['actualizar_precio'] and detalle_data['precio_venta_sugerido']):
                variante.save()
        
        return compra

    @staticmethod
    @transaction.atomic
    def cancelar_compra(compra, usuario_admin):
        """
        Cancela una compra y devuelve el stock.
        Solo admin puede cancelar.
        
        Args:
            compra: Compra a cancelar
            usuario_admin: Usuario administrador
        
        Returns:
            Compra cancelada
        """
        
        # Validar que no esté ya cancelada
        if compra.estado == Compra.EstadoCompra.CANCELADA:
            raise ValueError("La compra ya está cancelada")
        
        # Actualizar compra
        compra.estado = Compra.EstadoCompra.CANCELADA
        compra.save()
        
        # Devolver stock (restar lo que se había agregado)
        for detalle in compra.detalles.all():
            InventarioService.registrar_movimiento(
                variante=detalle.variante,
                deposito=compra.deposito,
                tipo_movimiento=MovimientoStock.TipoMovimiento.AJUSTE,
                cantidad=-detalle.cantidad,  # Negativo para salida
                usuario=usuario_admin,
                referencia_tipo='compra',
                referencia_id=compra.id,
                observaciones=f'Cancelación de compra #{compra.numero}'
            )

        return compra


class OrdenCompraService:
    """Servicio para gestionar órdenes de compra."""

    @staticmethod
    @transaction.atomic
    def crear_orden(proveedor, usuario, deposito, items,
                    fecha_esperada=None, numero_referencia=None,
                    observaciones=None, notas_proveedor=None):
        """Crea una Orden de Compra en estado BORRADOR."""
        if not items:
            raise ValueError('La orden debe tener al menos un producto.')

        orden = OrdenCompra.objects.create(
            proveedor=proveedor,
            usuario=usuario,
            deposito=deposito,
            estado=OrdenCompra.Estado.BORRADOR,
            fecha_esperada=fecha_esperada,
            numero_referencia=numero_referencia,
            observaciones=observaciones,
            notas_proveedor=notas_proveedor,
        )

        for item in items:
            DetalleOrdenCompra.objects.create(
                orden=orden,
                variante=item['variante'],
                cantidad_pedida=item['cantidad_pedida'],
                costo_estimado=item.get('costo_estimado'),
            )

        return orden

    @staticmethod
    @transaction.atomic
    def recibir(orden, usuario, items_recibidos, numero_factura=None,
                fecha_compra=None, observaciones_compra=None):
        """
        Recepción parcial o total de una orden.
        Crea una Compra con los ítems recibidos.
        items_recibidos: [{detalle_id, cantidad_a_recibir, costo_real,
                           actualizar_costo, actualizar_precio, precio_venta_sugerido}]
        """
        if orden.estado == OrdenCompra.Estado.CANCELADA:
            raise ValueError('No se puede recibir una orden cancelada.')
        if orden.estado == OrdenCompra.Estado.RECIBIDA_TOTAL:
            raise ValueError('La orden ya fue recibida completamente.')

        items_compra = []
        for item in items_recibidos:
            try:
                detalle = orden.detalles.get(id=item['detalle_id'])
            except DetalleOrdenCompra.DoesNotExist:
                raise ValueError(f'Detalle ID {item["detalle_id"]} no encontrado en la orden.')

            cantidad = int(item.get('cantidad_a_recibir', 0))
            if cantidad <= 0:
                continue
            if cantidad > detalle.cantidad_pendiente:
                raise ValueError(
                    f'Cantidad a recibir ({cantidad}) supera la pendiente '
                    f'({detalle.cantidad_pendiente}) para {detalle.variante.codigo}.'
                )

            costo_real = item.get('costo_real') or detalle.costo_estimado or Decimal('0')
            detalle.cantidad_recibida += cantidad
            detalle.costo_real = costo_real
            detalle.save(update_fields=['cantidad_recibida', 'costo_real'])

            items_compra.append({
                'variante': detalle.variante,
                'cantidad': cantidad,
                'costo_unitario': Decimal(str(costo_real)),
                'precio_venta_sugerido': item.get('precio_venta_sugerido'),
                'actualizar_costo': item.get('actualizar_costo', True),
                'actualizar_precio': item.get('actualizar_precio', False),
            })

        if not items_compra:
            raise ValueError('No se indicó ningún ítem con cantidad mayor a 0.')

        compra = CompraService.crear_compra(
            proveedor=orden.proveedor,
            usuario=usuario,
            deposito=orden.deposito,
            items=items_compra,
            numero_factura=numero_factura,
            fecha_compra=fecha_compra,
            observaciones=observaciones_compra or f'Recepción OC #{orden.numero}',
        )

        # Actualizar estado de la orden — forzar query directa para evitar caché prefetch
        detalles_refreshed = list(DetalleOrdenCompra.objects.filter(orden_id=orden.pk))
        todos_completos = bool(detalles_refreshed) and all(d.completado for d in detalles_refreshed)
        alguno_recibido = any(d.cantidad_recibida > 0 for d in detalles_refreshed)

        if todos_completos:
            orden.estado = OrdenCompra.Estado.RECIBIDA_TOTAL
        elif alguno_recibido:
            orden.estado = OrdenCompra.Estado.RECIBIDA_PARCIAL

        orden.save(update_fields=['estado'])
        return orden, compra

    @staticmethod
    @transaction.atomic
    def cancelar(orden, usuario):
        if orden.estado in (OrdenCompra.Estado.CANCELADA, OrdenCompra.Estado.RECIBIDA_TOTAL):
            raise ValueError(f'No se puede cancelar una orden en estado "{orden.get_estado_display()}".')
        orden.estado = OrdenCompra.Estado.CANCELADA
        orden.save(update_fields=['estado'])
        return orden

    @staticmethod
    @transaction.atomic
    def emitir(orden):
        if orden.estado != OrdenCompra.Estado.BORRADOR:
            raise ValueError('Solo se pueden emitir órdenes en estado BORRADOR.')
        orden.estado = OrdenCompra.Estado.EMITIDA
        orden.save(update_fields=['estado'])
        return orden
