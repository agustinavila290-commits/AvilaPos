"""
Servicios para gestión de compras.
Lógica de negocio centralizada.
"""
from decimal import Decimal
from django.db import transaction
from .models import Compra, DetalleCompra
from apps.inventario.services import InventarioService
from apps.inventario.models import MovimientoStock


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
            
            # Actualizar costo del producto
            if detalle_data['actualizar_costo']:
                variante.costo = detalle_data['costo_unitario']
            
            # Actualizar precio de venta
            if detalle_data['actualizar_precio'] and detalle_data['precio_venta_sugerido']:
                variante.precio_venta = detalle_data['precio_venta_sugerido']
            
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
