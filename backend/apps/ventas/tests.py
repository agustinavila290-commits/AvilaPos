"""
Tests del módulo ventas.
Flujo: agregar productos al ticket -> crear venta (varios ítems) -> verificar stock y totales.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.clientes.models import Cliente
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock, MovimientoStock
from apps.ventas.models import Venta, DetalleVenta
from apps.ventas.services import VentaService

User = get_user_model()


class FlujoVentaServiceTestCase(TestCase):
    """Tests del flujo de venta: varios productos, stock, totales."""

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='cajero_test',
            password='testpass123',
            rol=User.Rol.CAJERO,
            first_name='Cajero',
            last_name='Test'
        )
        self.cliente = Cliente.objects.create(
            nombre='Cliente Prueba',
            dni='20111222333',
            telefono='1155667788',
            activo=True
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito Principal',
            activo=True,
            es_principal=True
        )
        # Productos
        self.marca = Marca.objects.create(nombre='Marca Test', activo=True)
        self.categoria = Categoria.objects.create(nombre='Categoria Test', activo=True)
        self.producto1 = ProductoBase.objects.create(
            nombre='Producto A',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.producto2 = ProductoBase.objects.create(
            nombre='Producto B',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.variante1 = VarianteProducto.objects.create(
            producto_base=self.producto1,
            nombre_variante='STD',
            codigo='COD-A-001',
            costo=Decimal('100.00'),
            precio_mostrador=Decimal('200.00'),
            precio_web=Decimal('180.00'),
            activo=True
        )
        self.variante2 = VarianteProducto.objects.create(
            producto_base=self.producto2,
            nombre_variante='STD',
            codigo='COD-B-001',
            costo=Decimal('50.00'),
            precio_mostrador=Decimal('80.00'),
            precio_web=Decimal('75.00'),
            activo=True
        )
        # Stock inicial
        self.stock1 = Stock.objects.create(
            variante=self.variante1,
            deposito=self.deposito,
            cantidad=20
        )
        self.stock2 = Stock.objects.create(
            variante=self.variante2,
            deposito=self.deposito,
            cantidad=15
        )

    def test_crear_venta_un_producto(self):
        """Crear venta con un solo producto: total correcto y stock descontado."""
        items = [
            {
                'variante': self.variante1,
                'cantidad': 2,
                'precio_unitario': Decimal('200.00'),
                'descuento_unitario': Decimal('0'),
            }
        ]
        venta = VentaService.crear_venta(
            cliente=self.cliente,
            usuario=self.usuario,
            deposito=self.deposito,
            items=items,
            metodo_pago=Venta.MetodoPago.EFECTIVO,
        )
        self.assertIsNotNone(venta.pk)
        self.assertEqual(venta.total, Decimal('400.00'))
        self.assertEqual(venta.detalles.count(), 1)
        self.stock1.refresh_from_db()
        self.assertEqual(self.stock1.cantidad, 18)
        self.assertEqual(
            MovimientoStock.objects.filter(
                variante=self.variante1,
                tipo=MovimientoStock.TipoMovimiento.VENTA
            ).count(),
            1
        )

    def test_crear_venta_varios_productos_simultaneos(self):
        """Flujo POS: agregar varios productos al ticket y crear venta."""
        items = [
            {
                'variante': self.variante1,
                'cantidad': 3,
                'precio_unitario': Decimal('200.00'),
                'descuento_unitario': Decimal('0'),
            },
            {
                'variante': self.variante2,
                'cantidad': 5,
                'precio_unitario': Decimal('80.00'),
                'descuento_unitario': Decimal('0'),
            },
        ]
        venta = VentaService.crear_venta(
            cliente=self.cliente,
            usuario=self.usuario,
            deposito=self.deposito,
            items=items,
            metodo_pago=Venta.MetodoPago.TARJETA,
        )
        # Subtotal 3*200 + 5*80 = 600 + 400 = 1000
        self.assertEqual(venta.subtotal, Decimal('1000.00'))
        self.assertEqual(venta.total, Decimal('1000.00'))
        self.assertEqual(venta.detalles.count(), 2)
        self.stock1.refresh_from_db()
        self.stock2.refresh_from_db()
        self.assertEqual(self.stock1.cantidad, 17)
        self.assertEqual(self.stock2.cantidad, 10)

    def test_crear_venta_sin_items_falla(self):
        """No se puede crear venta sin ítems."""
        with self.assertRaises(ValueError) as ctx:
            VentaService.crear_venta(
                cliente=self.cliente,
                usuario=self.usuario,
                deposito=self.deposito,
                items=[],
                metodo_pago=Venta.MetodoPago.EFECTIVO,
            )
        self.assertIn('al menos un producto', str(ctx.exception))

    def test_crear_venta_con_descuento_general(self):
        """Venta con descuento por porcentaje aplicado al total."""
        items = [
            {
                'variante': self.variante1,
                'cantidad': 2,
                'precio_unitario': Decimal('200.00'),
                'descuento_unitario': Decimal('0'),
            },
        ]
        venta = VentaService.crear_venta(
            cliente=self.cliente,
            usuario=self.usuario,
            deposito=self.deposito,
            items=items,
            metodo_pago=Venta.MetodoPago.EFECTIVO,
            descuento_porcentaje=Decimal('10.00'),
        )
        # 400 - 10% = 360
        self.assertEqual(venta.subtotal, Decimal('400.00'))
        self.assertEqual(venta.total, Decimal('360.00'))


class FlujoVentaAPITestCase(TestCase):
    """Tests del flujo de venta vía API (como lo hace el POS)."""

    def setUp(self):
        self.client_api = __import__('rest_framework.test', fromlist=['APIClient']).APIClient()
        self.usuario = User.objects.create_user(
            username='cajero_api',
            password='testpass123',
            rol=User.Rol.CAJERO,
            first_name='Cajero',
            last_name='API'
        )
        self.client_api.force_authenticate(user=self.usuario)
        self.cliente = Cliente.objects.create(
            nombre='Cliente API',
            dni='20222333444',
            telefono='1199887766',
            activo=True
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito API',
            activo=True,
            es_principal=True
        )
        self.marca = Marca.objects.create(nombre='Marca API', activo=True)
        self.categoria = Categoria.objects.create(nombre='Cat API', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Producto API',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='API-001',
            costo=Decimal('100.00'),
            precio_mostrador=Decimal('250.00'),
            precio_web=Decimal('220.00'),
            activo=True
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=50
        )

    def test_post_crear_venta_con_varios_items(self):
        """POST /api/ventas/ crea venta con varios ítems (flujo POS)."""
        from rest_framework import status
        payload = {
            'cliente_id': self.cliente.id,
            'deposito_id': self.deposito.id,
            'metodo_pago': 'EFECTIVO',
            'descuento_porcentaje': 0,
            'descuento_monto': 0,
            'items': [
                {'variante_id': self.variante.id, 'cantidad': 2, 'precio_unitario': '250.00', 'descuento_unitario': '0'},
                {'variante_id': self.variante.id, 'cantidad': 1, 'precio_unitario': '250.00', 'descuento_unitario': '0'},
            ],
        }
        response = self.client_api.post('/api/ventas/ventas/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn('id', response.data)
        # Total puede venir como string desde el serializer
        total_resp = response.data.get('total')
        self.assertTrue(total_resp == '750.00' or float(total_resp) == 750.0, f'Total esperado 750, obtuvo {total_resp}')
        self.assertEqual(len(response.data.get('detalles', [])), 2)
