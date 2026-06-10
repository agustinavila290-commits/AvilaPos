"""
Script para actualizar precio_tarjeta en productos existentes
Por defecto calcula: precio_tarjeta = precio_mostrador * 1.10 (10% recargo)
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.productos.models import VarianteProducto
from decimal import Decimal

def actualizar_precios_tarjeta(recargo_porcentaje=10):
    """
    Actualiza el precio_tarjeta de todas las variantes
    
    Args:
        recargo_porcentaje: Porcentaje de recargo sobre precio_mostrador (default: 10)
    """
    variantes = VarianteProducto.objects.filter(precio_tarjeta=Decimal('0.00'))
    
    if variantes.count() == 0:
        print("✅ No hay variantes para actualizar (todas tienen precio_tarjeta)")
        return
    
    print(f"📊 Encontradas {variantes.count()} variantes sin precio_tarjeta")
    print(f"💳 Aplicando {recargo_porcentaje}% de recargo sobre precio_mostrador\n")
    
    actualizadas = 0
    
    for variante in variantes:
        # Calcular precio con recargo
        recargo = Decimal(recargo_porcentaje) / Decimal('100')
        precio_tarjeta = variante.precio_mostrador * (Decimal('1') + recargo)
        
        # Actualizar
        variante.precio_tarjeta = precio_tarjeta
        variante.save()
        
        actualizadas += 1
        print(f"✓ {variante.nombre_completo}")
        print(f"  Precio Mostrador: ${variante.precio_mostrador}")
        print(f"  Precio Tarjeta:   ${precio_tarjeta}")
        print()
    
    print(f"\n✅ {actualizadas} variantes actualizadas correctamente")

if __name__ == '__main__':
    print("=" * 60)
    print("   ACTUALIZACIÓN DE PRECIOS CON TARJETA")
    print("=" * 60)
    print()
    
    # Puedes cambiar el porcentaje aquí si deseas otro recargo
    actualizar_precios_tarjeta(recargo_porcentaje=10)
    
    print("\n" + "=" * 60)
    print("   COMPLETADO")
    print("=" * 60)
