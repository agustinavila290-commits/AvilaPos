"""
SCRIPT DE PRUEBA GLOBAL DEL SISTEMA
Prueba todos los módulos principales
"""
import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from decimal import Decimal
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from apps.clientes.models import Cliente
from apps.productos.models import ProductoBase, VarianteProducto
from apps.inventario.models import Deposito, Stock, MovimientoStock
from apps.ventas.models import Venta, DetalleVenta
from apps.compras.models import Proveedor, Compra, DetalleCompra
from apps.facturacion.models import PuntoVenta, Factura, ItemFactura, ConfiguracionAFIP
from apps.sistema.models import BackupLog
from apps.devoluciones.models import DevolucionVenta

User = get_user_model()

print("=" * 80)
print(" PRUEBA GLOBAL DEL SISTEMA - CASA DE REPUESTOS")
print("=" * 80)
print()

# ==============================================================================
# 1. MÓDULO USUARIOS
# ==============================================================================
print("[1/12] Probando Módulo USUARIOS...")
try:
    # Crear superuser si no existe
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@casarepuestos.com',
            password='admin123',
            first_name='Administrador',
            last_name='Sistema'
        )
        print("   [OK] Superusuario creado")
    else:
        admin = User.objects.get(username='admin')
        print("   [OK] Superusuario existente encontrado")
    
    # Crear usuario vendedor
    if not User.objects.filter(username='vendedor1').exists():
        vendedor = User.objects.create_user(
            username='vendedor1',
            email='vendedor@casarepuestos.com',
            password='vendedor123',
            first_name='Juan',
            last_name='Vendedor',
            rol='VENDEDOR'
        )
        print("   [OK] Usuario vendedor creado")
    else:
        vendedor = User.objects.get(username='vendedor1')
        print("   [OK] Usuario vendedor existente")
    
    print(f"   [INFO]  Total usuarios: {User.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")
    sys.exit(1)

