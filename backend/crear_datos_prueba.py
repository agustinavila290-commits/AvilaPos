#!/usr/bin/env python
"""Script para crear datos de prueba de productos"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.productos.models import Marca, Categoria, ProductoBase, VarianteProducto
from decimal import Decimal

print('[1/4] Creando marcas...')
# Crear marcas
marcas_data = ['Honda', 'Yamaha', 'Zanella', 'Suzuki', 'Kawasaki']
marcas = {}
for nombre in marcas_data:
    marca, created = Marca.objects.get_or_create(nombre=nombre, defaults={'activo': True})
    marcas[nombre] = marca
    if created:
        print(f'  + Marca creada: {nombre}')

print('[2/4] Creando categorias...')
# Crear categorías
categorias_data = ['Motor', 'Frenos', 'Transmision', 'Suspension', 'Electrica']
categorias = {}
for nombre in categorias_data:
    cat, created = Categoria.objects.get_or_create(nombre=nombre, defaults={'activo': True})
    categorias[nombre] = cat
    if created:
        print(f'  + Categoria creada: {nombre}')

print('[3/4] Creando productos...')
# Crear productos de prueba
productos_test = [
    {
        'nombre': 'Piston Honda CG 150',
        'marca': 'Honda',
        'categoria': 'Motor',
        'variantes': [
            {'variante': 'STD', 'costo': 1000, 'precio_mostrador': 1500, 'precio_web': 1400},
            {'variante': '0.25', 'costo': 1050, 'precio_mostrador': 1550, 'precio_web': 1450},
            {'variante': '0.50', 'costo': 1100, 'precio_mostrador': 1600, 'precio_web': 1500},
        ]
    },
    {
        'nombre': 'Pastilla Freno Delantera',
        'marca': 'Yamaha',
        'categoria': 'Frenos',
        'variantes': [
            {'variante': 'Original', 'costo': 800, 'precio_mostrador': 1200, 'precio_web': 1100},
        ]
    },
    {
        'nombre': 'Kit Transmision',
        'marca': 'Zanella',
        'categoria': 'Transmision',
        'variantes': [
            {'variante': '428', 'costo': 2500, 'precio_mostrador': 3500, 'precio_web': 3300},
            {'variante': '520', 'costo': 2800, 'precio_mostrador': 3800, 'precio_web': 3600},
        ]
    },
]

productos_creados = 0
variantes_creadas = 0

for prod_data in productos_test:
    # Crear o obtener producto base
    producto, created = ProductoBase.objects.get_or_create(
        nombre=prod_data['nombre'],
        marca=marcas[prod_data['marca']],
        defaults={
            'categoria': categorias[prod_data['categoria']],
            'activo': True
        }
    )
    
    if created:
        productos_creados += 1
        print(f'  + Producto: {prod_data["nombre"]}')
    
    # Crear variantes
    for idx, var_data in enumerate(prod_data['variantes'], 1):
        sku = f"{prod_data['marca'][:3].upper()}-{idx:04d}"
        
        variante, created = VarianteProducto.objects.get_or_create(
            sku=sku,
            defaults={
                'producto_base': producto,
                'nombre_variante': var_data['variante'],
                'costo': Decimal(str(var_data['costo'])),
                'precio_mostrador': Decimal(str(var_data['precio_mostrador'])),
                'precio_web': Decimal(str(var_data['precio_web'])),
                'activo': True
            }
        )
        
        if created:
            variantes_creadas += 1
            print(f'    - Variante: {var_data["variante"]} (SKU: {sku})')

print(f'\n[4/4] Resumen:')
print(f'  Marcas: {len(marcas)}')
print(f'  Categorias: {len(categorias)}')
print(f'  Productos creados: {productos_creados}')
print(f'  Variantes creadas: {variantes_creadas}')
print(f'\n[OK] Datos de prueba creados exitosamente!')
