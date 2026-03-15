"""
Script para crear configuraciones iniciales del sistema.
Ejecutar: python crear_configuracion_inicial.py
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.configuracion.models import Configuracion


def crear_configuraciones():
    """Crea configuraciones iniciales del sistema"""
    
    print("=== Creando Configuraciones Iniciales ===\n")
    
    configuraciones = [
        # INVENTARIO
        {
            'clave': 'UMBRAL_STOCK_BAJO',
            'valor': '5',
            'tipo_dato': Configuracion.TipoDato.INTEGER,
            'descripcion': 'Cantidad de unidades para considerar stock bajo',
            'categoria': 'INVENTARIO',
            'es_editable': True
        },
        {
            'clave': 'UMBRAL_STOCK_CRITICO',
            'valor': '2',
            'tipo_dato': Configuracion.TipoDato.INTEGER,
            'descripcion': 'Cantidad de unidades para considerar stock crítico',
            'categoria': 'INVENTARIO',
            'es_editable': True
        },
        {
            'clave': 'PERMITIR_STOCK_NEGATIVO',
            'valor': 'true',
            'tipo_dato': Configuracion.TipoDato.BOOLEAN,
            'descripcion': 'Permitir que el stock sea negativo (ventas sin stock)',
            'categoria': 'INVENTARIO',
            'es_editable': True
        },
        
        # VENTAS
        {
            'clave': 'UMBRAL_MARGEN_BAJO',
            'valor': '5.0',
            'tipo_dato': Configuracion.TipoDato.DECIMAL,
            'descripcion': 'Porcentaje de margen para considerar bajo (generar alerta)',
            'categoria': 'VENTAS',
            'es_editable': True
        },
        {
            'clave': 'DESCUENTO_MAX_CAJERO',
            'valor': '10.0',
            'tipo_dato': Configuracion.TipoDato.DECIMAL,
            'descripcion': 'Porcentaje máximo de descuento que puede aplicar un cajero',
            'categoria': 'VENTAS',
            'es_editable': True
        },
        {
            'clave': 'DESCUENTO_MAX_ADMIN',
            'valor': '50.0',
            'tipo_dato': Configuracion.TipoDato.DECIMAL,
            'descripcion': 'Porcentaje máximo de descuento que puede aplicar un administrador',
            'categoria': 'VENTAS',
            'es_editable': True
        },
        {
            'clave': 'CLIENTE_OBLIGATORIO',
            'valor': 'true',
            'tipo_dato': Configuracion.TipoDato.BOOLEAN,
            'descripcion': 'Requiere cliente en todas las ventas',
            'categoria': 'VENTAS',
            'es_editable': True
        },
        {
            'clave': 'ALERTAR_MARGEN_BAJO',
            'valor': 'true',
            'tipo_dato': Configuracion.TipoDato.BOOLEAN,
            'descripcion': 'Mostrar alerta cuando el margen es bajo',
            'categoria': 'VENTAS',
            'es_editable': True
        },
        
        # GENERAL
        {
            'clave': 'NOMBRE_EMPRESA',
            'valor': 'Casa de Repuestos',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Nombre de la empresa',
            'categoria': 'GENERAL',
            'es_editable': True
        },
        {
            'clave': 'TELEFONO_EMPRESA',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Teléfono de contacto de la empresa',
            'categoria': 'GENERAL',
            'es_editable': True
        },
        {
            'clave': 'DIRECCION_EMPRESA',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Dirección de la empresa',
            'categoria': 'GENERAL',
            'es_editable': True
        },
        {
            'clave': 'CUIT_EMPRESA',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'CUIT de la empresa',
            'categoria': 'GENERAL',
            'es_editable': True
        },
        
        # REPORTES
        {
            'clave': 'LIMITE_PRODUCTOS_TOP',
            'valor': '20',
            'tipo_dato': Configuracion.TipoDato.INTEGER,
            'descripcion': 'Cantidad de productos a mostrar en el ranking de más vendidos',
            'categoria': 'REPORTES',
            'es_editable': True
        },
        {
            'clave': 'DIAS_REPORTE_DEFECTO',
            'valor': '30',
            'tipo_dato': Configuracion.TipoDato.INTEGER,
            'descripcion': 'Cantidad de días por defecto para reportes de ventas',
            'categoria': 'REPORTES',
            'es_editable': True
        },
        
        # SISTEMA
        {
            'clave': 'VERSION_SISTEMA',
            'valor': '0.9.0',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Versión actual del sistema',
            'categoria': 'SISTEMA',
            'es_editable': False
        },
        {
            'clave': 'MODO_MANTENIMIENTO',
            'valor': 'false',
            'tipo_dato': Configuracion.TipoDato.BOOLEAN,
            'descripcion': 'Activar modo mantenimiento (solo admin puede acceder)',
            'categoria': 'SISTEMA',
            'es_editable': True
        },

        # INTEGRACIÓN WOOCOMMERCE (tienda web)
        {
            'clave': 'WOOCOMMERCE_API_KEY',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'API Key para sincronización con WooCommerce (header X-API-Key). Generar una clave segura y configurarla aquí y en el script de sync.',
            'categoria': 'INTEGRACION',
            'es_editable': True
        },
        {
            'clave': 'WOOCOMMERCE_URL',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'URL base de la tienda WooCommerce (ej. https://avilamotorepuesto.com.ar). Sin barra final.',
            'categoria': 'INTEGRACION',
            'es_editable': True
        },
        {
            'clave': 'WOOCOMMERCE_CONSUMER_KEY',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Consumer key de la API WooCommerce (WooCommerce → Ajustes → Avanzado → REST API).',
            'categoria': 'INTEGRACION',
            'es_editable': True
        },
        {
            'clave': 'WOOCOMMERCE_CONSUMER_SECRET',
            'valor': '',
            'tipo_dato': Configuracion.TipoDato.STRING,
            'descripcion': 'Consumer secret de la API WooCommerce.',
            'categoria': 'INTEGRACION',
            'es_editable': True
        },
    ]
    
    creados = 0
    actualizados = 0
    
    for config_data in configuraciones:
        config, created = Configuracion.objects.get_or_create(
            clave=config_data['clave'],
            defaults=config_data
        )
        
        if created:
            print(f"[OK] {config_data['clave']} = {config_data['valor']}")
            creados += 1
        else:
            print(f"[SKIP] {config_data['clave']} ya existe")
            actualizados += 1
    
    print(f"\n=== Resumen ===")
    print(f"Configuraciones creadas: {creados}")
    print(f"Configuraciones existentes: {actualizados}")
    print(f"Total: {creados + actualizados}")
    
    # Mostrar por categoría
    print(f"\n=== Por Categoría ===")
    categorias = Configuracion.objects.values_list('categoria', flat=True).distinct()
    for categoria in categorias:
        count = Configuracion.objects.filter(categoria=categoria).count()
        print(f"{categoria}: {count} parámetros")
    
    print("\n[OK] Configuraciones iniciales creadas exitosamente!")


if __name__ == '__main__':
    try:
        crear_configuraciones()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
