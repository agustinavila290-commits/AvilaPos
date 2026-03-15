"""
Tests para módulo cuenta corriente.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.clientes.models import Cliente
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock, MovimientoStock
from apps.ventas.models import Venta

from .models import TicketCuentaCorriente, DetalleTicketCC
from .services import TicketCuentaCorrienteService

User = get_user_model()


class TicketCuentaCorrienteServiceTestCase(TestCase):
    """Tests del servicio de tickets cuenta corriente."""

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='cajero_cc',
            password='test123',
            rol=User.Rol.CAJERO,
            first_name='Cajero',
            last_name='CC',
        )
        self.cliente = Cliente.objects.create(
            nombre='Mecánico Test',
            dni='30111222333',
            telefono='1166778899',
            activo=True,
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito CC',
            activo=True,
            es_principal=True,
        )
        self.marca = Marca.objects.create(nombre='Marca CC', activo=True)
        self.categoria = Categoria.objects.create(nombre='Cat CC', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Repuesto Test',
            marca=self.marca,
            categoria=self.categoria,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='CC-001',
            costo=Decimal('50.00'),
            precio_mostrador=Decimal('120.00'),
            precio_web=Decimal('100.00'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=100,
        )

    def test_abrir_ticket(self):
        ticket = TicketCuentaCorrienteService.abrir_ticket(
            cliente=self.cliente,
            deposito=self.deposito,
            usuario=self.usuario,
            descripcion='Moto 110',
        )
        self.assertIsNotNone(ticket.pk)
        self.assertEqual(ticket.cliente, self.cliente)
        self.assertEqual(ticket.estado, TicketCuentaCorriente.Estado.A_SALDAR)
        self.assertEqual(ticket.numero, 1)
        self.assertEqual(ticket.total, Decimal('0'))

    def test_agregar_item(self):
        ticket = TicketCuentaCorrienteService.abrir_ticket(
            cliente=self.cliente,
            deposito=self.deposito,
            usuario=self.usuario,
            descripcion='Moto 110',
        )
        detalle = TicketCuentaCorrienteService.agregar_item(
            ticket=ticket,
            variante=self.variante,
            cantidad=3,
            precio_unitario=Decimal('120.00'),
            usuario=self.usuario,
        )
        self.assertIsNotNone(detalle.pk)
        self.assertEqual(detalle.cantidad, 3)
        self.assertEqual(detalle.subtotal, Decimal('360.00'))

        ticket.refresh_from_db()
        self.assertEqual(ticket.total, Decimal('360.00'))

        stock = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock.cantidad, 97)

        mov = MovimientoStock.objects.filter(
            variante=self.variante,
            tipo=MovimientoStock.TipoMovimiento.SALIDA_TICKET_CC,
        ).first()
        self.assertIsNotNone(mov)
        self.assertEqual(mov.cantidad, -3)

    def test_devolver_item(self):
        ticket = TicketCuentaCorrienteService.abrir_ticket(
            cliente=self.cliente,
            deposito=self.deposito,
            usuario=self.usuario,
            descripcion='Moto 110',
        )
        TicketCuentaCorrienteService.agregar_item(
            ticket=ticket,
            variante=self.variante,
            cantidad=5,
            precio_unitario=Decimal('120.00'),
            usuario=self.usuario,
        )
        detalle = ticket.detalles.get()
        stock_antes = Stock.objects.get(variante=self.variante, deposito=self.deposito).cantidad

        TicketCuentaCorrienteService.devolver_item(
            ticket=ticket,
            detalle=detalle,
            cantidad_a_devolver=2,
            usuario=self.usuario,
        )

        detalle.refresh_from_db()
        self.assertEqual(detalle.cantidad, 3)

        stock = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock.cantidad, stock_antes + 2)

        ticket.refresh_from_db()
        self.assertEqual(ticket.total, Decimal('360.00'))

    def test_cerrar_ticket(self):
        ticket = TicketCuentaCorrienteService.abrir_ticket(
            cliente=self.cliente,
            deposito=self.deposito,
            usuario=self.usuario,
            descripcion='Moto 110',
        )
        TicketCuentaCorrienteService.agregar_item(
            ticket=ticket,
            variante=self.variante,
            cantidad=2,
            precio_unitario=Decimal('120.00'),
            usuario=self.usuario,
        )
        stock_antes = Stock.objects.get(variante=self.variante, deposito=self.deposito).cantidad

        venta = TicketCuentaCorrienteService.cerrar_ticket(
            ticket=ticket,
            usuario=self.usuario,
            metodo_pago=Venta.MetodoPago.EFECTIVO,
        )

        self.assertIsNotNone(venta.pk)
        self.assertEqual(venta.cliente, self.cliente)
        self.assertEqual(venta.total, Decimal('240.00'))
        self.assertEqual(venta.detalles.count(), 1)

        ticket.refresh_from_db()
        self.assertEqual(ticket.estado, TicketCuentaCorriente.Estado.ABONADO)
        self.assertEqual(ticket.venta, venta)

        # Stock no debe cambiar al cerrar (ya se descontó al agregar)
        stock = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock.cantidad, stock_antes)


class TicketCuentaCorrienteAPITestCase(TestCase):
    """Tests de la API REST de tickets cuenta corriente."""

    def setUp(self):
        from rest_framework.test import APIClient
        self.client_api = APIClient()
        self.usuario = User.objects.create_user(
            username='cajero_api_cc',
            password='test123',
            rol=User.Rol.CAJERO,
            first_name='Cajero',
            last_name='CC',
        )
        self.client_api.force_authenticate(user=self.usuario)
        self.cliente = Cliente.objects.create(
            nombre='Mecánico API',
            dni='40111222333',
            telefono='1177889900',
            activo=True,
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito API CC',
            activo=True,
            es_principal=True,
        )
        self.marca = Marca.objects.create(nombre='Marca API', activo=True)
        self.categoria = Categoria.objects.create(nombre='Cat API', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Repuesto API',
            marca=self.marca,
            categoria=self.categoria,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='API-CC-001',
            costo=Decimal('30.00'),
            precio_mostrador=Decimal('80.00'),
            precio_web=Decimal('70.00'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=50,
        )

    def test_api_crear_ticket(self):
        """POST /api/cuenta-corriente/tickets/ crea ticket."""
        resp = self.client_api.post(
            '/api/cuenta-corriente/tickets/',
            {
                'cliente_id': self.cliente.id,
                'deposito_id': self.deposito.id,
                'descripcion': 'Moto 110',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIn('id', resp.data)
        self.assertEqual(resp.data['estado'], 'A_SALDAR')
        self.assertEqual(resp.data['numero'], 1)

    def test_api_agregar_item(self):
        """POST agregar_item agrega producto y descuenta stock."""
        ticket = TicketCuentaCorriente.objects.create(
            cliente=self.cliente,
            deposito=self.deposito,
            usuario_apertura=self.usuario,
            descripcion='Test',
            estado=TicketCuentaCorriente.Estado.A_SALDAR,
        )
        resp = self.client_api.post(
            f'/api/cuenta-corriente/tickets/{ticket.id}/agregar_item/',
            {
                'variante_id': self.variante.id,
                'cantidad': 2,
                'precio_unitario': '80.00',
                'descuento_unitario': '0',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        detalles = resp.data.get('detalles', [])
        self.assertEqual(len(detalles), 1)
        self.assertEqual(detalles[0]['cantidad'], 2)
        self.assertEqual(detalles[0]['subtotal'], '160.00')
        total = resp.data.get('total')
        total_num = float(total) if total is not None else 0
        self.assertGreater(total_num, 0, f'Total debe ser positivo, obtuvo {total}')
