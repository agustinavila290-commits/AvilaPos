"""
Tests del módulo productos.
Incluye: búsqueda de variantes por nombre/código (como en el POS).
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto

User = get_user_model()


class BusquedaVariantesTestCase(TestCase):
    """Tests de búsqueda de variantes (usado en POS)."""

    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            username='cajero_busqueda',
            password='testpass123',
            rol=User.Rol.CAJERO,
            first_name='Cajero',
            last_name='Busqueda'
        )
        self.client_api.force_authenticate(user=self.user)
        self.marca = Marca.objects.create(nombre='Honda', activo=True)
        self.categoria = Categoria.objects.create(nombre='Motor', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Pistón Honda CG 150',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.variante1 = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='PISTON-Honda-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('250'),
            precio_web=Decimal('230'),
            activo=True
        )
        self.variante2 = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='0.25',
            codigo='PISTON-Honda-025',
            costo=Decimal('105'),
            precio_mostrador=Decimal('260'),
            precio_web=Decimal('240'),
            activo=True
        )

    def test_busqueda_por_codigo_exacto(self):
        """GET /api/productos/variantes/?codigo=X devuelve la variante."""
        response = self.client_api.get(
            '/api/productos/variantes/',
            {'codigo': 'PISTON-Honda-001'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        if not isinstance(results, list):
            results = data.get('results', [])
        self.assertGreaterEqual(len(results), 1)
        codigos = [r.get('codigo') for r in results]
        self.assertIn('PISTON-Honda-001', codigos)

    def test_busqueda_por_nombre_palabra(self):
        """GET /api/productos/variantes/?search=Piston devuelve variantes del producto."""
        response = self.client_api.get(
            '/api/productos/variantes/',
            {'search': 'Piston'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        if not isinstance(results, list):
            results = data.get('results', [])
        self.assertGreaterEqual(len(results), 1)

    def test_busqueda_por_varias_palabras(self):
        """Búsqueda 'Honda Pistón' devuelve variantes que contengan ambas palabras."""
        response = self.client_api.get(
            '/api/productos/variantes/',
            {'search': 'Honda Piston'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        if not isinstance(results, list):
            results = data.get('results', [])
        self.assertGreaterEqual(len(results), 1)
