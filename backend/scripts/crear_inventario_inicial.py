"""
Script para crear depósito y stock inicial de prueba.
Ejecutar: python crear_inventario_inicial.py
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.inventario.models import Deposito, Stock
from apps.inventario.services import InventarioService
from apps.productos.models import VarianteProducto
from apps.usuarios.models import Usuario


def crear_deposito_y_stock():
    """Crea depósito principal y stock inicial"""
    
    print("=== Creando Depósito y Stock Inicial ===\n")
    
    # 1. Crear depósito principal
    deposito, created = Deposito.objects.get_or_create(
        nombre='Depósito Central',
        defaults={
            'direccion': 'Av. Principal 123, Local 1',
            'activo': True,
            'es_principal': True
        }
    )
    
    if created:
        print(f"[OK] Deposito creado: {deposito.nombre}")
    else:
        print(f"[OK] Deposito existente: {deposito.nombre}")
    
    # 2. Obtener usuario admin para los movimientos
    try:
        admin = Usuario.objects.filter(rol='ADMINISTRADOR').first()
        if not admin:
            print("\n[ERROR] No hay usuarios administradores. Crea uno primero.")
            return
    except Exception as e:
        print(f"\n[ERROR] al obtener admin: {e}")
        return
    
    # 3. Asignar stock inicial a algunas variantes
    variantes = VarianteProducto.objects.all()[:10]  # Primeras 10 variantes
    
    if not variantes.exists():
        print("\n[ERROR] No hay variantes de productos. Ejecuta crear_datos_prueba.py primero.")
        return
    
    print(f"\n=== Asignando stock inicial a {variantes.count()} variantes ===\n")
    
    cantidades = [15, 8, 25, 3, 50, 12, 1, 30, 5, 20]
    
    for i, variante in enumerate(variantes):
        cantidad = cantidades[i] if i < len(cantidades) else 10
        
        # Verificar si ya tiene stock
        stock_actual = InventarioService.obtener_stock_actual(variante, deposito)
        
        if stock_actual == 0:
            # Crear inventario inicial
            movimiento = InventarioService.inventario_inicial(
                variante=variante,
                deposito=deposito,
                cantidad=cantidad,
                usuario=admin
            )
            
            estado = '[CRITICO]' if cantidad <= 2 else '[BAJO]' if cantidad <= 5 else '[OK]'
            print(f"{estado} {variante.sku}: {cantidad} unidades - {variante.nombre_completo}")
        else:
            print(f"[SKIP] {variante.sku}: Ya tiene stock ({stock_actual} unidades)")
    
    # 4. Resumen
    print("\n=== Resumen de Stock ===\n")
    
    stock_total = Stock.objects.filter(deposito=deposito)
    stock_critico = stock_total.filter(cantidad__lte=2)
    stock_bajo = stock_total.filter(cantidad__gt=2, cantidad__lte=5)
    stock_normal = stock_total.filter(cantidad__gt=5)
    
    print(f"Total de productos en stock: {stock_total.count()}")
    print(f"[CRITICO] Stock critico (<=2):  {stock_critico.count()}")
    print(f"[BAJO] Stock bajo (3-5):        {stock_bajo.count()}")
    print(f"[NORMAL] Stock normal (>5):     {stock_normal.count()}")
    
    if stock_critico.exists():
        print("\n[ATENCION] Productos con stock critico:")
        for stock in stock_critico:
            print(f"   - {stock.variante.sku}: {stock.cantidad} unidades")
    
    print("\n[OK] Deposito y stock inicial creados exitosamente!")


if __name__ == '__main__':
    try:
        crear_deposito_y_stock()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
