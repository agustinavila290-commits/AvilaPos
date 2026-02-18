"""
Tests del módulo reportes.
Incluye: exportación Excel de ventas por período y productos más vendidos.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta

from apps.ventas.models import Venta
from apps.clientes.models import Cliente
from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from apps.inventario.models import Deposito
User = get_user_model()


class ExportReportesTestCase(TestCase):
    """Tests de exportación Excel desde reportes."""

    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            username='admin_export',
            password='testpass123',
            rol='ADMINISTRADOR',
            first_name='Admin',
            last_name='Test'
        )
        self.client_api.force_authenticate(user=self.user)

        self.marca = Marca.objects.create(nombre='Marca Test', activo=True)
        self.categoria = Categoria.objects.create(nombre='Cat Test', activo=True)
        self.producto = ProductoBase.objects.create(
            nombre='Producto Test',
            marca=self.marca,
            categoria=self.categoria,
            activo=True
        )
        self.variante = VarianteProducto.objects.create(
            producto_base=self.producto,
            nombre_variante='STD',
            codigo='EXP-TEST-001',
            costo=Decimal('100'),
            precio_mostrador=Decimal('200'),
            precio_web=Decimal('180'),
            activo=True
        )
        self.deposito = Deposito.objects.create(nombre='Dep Test', activo=True, es_principal=True)
        self.cliente = Cliente.objects.create(
            nombre='Cliente Test',
            dni='20123456789',
            telefono='',
            activo=True
        )

    def test_export_ventas_periodo_excel_sin_fechas_retorna_400(self):
        """Sin fecha_desde/fecha_hasta retorna 400."""
        response = self.client_api.get('/api/reportes/ventas/periodo/export-excel/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_ventas_periodo_excel_con_fechas_retorna_excel(self):
        """Con fecha_desde y fecha_hasta retorna 200 y Content-Type Excel."""
        hoy = date.today()
        response = self.client_api.get(
            '/api/reportes/ventas/periodo/export-excel/',
            {
                'fecha_desde': (hoy - timedelta(days=30)).strftime('%Y-%m-%d'),
                'fecha_hasta': hoy.strftime('%Y-%m-%d'),
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(
            'spreadsheetml.sheet',
            response.get('Content-Type', ''),
            msg='Debe ser archivo Excel'
        )
        self.assertIn('attachment', response.get('Content-Disposition', ''))

    def test_export_productos_mas_vendidos_excel_retorna_excel(self):
        """Export productos más vendidos retorna 200 y archivo Excel."""
        response = self.client_api.get(
            '/api/reportes/productos/mas-vendidos/export-excel/',
            {'limite': 10}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(
            'spreadsheetml.sheet',
            response.get('Content-Type', ''),
            msg='Debe ser archivo Excel'
        )
        self.assertIn('attachment', response.get('Content-Disposition', ''))
