"""
Tests de la API pública de la tienda web (avila-web).
Endpoints sin autenticación: productos, categorías, marcas, pedidos.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock, MovimientoStock
from apps.ventas.models import Venta
from .models import PuntoRetiro

User = get_user_model()
BASE = '/api/tienda'


class TiendaAPITestCase(TestCase):
    """Tests de la API pública de tienda (sin autenticación)."""

    def setUp(self):
        self.client_api = APIClient()
        # Depósito principal
        self.deposito = Deposito.objects.create(
            nombre='Depósito Principal',
            activo=True,
            es_principal=True,
        )
        # Usuario para ventas web
        self.admin = User.objects.create_superuser(
            username='admin_tienda',
            email='admin@test.com',
            password='testpass123',
        )
        # Marca y categoría
        self.marca = Marca.objects.create(nombre='Honda', activo=True)
        self.categoria = Categoria.objects.create(nombre='Motor', activo=True)
        # Producto
        self.producto = ProductoBase.objects.create(
            nombre='Pistón Honda CG',
            marca=self.marca,
            categoria=self.categoria,
            activo=True,
            descripcion='Pistón de repuesto',
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='PISTON-HONDA-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('250'),
            precio_web=Decimal('230'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=10,
        )
        # Punto de retiro por defecto
        self.punto_retiro = PuntoRetiro.objects.create(
            nombre='Casa Central Avila',
            direccion_texto='Av. Siempre Viva 123',
            activo=True,
        )

    def test_productos_list_sin_auth(self):
        """GET /api/tienda/productos/ responde sin autenticación."""
        response = self.client_api.get(f'{BASE}/productos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('total_pages', data)
        self.assertGreaterEqual(len(data['results']), 1)
        item = data['results'][0]
        self.assertEqual(item['id'], self.variante.id)
        self.assertEqual(item['codigo'], 'PISTON-HONDA-001')
        self.assertEqual(item['precio_web'], '230.00')
        self.assertEqual(item['stock'], 10)

    def test_productos_list_filtro_categoria(self):
        """GET /api/tienda/productos/?categoria=X filtra por categoría."""
        response = self.client_api.get(f'{BASE}/productos/', {'categoria': self.categoria.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreaterEqual(len(data['results']), 1)
        for r in data['results']:
            self.assertEqual(r['categoria'], 'Motor')

    def test_productos_list_filtro_marca(self):
        """GET /api/tienda/productos/?marca=X filtra por marca."""
        response = self.client_api.get(f'{BASE}/productos/', {'marca': self.marca.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreaterEqual(len(data['results']), 1)
        for r in data['results']:
            self.assertEqual(r['marca'], 'Honda')

    def test_productos_list_filtro_search(self):
        """GET /api/tienda/productos/?search=X filtra por búsqueda."""
        response = self.client_api.get(f'{BASE}/productos/', {'search': 'Piston'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreaterEqual(len(data['results']), 1)
        response2 = self.client_api.get(f'{BASE}/productos/', {'search': 'inexistente123'})
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response2.json()['results']), 0)

    def test_productos_list_paginacion(self):
        """GET /api/tienda/productos/ respeta page y page_size."""
        response = self.client_api.get(f'{BASE}/productos/', {'page': 1, 'page_size': 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertLessEqual(len(data['results']), 5)
        self.assertEqual(data['current_page'], 1)

    def test_producto_detail_sin_auth(self):
        """GET /api/tienda/productos/<id>/ devuelve detalle sin auth."""
        response = self.client_api.get(f'{BASE}/productos/{self.variante.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['id'], self.variante.id)
        self.assertEqual(data['codigo'], 'PISTON-HONDA-001')
        self.assertEqual(data['stock'], 10)
        self.assertIn('descripcion', data)

    def test_producto_detail_404(self):
        """GET /api/tienda/productos/99999/ devuelve 404."""
        response = self.client_api.get(f'{BASE}/productos/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_categorias_list_sin_auth(self):
        """GET /api/tienda/categorias/ devuelve categorías activas."""
        response = self.client_api.get(f'{BASE}/categorias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        nombres = [c['nombre'] for c in data]
        self.assertIn('Motor', nombres)

    def test_marcas_list_sin_auth(self):
        """GET /api/tienda/marcas/ devuelve marcas activas."""
        response = self.client_api.get(f'{BASE}/marcas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        nombres = [m['nombre'] for m in data]
        self.assertIn('Honda', nombres)

    def test_puntos_retiro_list_sin_auth(self):
        """GET /api/tienda/puntos-retiro/ devuelve puntos activos."""
        response = self.client_api.get(f'{BASE}/puntos-retiro/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        nombres = [p['nombre'] for p in data]
        self.assertIn('Casa Central Avila', nombres)

    def test_pedido_create_ok(self):
        """POST /api/tienda/pedidos/ crea venta y descuenta stock."""
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 2, 'precio_unitario': 230},
            ],
            'datos_cliente': {'nombre': 'Juan Test', 'email': 'juan@test.com', 'telefono': '123456'},
            'observaciones': 'Pedido tienda web',
        }
        response = self.client_api.post(
            f'{BASE}/pedidos/',
            data=payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data.get('ok'))
        self.assertIn('venta_numero', data)
        self.assertEqual(data['total'], '460.00')

        venta = Venta.objects.get(numero=data['venta_numero'])
        self.assertEqual(venta.detalles.count(), 1)
        self.assertEqual(venta.total, Decimal('460.00'))

        stock = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock.cantidad, 8)

        mov = MovimientoStock.objects.filter(
            variante=self.variante,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        ).first()
        self.assertIsNotNone(mov)
        self.assertEqual(mov.cantidad, -2)

    def test_pedido_create_envio_ok(self):
        """POST /api/tienda/pedidos/ con tipo_entrega=envio agrega info de envío y costo en observaciones y total incluye envío."""
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 1, 'precio_unitario': 230},
            ],
            'datos_cliente': {
                'nombre': 'Cliente Envío',
                'email': 'envio@test.com',
                'telefono': '123456',
                'direccion': 'Calle Falsa 123',
                'localidad': 'Córdoba',
                'cp': '5000',
                'provincia': 'Córdoba',
            },
            'tipo_entrega': 'envio',
        }
        response = self.client_api.post(
            f'{BASE}/pedidos/',
            data=payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data.get('ok'))
        venta = Venta.objects.get(numero=data['venta_numero'])
        # Subtotal = 230, costo_envio según lógica = 1500 => total 1730
        self.assertEqual(venta.subtotal, Decimal('230.00'))
        self.assertEqual(venta.total, Decimal('1730.00'))
        mov = MovimientoStock.objects.filter(
            referencia_tipo='venta',
            referencia_id=venta.id,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        ).first()
        self.assertIsNotNone(mov)
        self.assertIn('ENVÍO A DOMICILIO', mov.observaciones or '')

    def test_pedido_create_envio_con_coordenadas_ok(self):
        """POST /api/tienda/pedidos/ con tipo_entrega=envio y coordenadas agrega ubicación de mapa en observaciones."""
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 1, 'precio_unitario': 230},
            ],
            'datos_cliente': {
                'nombre': 'Cliente Envío Mapa',
                'direccion': 'Calle Falsa 123',
                'localidad': 'Córdoba',
            },
            'tipo_entrega': 'envio',
            'lat_entrega': -31.4201,
            'lng_entrega': -64.1888,
        }
        response = self.client_api.post(
            f'{BASE}/pedidos/',
            data=payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data.get('ok'))
        venta = Venta.objects.get(numero=data['venta_numero'])
        mov = MovimientoStock.objects.filter(
            referencia_tipo='venta',
            referencia_id=venta.id,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        ).first()
        self.assertIsNotNone(mov)
        self.assertIn('Ubicación mapa', mov.observaciones or '')

    def test_pedido_create_retiro_ok(self):
        """POST /api/tienda/pedidos/ con tipo_entrega=retiro agrega info de retiro en observaciones."""
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 1, 'precio_unitario': 230},
            ],
            'datos_cliente': {'nombre': 'Cliente Retiro'},
            'tipo_entrega': 'retiro',
            'punto_retiro_id': self.punto_retiro.id,
        }
        response = self.client_api.post(
            f'{BASE}/pedidos/',
            data=payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data.get('ok'))
        venta = Venta.objects.get(numero=data['venta_numero'])
        # La información de retiro se agrega en las observaciones del movimiento de stock
        from apps.inventario.models import MovimientoStock
        mov = MovimientoStock.objects.filter(
            referencia_tipo='venta',
            referencia_id=venta.id,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        ).first()
        self.assertIsNotNone(mov)
        self.assertIn('RETIRO EN LOCAL', mov.observaciones or '')

    def test_pedido_create_sin_line_items_400(self):
        """POST con line_items vacío devuelve 400."""
        response = self.client_api.post(
            f'{BASE}/pedidos/',
            data={'line_items': []},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    def test_pedido_create_stock_insuficiente_400(self):
        """POST con cantidad mayor al stock devuelve 400."""
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 999},
            ],
        }
        response = self.client_api.post(f'{BASE}/pedidos/', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn('stock insuficiente', str(data.get('detalle', [])))

    def test_productos_sin_deposito_503(self):
        """Sin depósito principal, productos_list devuelve 503."""
        self.deposito.es_principal = False
        self.deposito.save()
        response = self.client_api.get(f'{BASE}/productos/')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('depósito', response.json().get('error', '').lower())
        self.deposito.es_principal = True
        self.deposito.save()

    def test_mercadopago_crear_preferencia_para_venta_web(self):
        """POST /api/tienda/mercadopago/preferencia/ crea preferencia para venta web."""
        # Crear primero un pedido web (reutiliza lógica existente)
        payload = {
            'line_items': [
                {'variante_id': self.variante.id, 'cantidad': 1, 'precio_unitario': 230},
            ],
            'datos_cliente': {'nombre': 'Cliente MP'},
            'tipo_entrega': 'retiro',
            'punto_retiro_id': self.punto_retiro.id,
        }
        resp_pedido = self.client_api.post(f'{BASE}/pedidos/', data=payload, format='json')
        self.assertEqual(resp_pedido.status_code, status.HTTP_201_CREATED)
        data_pedido = resp_pedido.json()
        venta = Venta.objects.get(numero=data_pedido['venta_numero'])

        # Crear preferencia de pago para esa venta
        resp_pref = self.client_api.post(
            f'{BASE}/mercadopago/preferencia/',
            data={'venta_id': venta.id},
            format='json',
        )
        self.assertEqual(resp_pref.status_code, status.HTTP_200_OK)
        pref = resp_pref.json()
        self.assertIn('id', pref)
        self.assertIn('init_point', pref)
        self.assertTrue(pref['init_point'].startswith('https://www.mercadopago.com/'))


class TiendaAdminAPITestCase(TestCase):
    """Tests de endpoints admin (requieren autenticación)."""

    def setUp(self):
        self.client_api = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin_tienda',
            email='admin@test.com',
            password='testpass123',
        )
        self.client_api.force_authenticate(user=self.admin)
        self.deposito = Deposito.objects.create(
            nombre='Depósito Principal',
            activo=True,
            es_principal=True,
        )
        self.marca = Marca.objects.create(nombre='Honda', activo=True)
        self.categoria = Categoria.objects.create(nombre='Motor', activo=True)
        from apps.productos.models import ProductoBase
        self.producto = ProductoBase.objects.create(
            nombre='Pistón',
            marca=self.marca,
            categoria=self.categoria,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='P-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('200'),
            precio_web=Decimal('180'),
            activo=True,
        )
        from apps.inventario.models import Stock
        Stock.objects.create(variante=self.variante, deposito=self.deposito, cantidad=5)
        self.venta = Venta.objects.create(
            numero=1,
            usuario=self.admin,
            deposito=self.deposito,
            subtotal=Decimal('360'),
            total=Decimal('360'),
            metodo_pago=Venta.MetodoPago.TRANSFERENCIA,
            estado=Venta.EstadoVenta.COMPLETADA,
        )
        MovimientoStock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
            cantidad=-2,
            usuario=self.admin,
            referencia_tipo='venta',
            referencia_id=self.venta.id,
            stock_anterior=5,
            stock_posterior=3,
        )

    def test_admin_pedidos_requiere_auth(self):
        """GET /api/tienda/admin/pedidos/ sin auth devuelve 401."""
        self.client_api.force_authenticate(user=None)
        response = self.client_api.get(f'{BASE}/admin/pedidos/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_pedidos_list_ok(self):
        """GET /api/tienda/admin/pedidos/ con auth devuelve pedidos web."""
        response = self.client_api.get(f'{BASE}/admin/pedidos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertGreaterEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['numero'], self.venta.numero)

    def test_admin_pedido_detail_ok(self):
        """GET /api/tienda/admin/pedidos/<id>/ con auth devuelve detalle."""
        response = self.client_api.get(f'{BASE}/admin/pedidos/{self.venta.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['numero'], self.venta.numero)
