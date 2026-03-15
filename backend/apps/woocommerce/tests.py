"""
Tests de la integración WooCommerce.
Endpoints: productos-stock (GET), pedido-recibido (POST).
Autenticación por X-API-Key.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.configuracion.models import Configuracion
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock, MovimientoStock
from apps.ventas.models import Venta

User = get_user_model()

API_KEY = 'test-woo-api-key-12345'


class WooCommerceProductosStockTestCase(TestCase):
    """Tests del endpoint GET /api/woocommerce/productos-stock/"""

    def setUp(self):
        Configuracion.objects.create(
            clave='WOOCOMMERCE_API_KEY',
            valor=API_KEY,
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='API Key para integración WooCommerce',
            categoria='INTEGRACION',
        )
        self.deposito = Deposito.objects.create(
            nombre='Dep Principal',
            activo=True,
            es_principal=True,
        )
        self.admin = User.objects.create_user(
            username='admin_woo',
            password='testpass',
            rol=User.Rol.ADMINISTRADOR,
            is_staff=True,
            is_superuser=True,
        )
        marca = Marca.objects.create(nombre='MarcaTest', activo=True)
        cat = Categoria.objects.create(nombre='CatTest', activo=True)
        pb = ProductoBase.objects.create(
            nombre='Producto Test',
            marca=marca,
            categoria=cat,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=pb,
            nombre_variante='STD',
            codigo='WOOTEST-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('200'),
            precio_web=Decimal('180'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=10,
        )
        self.client = APIClient()

    def test_productos_stock_sin_api_key_403(self):
        """Sin X-API-Key debe devolver 403 o 401."""
        response = self.client.get('/api/woocommerce/productos-stock/')
        self.assertIn(response.status_code, (401, 403))

    def test_productos_stock_con_api_key_200(self):
        """Con X-API-Key correcta devuelve lista de variantes con stock."""
        response = self.client.get(
            '/api/woocommerce/productos-stock/',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
        item = next((x for x in response.data if x['codigo'] == 'WOOTEST-001'), None)
        self.assertIsNotNone(item)
        self.assertEqual(item['id'], self.variante.id)
        self.assertEqual(item['stock'], 10)
        self.assertEqual(item['precio_web'], '180.00')

    def test_productos_stock_api_key_incorrecta_403(self):
        """Con API key incorrecta devuelve 401 o 403."""
        response = self.client.get(
            '/api/woocommerce/productos-stock/',
            HTTP_X_API_KEY='key-mal',
        )
        self.assertIn(response.status_code, (401, 403))


class WooCommercePedidoRecibidoTestCase(TestCase):
    """Tests del endpoint POST /api/woocommerce/pedido-recibido/"""

    def setUp(self):
        Configuracion.objects.create(
            clave='WOOCOMMERCE_API_KEY',
            valor=API_KEY,
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='API Key WooCommerce',
            categoria='INTEGRACION',
        )
        self.deposito = Deposito.objects.create(
            nombre='Dep Principal',
            activo=True,
            es_principal=True,
        )
        self.admin = User.objects.create_user(
            username='admin_woo2',
            password='testpass',
            rol=User.Rol.ADMINISTRADOR,
            is_staff=True,
            is_superuser=True,
        )
        marca = Marca.objects.create(nombre='Marca2', activo=True)
        cat = Categoria.objects.create(nombre='Cat2', activo=True)
        pb = ProductoBase.objects.create(
            nombre='Producto Web',
            marca=marca,
            categoria=cat,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=pb,
            nombre_variante='STD',
            codigo='WEB-001',
            costo=Decimal('50'),
            precio_mostrador=Decimal('120'),
            precio_web=Decimal('110'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=5,
        )
        self.client = APIClient()

    def test_pedido_recibido_sin_api_key_403(self):
        """Sin X-API-Key debe devolver 401 o 403."""
        response = self.client.post(
            '/api/woocommerce/pedido-recibido/',
            data={'line_items': [{'codigo': 'WEB-001', 'cantidad': 1}]},
            format='json',
        )
        self.assertIn(response.status_code, (401, 403))

    def test_pedido_recibido_crea_venta_y_descuenta_stock(self):
        """Con line_items válidos crea venta y descuenta stock (VENTA_WEB)."""
        response = self.client.post(
            '/api/woocommerce/pedido-recibido/',
            data={
                'line_items': [
                    {'codigo': 'WEB-001', 'cantidad': 2},
                ],
                'observaciones': 'Pedido prueba test',
            },
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('venta_numero', response.data)
        self.assertEqual(response.data['total'], '220.00')  # 2 * 110

        venta = Venta.objects.get(id=response.data['venta_id'])
        self.assertEqual(venta.detalles.count(), 1)
        self.assertEqual(venta.cliente, None)
        self.assertEqual(venta.usuario_id, self.admin.id)
        self.assertEqual(venta.deposito_id, self.deposito.id)

        stock_actual = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock_actual.cantidad, 3)  # 5 - 2

        mov = MovimientoStock.objects.filter(
            variante=self.variante,
            tipo=MovimientoStock.TipoMovimiento.VENTA_WEB,
        ).first()
        self.assertIsNotNone(mov)
        self.assertEqual(mov.cantidad, -2)

    def test_pedido_recibido_line_items_vacios_400(self):
        """line_items vacío devuelve 400."""
        response = self.client.post(
            '/api/woocommerce/pedido-recibido/',
            data={'line_items': []},
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 400)

    def test_pedido_recibido_codigo_inexistente_400(self):
        """Código de producto inexistente devuelve 400."""
        response = self.client.post(
            '/api/woocommerce/pedido-recibido/',
            data={
                'line_items': [{'codigo': 'NO-EXISTE-999', 'cantidad': 1}],
            },
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('detalle', response.data)

    def test_pedido_recibido_stock_insuficiente_400(self):
        """Stock insuficiente devuelve 400."""
        response = self.client.post(
            '/api/woocommerce/pedido-recibido/',
            data={
                'line_items': [{'codigo': 'WEB-001', 'cantidad': 999}],
            },
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('stock insuficiente', str(response.data).lower())


# --- Fase 2: Configuración WooCommerce ---


class WooCommerceConfigTestCase(TestCase):
    """Tests de lectura de configuración WooCommerce (Fase 2)."""

    def setUp(self):
        from apps.woocommerce.config import get_woocommerce_config, woocommerce_sync_configured
        self.get_config = get_woocommerce_config
        self.sync_configured = woocommerce_sync_configured

    def test_get_woocommerce_config_vacio_sin_config(self):
        """Sin configurar, devuelve strings vacíos."""
        cfg = self.get_config()
        self.assertEqual(cfg['api_key'], '')
        self.assertEqual(cfg['url'], '')
        self.assertEqual(cfg['consumer_key'], '')
        self.assertEqual(cfg['consumer_secret'], '')

    def test_get_woocommerce_config_lee_valores(self):
        """Lee correctamente los valores de Configuracion."""
        Configuracion.objects.create(
            clave='WOOCOMMERCE_URL',
            valor='https://tienda.ejemplo.com',
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='URL',
            categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_KEY',
            valor='ck_abc',
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='Key',
            categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_SECRET',
            valor='cs_secret',
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='Secret',
            categoria='INTEGRACION',
        )
        cfg = self.get_config()
        self.assertEqual(cfg['url'], 'https://tienda.ejemplo.com')
        self.assertEqual(cfg['consumer_key'], 'ck_abc')
        self.assertEqual(cfg['consumer_secret'], 'cs_secret')

    def test_woocommerce_sync_configured_false_sin_datos(self):
        """woocommerce_sync_configured es False si faltan URL o credenciales."""
        self.assertFalse(self.sync_configured())

    def test_woocommerce_sync_configured_true_con_todo(self):
        """woocommerce_sync_configured es True con URL y consumer key/secret."""
        Configuracion.objects.create(
            clave='WOOCOMMERCE_URL', valor='https://x.com',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_KEY', valor='ck_x',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_SECRET', valor='cs_x',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        self.assertTrue(self.sync_configured())


# --- Fase 3: Sync POS → WooCommerce ---


class WooCommerceSyncServiceTestCase(TestCase):
    """Tests del servicio de sincronización POS → WooCommerce (Fase 3)."""

    def setUp(self):
        self.deposito = Deposito.objects.create(
            nombre='Dep Sync',
            activo=True,
            es_principal=True,
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_URL', valor='https://tienda.test',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_KEY', valor='ck_test',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        Configuracion.objects.create(
            clave='WOOCOMMERCE_CONSUMER_SECRET', valor='cs_test',
            tipo_dato=Configuracion.TipoDato.STRING, descripcion='', categoria='INTEGRACION',
        )
        marca = Marca.objects.create(nombre='M', activo=True)
        cat = Categoria.objects.create(nombre='C', activo=True)
        pb = ProductoBase.objects.create(nombre='Prod Sync', marca=marca, categoria=cat, activo=True)
        self.variante = VarianteProducto.objects.create(
            producto_base=pb,
            nombre_variante='STD',
            codigo='SYNC-001',
            costo=Decimal('10'),
            precio_mostrador=Decimal('20'),
            precio_web=Decimal('18'),
            activo=True,
        )
        Stock.objects.create(variante=self.variante, deposito=self.deposito, cantidad=7)

    def test_get_productos_con_stock_estructura(self):
        """get_productos_con_stock devuelve lista con id, codigo, nombre_completo, precio_web, stock."""
        from apps.woocommerce.services import get_productos_con_stock
        result = get_productos_con_stock()
        self.assertGreaterEqual(len(result), 1)
        item = next((x for x in result if x['codigo'] == 'SYNC-001'), None)
        self.assertIsNotNone(item)
        self.assertEqual(item['id'], self.variante.id)
        self.assertEqual(item['codigo'], 'SYNC-001')
        self.assertEqual(item['stock'], 7)
        self.assertEqual(item['precio_web'], '18.00')

    def test_run_sync_con_mock_actualiza_woocommerce(self):
        """run_sync con WooCommerce mockeado actualiza los productos que existen por SKU."""
        from unittest.mock import patch
        from apps.woocommerce import services

        with patch.object(services, 'fetch_woo_products_map', return_value={'SYNC-001': {'id': 99, 'name': 'Prod'}}):
            with patch.object(services, 'update_woo_product_stock_price', return_value={'id': 99}):
                updated, err_count, errors = services.run_sync()
        self.assertEqual(updated, 1)
        self.assertEqual(err_count, 0)
        self.assertEqual(errors, [])

    def test_run_sync_sin_config_lanza_error(self):
        """run_sync sin URL/credenciales WooCommerce lanza ValueError."""
        from apps.woocommerce.services import run_sync
        Configuracion.objects.filter(clave='WOOCOMMERCE_URL').update(valor='')
        with self.assertRaises(ValueError) as ctx:
            run_sync()
        self.assertIn('WOOCOMMERCE', str(ctx.exception))


# --- Fase 4: Webhook pedido WooCommerce → POS ---


class WooCommerceWebhookTestCase(TestCase):
    """Tests del webhook POST /api/woocommerce/webhook-pedido/ (payload WooCommerce)."""

    def setUp(self):
        Configuracion.objects.create(
            clave='WOOCOMMERCE_API_KEY',
            valor=API_KEY,
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='API Key WooCommerce',
            categoria='INTEGRACION',
        )
        self.deposito = Deposito.objects.create(
            nombre='Dep Webhook',
            activo=True,
            es_principal=True,
        )
        self.admin = User.objects.create_user(
            username='admin_webhook',
            password='testpass',
            rol=User.Rol.ADMINISTRADOR,
            is_staff=True,
            is_superuser=True,
        )
        marca = Marca.objects.create(nombre='MarcaWebhook', activo=True)
        cat = Categoria.objects.create(nombre='CatWebhook', activo=True)
        pb = ProductoBase.objects.create(
            nombre='Producto Webhook',
            marca=marca,
            categoria=cat,
            activo=True,
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=pb,
            nombre_variante='STD',
            codigo='WEB-001',
            costo=Decimal('50'),
            precio_mostrador=Decimal('120'),
            precio_web=Decimal('110'),
            activo=True,
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=5,
        )
        self.client = APIClient()

    def test_webhook_pedido_crea_venta_y_descuenta_stock(self):
        """POST con payload WooCommerce crea venta y descuenta stock."""
        payload = {
            'id': 1,
            'number': '1',
            'line_items': [
                {'sku': 'WEB-001', 'quantity': 2, 'price': '110'},
            ],
        }
        response = self.client.post(
            '/api/woocommerce/webhook-pedido/',
            data=payload,
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get('ok'))
        self.assertIn('venta_numero', response.data)
        self.assertEqual(response.data['total'], '220.00')

        venta = Venta.objects.get(id=response.data['venta_id'])
        self.assertEqual(venta.detalles.count(), 1)
        stock_actual = Stock.objects.get(variante=self.variante, deposito=self.deposito)
        self.assertEqual(stock_actual.cantidad, 3)

    def test_webhook_pedido_sin_api_key_403(self):
        """Sin X-API-Key devuelve 401 o 403."""
        response = self.client.post(
            '/api/woocommerce/webhook-pedido/',
            data={'id': 1, 'line_items': [{'sku': 'WEB-001', 'quantity': 1, 'price': '110'}]},
            format='json',
        )
        self.assertIn(response.status_code, (401, 403))

    def test_webhook_pedido_sin_line_items_validos_400(self):
        """Payload sin line_items válidos (o vacíos) devuelve 400."""
        response = self.client.post(
            '/api/woocommerce/webhook-pedido/',
            data={'id': 1, 'number': '1', 'line_items': []},
            format='json',
            HTTP_X_API_KEY=API_KEY,
        )
        self.assertEqual(response.status_code, 400)
