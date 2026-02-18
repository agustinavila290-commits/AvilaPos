"""
Script para crear proveedores de prueba.
Ejecutar: python crear_proveedores_prueba.py
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.compras.models import Proveedor


def crear_proveedores():
    """Crea proveedores de prueba"""
    
    print("=== Creando Proveedores de Prueba ===\n")
    
    proveedores_data = [
        {
            'nombre': 'Repuestos Honda Oficial',
            'razon_social': 'Honda Repuestos S.A.',
            'cuit': '30-12345678-9',
            'telefono': '011-4444-5555',
            'email': 'ventas@hondarepuestos.com',
            'direccion': 'Av. Libertador 1234, CABA',
            'observaciones': 'Proveedor oficial de Honda. Entrega en 48hs.'
        },
        {
            'nombre': 'Yamaha Parts',
            'razon_social': 'Yamaha Argentina S.R.L.',
            'cuit': '30-98765432-1',
            'telefono': '011-5555-6666',
            'email': 'pedidos@yamahaparts.com.ar',
            'direccion': 'Ruta 8 Km 24, Pilar',
            'observaciones': 'Repuestos originales Yamaha'
        },
        {
            'nombre': 'Distribuidora Zanella',
            'razon_social': 'Zanella Motos Distribuidora',
            'cuit': '30-11223344-5',
            'telefono': '011-6666-7777',
            'email': 'info@zanelladistribuidora.com',
            'direccion': 'Av. Corrientes 5678, CABA'
        },
        {
            'nombre': 'Importadora Universal',
            'razon_social': 'Universal Repuestos S.A.',
            'cuit': '30-55667788-9',
            'telefono': '011-7777-8888',
            'email': 'ventas@universal.com',
            'direccion': 'Av. San Martin 999, Avellaneda',
            'observaciones': 'Proveedor mayorista. Minimo 10 unidades.'
        }
    ]
    
    for prov_data in proveedores_data:
        proveedor, created = Proveedor.objects.get_or_create(
            nombre=prov_data['nombre'],
            defaults=prov_data
        )
        
        if created:
            print(f"[OK] Proveedor creado: {proveedor.nombre}")
        else:
            print(f"[SKIP] Proveedor existente: {proveedor.nombre}")
    
    # Resumen
    print(f"\n=== Resumen ===")
    print(f"Total proveedores: {Proveedor.objects.count()}")
    print(f"Proveedores activos: {Proveedor.objects.filter(activo=True).count()}")
    
    print("\n[OK] Proveedores de prueba creados exitosamente!")


if __name__ == '__main__':
    try:
        crear_proveedores()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
