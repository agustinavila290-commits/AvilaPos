"""
Tests para el módulo de configuración.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import Configuracion, ConfiguracionManager

User = get_user_model()


class ConfiguracionModelTestCase(TestCase):
    """Tests del modelo Configuracion y get_valor_convertido."""

    def test_crear_configuracion_string(self):
        c = Configuracion.objects.create(
            clave='TEST_STR',
            valor='hola',
            tipo_dato=Configuracion.TipoDato.STRING,
            descripcion='Test',
            categoria='TEST'
        )
        self.assertEqual(c.get_valor_convertido(), 'hola')

    def test_crear_configuracion_integer(self):
        c = Configuracion.objects.create(
            clave='TEST_INT',
            valor='42',
            tipo_dato=Configuracion.TipoDato.INTEGER,
            descripcion='Test',
            categoria='TEST'
        )
        self.assertEqual(c.get_valor_convertido(), 42)

    def test_crear_configuracion_decimal(self):
        c = Configuracion.objects.create(
            clave='TEST_DEC',
            valor='10.50',
            tipo_dato=Configuracion.TipoDato.DECIMAL,
            descripcion='Test',
            categoria='TEST'
        )
        self.assertEqual(c.get_valor_convertido(), Decimal('10.50'))

    def test_crear_configuracion_boolean(self):
        c = Configuracion.objects.create(
            clave='TEST_BOOL',
            valor='true',
            tipo_dato=Configuracion.TipoDato.BOOLEAN,
            descripcion='Test',
            categoria='TEST'
        )
        self.assertIs(c.get_valor_convertido(), True)

    def test_configuracion_manager_obtener_y_establecer(self):
        Configuracion.objects.create(
            clave='CLIENTE_OBLIGATORIO',
            valor='true',
            tipo_dato=Configuracion.TipoDato.BOOLEAN,
            descripcion='Cliente obligatorio en venta',
            categoria='VENTAS'
        )
        self.assertIs(ConfiguracionManager.obtener('CLIENTE_OBLIGATORIO'), True)
        self.assertIsNone(ConfiguracionManager.obtener('NO_EXISTE'))
        self.assertEqual(ConfiguracionManager.obtener('NO_EXISTE', default=99), 99)


class ConfiguracionPOSAPITestCase(TestCase):
    """Test del endpoint de configuración para el POS."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='cajero_cfg',
            password='test123',
            rol=User.Rol.CAJERO
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_configuracion_pos_retorna_claves(self):
        """GET /api/configuracion/pos/ devuelve un diccionario con las claves del POS."""
        response = self.client.get('/api/configuracion/pos/')  # ConfiguracionPOSView
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('CLIENTE_OBLIGATORIO', data)
        self.assertIn('DESCUENTO_MAX_CAJERO', data)
        self.assertIn('DESCUENTO_MAX_ADMIN', data)
        self.assertIn('ALERTAR_MARGEN_BAJO', data)