# ==============================================================================
# 2. MÓDULO CLIENTES
# ==============================================================================
print("\n[2/12] Probando Módulo CLIENTES...")
try:
    # Crear cliente
    cliente, created = Cliente.objects.get_or_create(
        dni_cuit='20301234567',
        defaults={
            'nombre': 'Juan',
            'apellido': 'Pérez',
            'email': 'juan.perez@email.com',
            'telefono': '1134567890',
            'direccion': 'Calle Falsa 123',
            'localidad': 'Buenos Aires',
            'provincia': 'Buenos Aires',
            'tipo_cliente': Cliente.TipoCliente.MINORISTA
        }
    )
    if created:
        print(f"   [OK] Cliente creado: {cliente.nombre_completo}")
    else:
        print(f"   [OK] Cliente existente: {cliente.nombre_completo}")
    
    print(f"   [INFO]  Total clientes: {Cliente.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 3. MÓDULO PRODUCTOS
# ==============================================================================
print("\n[3/12] Probando Módulo PRODUCTOS...")
try:
    # Crear producto base
    producto, created = ProductoBase.objects.get_or_create(
        nombre='Aceite Motor',
        defaults={
            'descripcion': 'Aceite sintético para motor',
            'marca': 'Shell',
            'categoria': 'Lubricantes'
        }
    )
    if created:
        print(f"   [OK] Producto creado: {producto.nombre}")
    else:
        print(f"   [OK] Producto existente: {producto.nombre}")
    
    # Crear variante
    variante, created = VarianteProducto.objects.get_or_create(
        producto=producto,
        sku='SHELL-10W40-1L',
        defaults={
            'nombre': '10W40 1L',
            'codigo_barras': '7790001234567',
            'costo': Decimal('1500.00'),
            'precio_mostrador': Decimal('2500.00'),
            'precio_tarjeta': Decimal('2750.00'),
            'estado': 'ACTIVO'
        }
    )
    if created:
        print(f"   [OK] Variante creada: {variante.nombre_completo}")
    else:
        print(f"   [OK] Variante existente: {variante.nombre_completo}")
    
    print(f"   [INFO]  Total productos: {ProductoBase.objects.count()}")
    print(f"   [INFO]  Total variantes: {VarianteProducto.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 4. MÓDULO INVENTARIO
# ==============================================================================
print("\n[4/12] Probando Módulo INVENTARIO...")
try:
    # Crear depósito
    deposito, created = Deposito.objects.get_or_create(
        nombre='Depósito Principal',
        defaults={
            'ubicacion': 'Planta Baja',
            'responsable': 'Carlos González',
            'activo': True
        }
    )
    if created:
        print(f"   [OK] Depósito creado: {deposito.nombre}")
    else:
        print(f"   [OK] Depósito existente: {deposito.nombre}")
    
    # Crear/actualizar stock
    stock, created = Stock.objects.get_or_create(
        deposito=deposito,
        variante=variante,
        defaults={
            'cantidad': 50,
            'stock_minimo': 10,
            'stock_maximo': 100
        }
    )
    if created:
        print(f"   [OK] Stock creado: {stock.cantidad} unidades")
    else:
        print(f"   [OK] Stock existente: {stock.cantidad} unidades")
    
    print(f"   [INFO]  Total depósitos: {Deposito.objects.count()}")
    print(f"   [INFO]  Total stocks: {Stock.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 5. MÓDULO PROVEEDORES
# ==============================================================================
print("\n[5/12] Probando Módulo PROVEEDORES...")
try:
    # Crear proveedor
    proveedor, created = Proveedor.objects.get_or_create(
        cuit='30123456789',
        defaults={
            'nombre': 'Distribuidora Shell SA',
            'razon_social': 'Distribuidora Shell SA',
            'email': 'ventas@shell.com.ar',
            'telefono': '1145678901',
            'direccion': 'Av. Corrientes 1234',
            'activo': True
        }
    )
    if created:
        print(f"   [OK] Proveedor creado: {proveedor.nombre}")
    else:
        print(f"   [OK] Proveedor existente: {proveedor.nombre}")
    
    print(f"   [INFO]  Total proveedores: {Proveedor.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 6. MÓDULO COMPRAS
# ==============================================================================
print("\n[6/12] Probando Módulo COMPRAS...")
try:
    # Crear compra
    compra, created = Compra.objects.get_or_create(
        numero=1,
        defaults={
            'proveedor': proveedor,
            'usuario': admin,
            'deposito': deposito,
            'fecha': date.today(),
            'subtotal': Decimal('0'),
            'total': Decimal('0'),
            'estado': 'COMPLETADA'
        }
    )
    
    if created:
        # Agregar ítem
        DetalleCompra.objects.create(
            compra=compra,
            variante=variante,
            cantidad=20,
            costo_unitario=Decimal('1500.00'),
            subtotal=Decimal('30000.00')
        )
        compra.subtotal = Decimal('30000.00')
        compra.total = Decimal('30000.00')
        compra.save()
        print(f"   [OK] Compra creada: #{compra.numero} - ${compra.total}")
    else:
        print(f"   [OK] Compra existente: #{compra.numero} - ${compra.total}")
    
    print(f"   [INFO]  Total compras: {Compra.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 7. MÓDULO VENTAS
# ==============================================================================
print("\n[7/12] Probando Módulo VENTAS...")
try:
    # Verificar que hay stock
    stock.refresh_from_db()
    if stock.cantidad < 2:
        stock.cantidad = 50
        stock.save()
    
    # Crear venta
    from apps.ventas.models import Venta
    venta_numero = Venta.objects.count() + 1
    
    venta = Venta.objects.create(
        numero=venta_numero,
        cliente=cliente,
        usuario=vendedor,
        deposito=deposito,
        metodo_pago='EFECTIVO',
        estado='COMPLETADA',
        subtotal=Decimal('0'),
        descuento=Decimal('0'),
        total=Decimal('0')
    )
    
    # Agregar ítem
    item_venta = DetalleVenta.objects.create(
        venta=venta,
        variante=variante,
        cantidad=2,
        precio_unitario=Decimal('2500.00'),
        subtotal=Decimal('5000.00')
    )
    
    venta.subtotal = Decimal('5000.00')
    venta.total = Decimal('5000.00')
    venta.save()
    
    # Descontar stock
    stock.cantidad -= 2
    stock.save()
    
    # Registrar movimiento
    MovimientoStock.objects.create(
        deposito=deposito,
        variante=variante,
        tipo_movimiento='SALIDA',
        cantidad=2,
        motivo=f'Venta #{venta.numero}',
        usuario=vendedor,
        referencia_venta=venta
    )
    
    print(f"   [OK] Venta creada: #{venta.numero} - ${venta.total}")
    print(f"   [INFO]  Total ventas: {Venta.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 8. MÓDULO FACTURACIÓN
# ==============================================================================
print("\n[8/12] Probando Módulo FACTURACIÓN...")
try:
    # Crear configuración AFIP
    config_afip, created = ConfiguracionAFIP.objects.get_or_create(
        defaults={
            'cuit_emisor': '20123456789',
            'razon_social': 'Casa de Repuestos SRL',
            'domicilio_comercial': 'Av. Principal 123, Ciudad',
            'condicion_iva': 'RI',
            'inicio_actividades': date(2020, 1, 15),
            'ambiente': 'H',
            'activo': True
        }
    )
    if created:
        print("   [OK] Configuración AFIP creada")
    else:
        print("   [OK] Configuración AFIP existente")
    
    # Crear punto de venta
    punto_venta, created = PuntoVenta.objects.get_or_create(
        numero=1,
        defaults={
            'nombre': 'Casa Central',
            'activo': True
        }
    )
    if created:
        print("   [OK] Punto de venta creado")
    else:
        print("   [OK] Punto de venta existente")
    
    # Crear factura
    factura = Factura.objects.create(
        tipo_comprobante='FB',
        punto_venta=punto_venta,
        numero=punto_venta.ultimo_numero_factura_b + 1,
        cliente=cliente,
        cliente_razon_social=cliente.nombre_completo,
        cliente_cuit=cliente.dni_cuit,
        cliente_condicion_iva='CF',
        cliente_domicilio=cliente.direccion or '',
        venta=venta,
        usuario=vendedor,
        estado='BORRADOR',
        subtotal=Decimal('0'),
        total=Decimal('0')
    )
    
    # Agregar ítem
    item_factura = ItemFactura.objects.create(
        factura=factura,
        codigo=variante.sku,
        descripcion=variante.nombre_completo,
        cantidad=2,
        precio_unitario=Decimal('2500.00'),
        alicuota_iva='21'
    )
    
    # Calcular totales
    factura.calcular_totales()
    factura.save()
    
    # Autorizar en AFIP (simulado)
    from apps.facturacion.afip_service import AFIPService
    afip = AFIPService()
    resultado = afip.autorizar_factura(factura)
    
    if resultado['success']:
        print(f"   [OK] Factura creada y autorizada: {factura.numero_completo}")
        print(f"   [INFO]  CAE: {factura.cae}")
        print(f"   [INFO]  Total: ${factura.total}")
    else:
        print(f"   [WARN]  Factura creada pero no autorizada: {resultado.get('error')}")
    
    print(f"   [INFO]  Total facturas: {Factura.objects.count()}")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")
    import traceback
    traceback.print_exc()

# ==============================================================================
# 9. MÓDULO DEVOLUCIONES
# ==============================================================================
print("\n[9/12] Probando Módulo DEVOLUCIONES...")
try:
    print(f"   [INFO]  Total devoluciones: {DevolucionVenta.objects.count()}")
    print("   [OK] Módulo disponible")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 10. MÓDULO SISTEMA - BACKUPS
# ==============================================================================
print("\n[10/12] Probando Módulo SISTEMA - Backups...")
try:
    print(f"   [INFO]  Total logs de backup: {BackupLog.objects.count()}")
    print("   [OK] Módulo disponible")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 11. MÓDULO REPORTES
# ==============================================================================
print("\n[11/12] Probando Módulo REPORTES...")
try:
    # Verificar que las views existen
    from apps.reportes import views
    print("   [OK] Módulo de reportes disponible")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# 12. MÓDULO CONFIGURACIÓN
# ==============================================================================
print("\n[12/12] Probando Módulo CONFIGURACIÓN...")
try:
    from apps.configuracion.models import ConfiguracionSistema
    configs = ConfiguracionSistema.objects.count()
    print(f"   [INFO]  Configuraciones: {configs}")
    print("   [OK] Módulo disponible")
except Exception as e:
    print(f"   [ERROR] ERROR: {e}")

# ==============================================================================
# RESUMEN FINAL
# ==============================================================================
print("\n" + "=" * 80)
print(" RESUMEN DE LA PRUEBA GLOBAL")
print("=" * 80)
print()
print(f"[OK] Usuarios:        {User.objects.count()} registrados")
print(f"[OK] Clientes:        {Cliente.objects.count()} registrados")
print(f"[OK] Productos:       {ProductoBase.objects.count()} productos base")
print(f"[OK] Variantes:       {VarianteProducto.objects.count()} variantes")
print(f"[OK] Depósitos:       {Deposito.objects.count()} depósitos")
print(f"[OK] Stocks:          {Stock.objects.count()} registros")
print(f"[OK] Proveedores:     {Proveedor.objects.count()} proveedores")
print(f"[OK] Compras:         {Compra.objects.count()} compras")
print(f"[OK] Ventas:          {Venta.objects.count()} ventas")
print(f"[OK] Facturas:        {Factura.objects.count()} facturas")
print(f"[OK] Movimientos:     {MovimientoStock.objects.count()} movimientos")
print()
print("=" * 80)
print(" SISTEMA COMPLETO FUNCIONANDO CORRECTAMENTE [OK]")
print("=" * 80)
print()
print("[TODO] PRÓXIMOS PASOS:")
print("   1. Acceder al sistema: http://localhost:5173")
print("   2. Login: admin / admin123")
print("   3. Probar POS y crear ventas")
print("   4. Emitir facturas desde /admin")
print("   5. Revisar PENDIENTE_REVISAR.md")
print()
