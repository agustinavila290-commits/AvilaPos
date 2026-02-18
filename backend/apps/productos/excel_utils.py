"""
Utilidades para importación de productos desde Excel.
Mapeo de encabezados (con aliases en español) y conversión de celdas.
"""
from decimal import Decimal

# Mínimo necesario para crear una variante
EXCEL_REQUIRED_COLUMNS = [
    'codigo', 'nombre_producto', 'marca', 'costo', 'precio_mostrador',
]
# Opcionales con valor por defecto si faltan
EXCEL_OPTIONAL_COLUMNS = {
    'nombre_variante': 'Única',
    'categoria': 'General',
    'precio_web': 0,
}

# Nombres aceptados por columna (normalizados a minúsculas, espacios -> _)
EXCEL_HEADER_ALIASES = {
    'codigo': ['codigo', 'código', 'cod', 'sku', 'codigo de barras'],
    'nombre_producto': ['nombre_producto', 'nombre producto', 'producto', 'descripcion', 'descripción'],
    'nombre_variante': ['nombre_variante', 'nombre variante', 'variante', 'modelo'],
    'marca': ['marca', 'brand'],
    'categoria': ['categoria', 'categoría', 'rubro'],
    'costo': ['costo', 'costo unitario', 'precio costo'],
    'precio_mostrador': ['precio_mostrador', 'precio mostrador', 'precio', 'precio venta', 'pv'],
    'precio_web': ['precio_web', 'precio web'],
    'stock_inicial': ['stock_inicial', 'stock inicial', 'stock'],
}


def normalize_header(val):
    """Normaliza un encabezado para comparación."""
    if val is None:
        return ''
    return str(val).strip().lower().replace(' ', '_')


def get_excel_header_map(raw_headers):
    """
    Dado una lista de encabezados (fila 1 del Excel), devuelve un dict
    { normalized_header: internal_name } para las columnas reconocidas.
    """
    norm_to_internal = {}
    for internal, aliases in EXCEL_HEADER_ALIASES.items():
        norm_to_internal[internal] = internal
        for a in aliases:
            norm_to_internal[normalize_header(a)] = internal
    out = {}
    for h in raw_headers:
        norm = normalize_header(h)
        if norm and norm in norm_to_internal:
            out[norm] = norm_to_internal[norm]
    return out


def cell_str(val):
    """Convierte valor de celda a string (para nombre, código, etc.)."""
    if val is None:
        return ''
    if isinstance(val, float) and val == int(val):
        return str(int(val))
    return str(val).strip()


def cell_number(val):
    """Convierte valor de celda a Decimal (para costo, precios)."""
    if val is None or val == '':
        return Decimal('0')
    if isinstance(val, (int, float)):
        return Decimal(str(round(float(val), 2)))
    return Decimal(str(val).strip().replace(',', '.'))


def cell_int(val):
    """Convierte valor de celda a int (para stock_inicial, etc.)."""
    if val is None or val == '':
        return 0
    if isinstance(val, (int, float)):
        return int(round(float(val)))
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return 0
