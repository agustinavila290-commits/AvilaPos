"""
Tests del módulo inventario.
Incluye: umbral de stock crítico configurable, servicios de stock.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.configuracion.models import Configuracion
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock
from apps.inventario.services import InventarioService

User = get_user_model()


class UmbralStockCriticoTestCase(TestCase):
    """Tests del umbral de stock crítico leído de configuración."""

    def setUp(self):
        # Marca y categoría mínimos para producto
        self.marca = Marca.objects.create(nombre='Test Marca', activo=True)
        self.categoria = Categoria.objects.create(nombre='Test Cat', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Producto Test',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='TEST-UMBRAL-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('150'),
            precio_web=Decimal('140'),
            activo=True
        )
        self.deposito = Deposito.objects.create(
            nombre='Depósito Test',
            activo=True,
            es_principal=True
        )

    def test_es_critico_usar_default_cuando_no_hay_config(self):
        """Sin UMBRAL_STOCK_CRITICO en config, se usa 2 por defecto."""
        Configuracion.objects.filter(clave='UMBRAL_STOCK_CRITICO').delete()
        stock = Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=2
        )
        self.assertTrue(stock.es_critico)
        stock.cantidad = 3
        stock.save()
        self.assertFalse(stock.es_critico)

    def test_es_critico_usa_config_umbral_5(self):
        """Con UMBRAL_STOCK_CRITICO=5, cantidad 3 es crítico."""
        Configuracion.objects.update_or_create(
            clave='UMBRAL_STOCK_CRITICO',
            defaults={
                'valor': '5',
                'tipo_dato': Configuracion.TipoDato.INTEGER,
                'descripcion': 'Umbral test',
                'categoria': 'INVENTARIO',
                'es_editable': True,
            }
        )
        stock = Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=3
        )
        self.assertTrue(stock.es_critico)
        stock.cantidad = 6
        stock.save()
        self.assertFalse(stock.es_critico)

    def test_estado_usa_umbrales_config(self):
        """estado (CRITICO, BAJO, NORMAL) usa UMBRAL_STOCK_CRITICO y UMBRAL_STOCK_BAJO."""
        Configuracion.objects.update_or_create(
            clave='UMBRAL_STOCK_CRITICO',
            defaults={
                'valor': '2',
                'tipo_dato': Configuracion.TipoDato.INTEGER,
                'descripcion': 'Umbral crítico',
                'categoria': 'INVENTARIO',
                'es_editable': True,
            }
        )
        Configuracion.objects.update_or_create(
            clave='UMBRAL_STOCK_BAJO',
            defaults={
                'valor': '5',
                'tipo_dato': Configuracion.TipoDato.INTEGER,
                'descripcion': 'Umbral bajo',
                'categoria': 'INVENTARIO',
                'es_editable': True,
            }
        )
        stock = Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=1
        )
        self.assertEqual(stock.estado, 'CRITICO')
        stock.cantidad = 4
        stock.save()
        self.assertEqual(stock.estado, 'BAJO')
        stock.cantidad = 10
        stock.save()
        self.assertEqual(stock.estado, 'NORMAL')

    def test_obtener_stock_critico_usar_config_si_limite_no_pasado(self):
        """InventarioService.obtener_stock_critico(limite=None) usa config."""
        Configuracion.objects.update_or_create(
            clave='UMBRAL_STOCK_CRITICO',
            defaults={
                'valor': '10',
                'tipo_dato': Configuracion.TipoDato.INTEGER,
                'descripcion': 'Umbral test',
                'categoria': 'INVENTARIO',
                'es_editable': True,
            }
        )
        Stock.objects.create(
            variante=self.variante,
            deposito=self.deposito,
            cantidad=5
        )
        qs = InventarioService.obtener_stock_critico(deposito=self.deposito, limite=None)
        # Con umbral 10, cantidad 5 es crítico
        self.assertEqual(qs.count(), 1)
        qs2 = InventarioService.obtener_stock_critico(deposito=self.deposito, limite=2)
        self.assertEqual(qs2.count(), 0)
