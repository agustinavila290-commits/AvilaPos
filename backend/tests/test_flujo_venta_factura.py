"""
Test de integración: flujo completo desde agregar productos hasta factura.
Camino: crear venta con varios ítems -> crear factura asociada a la venta.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.clientes.models import Cliente
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock
from apps.ventas.models import Venta, DetalleVenta
from apps.ventas.services import VentaService
from apps.facturacion.models import PuntoVenta, Factura, ItemFactura

User = get_user_model()


class FlujoVentaFacturaTestCase(TestCase):
    """Flujo: venta con varios productos -> factura con ítems derivados de la venta."""

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='vendedor_flujo',
            password='testpass123',
            rol=User.Rol.ADMINISTRADOR,
            first_name='Vendedor',
            last_name='Flujo'
        )
        self.cliente = Cliente.objects.create(
            nombre='Cliente Factura Test',
            dni='20999888777',
            telefono='1166554433',
            activo=True
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito Flujo',
            activo=True,
            es_principal=True
        )
        self.marca = Marca.objects.create(nombre='Marca Flujo', activo=True)
        self.categoria = Categoria.objects.create(nombre='Cat Flujo', activo=True)
        self.producto1 = ProductoBase.objects.create(
            nombre='Producto Uno',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.producto2 = ProductoBase.objects.create(
            nombre='Producto Dos',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.v1 = VarianteProducto.objects.create(
            producto_base=self.producto1,
            nombre_variante='STD',
            codigo='FLU-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('200'),
            precio_web=Decimal('180'),
            activo=True
        )
        self.v2 = VarianteProducto.objects.create(
            producto_base=self.producto2,
            nombre_variante='STD',
            codigo='FLU-002',
            costo=Decimal('50'),
            precio_mostrador=Decimal('90'),
            precio_web=Decimal('85'),
            activo=True
        )
        Stock.objects.create(variante=self.v1, deposito=self.deposito, cantidad=30)
        Stock.objects.create(variante=self.v2, deposito=self.deposito, cantidad=20)
        self.punto_venta = PuntoVenta.objects.create(
            numero=1,
            nombre='PV Test',
            activo=True
        )

    def test_flujo_venta_varios_productos_luego_factura(self):
        """Crear venta con 2 productos -> crear factura asociada con ítems de la venta."""
        # 1. Crear venta (como en POS: varios ítems)
        items = [
            {'variante': self.v1, 'cantidad': 2, 'precio_unitario': Decimal('200.00'), 'descuento_unitario': Decimal('0')},
            {'variante': self.v2, 'cantidad': 3, 'precio_unitario': Decimal('90.00'), 'descuento_unitario': Decimal('0')},
        ]
        venta = VentaService.crear_venta(
            cliente=self.cliente,
            usuario=self.usuario,
            deposito=self.deposito,
            items=items,
            metodo_pago=Venta.MetodoPago.EFECTIVO,
        )
        self.assertEqual(venta.total, Decimal('670.00'))  # 400 + 270
        self.assertEqual(venta.detalles.count(), 2)

        # 2. Crear factura asociada a la venta (ítems derivados de los detalles)
        factura = Factura.objects.create(
            tipo_comprobante=Factura.TipoComprobante.FACTURA_B,
            punto_venta=self.punto_venta,
            numero=1,
            cliente=self.cliente,
            cliente_razon_social=self.cliente.nombre_completo,
            cliente_cuit=self.cliente.dni,
            cliente_condicion_iva=Factura.CondicionIVA.CONSUMIDOR_FINAL,
            cliente_domicilio=self.cliente.direccion or '',
            venta=venta,
            usuario=self.usuario,
            estado=Factura.Estado.BORRADOR,
            subtotal=Decimal('0'),
            total=Decimal('0'),
        )
        for orden, det in enumerate(venta.detalles.all(), start=1):
            ItemFactura.objects.create(
                factura=factura,
                orden=orden,
                codigo=det.variante.codigo,
                descripcion=det.variante.nombre_completo,
                cantidad=det.cantidad,
                precio_unitario=det.precio_unitario,
                alicuota_iva=ItemFactura.AlicuotaIVA.IVA_21,
            )
        factura.calcular_totales()
        factura.save()

        self.assertEqual(factura.venta_id, venta.id)
        self.assertEqual(factura.items.count(), 2)
        # Subtotal de la factura = total de la venta (la venta no desglosa IVA)
        self.assertEqual(factura.subtotal, venta.total)
        self.assertGreater(factura.total, venta.total)  # factura incluye IVA
