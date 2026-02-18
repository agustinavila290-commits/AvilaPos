"""
Script para verificar si un Excel tiene el formato esperado para importar productos.
Uso: python scripts/verificar_excel_productos.py "C:\ruta\a\tu\archivo.xlsx"
"""
import sys
import os

# Permite ejecutar desde la raíz del backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import openpyxl
except ImportError:
    print("Instalá openpyxl: pip install openpyxl")
    sys.exit(1)

REQUERIDAS = [
    'codigo', 'nombre_producto', 'nombre_variante', 'marca',
    'categoria', 'costo', 'precio_mostrador', 'precio_web'
]

# Nombres alternativos que aceptamos (minúsculas, sin espacios extra)
ALIAS = {
    'codigo': ['codigo', 'código', 'cod', 'sku', 'codigo de barras'],
    'nombre_producto': ['nombre_producto', 'nombre producto', 'producto', 'descripcion', 'descripción'],
    'nombre_variante': ['nombre_variante', 'nombre variante', 'variante', 'modelo'],
    'marca': ['marca', 'brand'],
    'categoria': ['categoria', 'categoría', 'rubro'],
    'costo': ['costo', 'costo unitario', 'precio costo'],
    'precio_mostrador': ['precio_mostrador', 'precio mostrador', 'precio', 'precio venta', 'pv'],
    'precio_web': ['precio_web', 'precio web', 'precio web'],
}


def normalizar(s):
    if s is None:
        return ''
    return str(s).strip().lower()


def verificar(ruta):
    if not os.path.isfile(ruta):
        print(f"ERROR: No existe el archivo: {ruta}")
        return False
    if not ruta.lower().endswith(('.xlsx', '.xls')):
        print("ERROR: El archivo debe ser .xlsx o .xls")
        return False
    if ruta.lower().endswith('.xls'):
        print("AVISO: .xls puede requerir xlrd. Probá con .xlsx.")
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    hoja = wb.active
    headers = [cell.value for cell in hoja[1]]
    headers_norm = [normalizar(h) for h in headers]
    print("Columnas en tu Excel (fila 1):")
    for i, h in enumerate(headers):
        print(f"  {i+1}. {repr(h)}")
    print()
    faltan = []
    mapeo = {}
    for req in REQUERIDAS:
        encontrado = False
        for idx, h in enumerate(headers_norm):
            if not h:
                continue
            if h == req or h.replace(' ', '_') == req:
                mapeo[req] = headers[idx]
                encontrado = True
                break
            for alias in ALIAS.get(req, [req]):
                if h == alias or h.replace(' ', '_') == alias.replace(' ', '_'):
                    mapeo[req] = headers[idx]
                    encontrado = True
                    break
            if encontrado:
                break
        if not encontrado:
            faltan.append(req)
    if not faltan:
        print("OK: Tu Excel tiene todas las columnas requeridas (o equivalentes).")
        print("Mapeo detectado:")
        for k, v in mapeo.items():
            print(f"  {k} <- {repr(v)}")
        return True
    print("FALTAN estas columnas (o equivalentes) en la primera fila:")
    for c in faltan:
        print(f"  - {c}")
    print("\nColumnas requeridas exactas: " + ", ".join(REQUERIDAS))
    return False


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python scripts/verificar_excel_productos.py \"ruta\\a\\archivo.xlsx\"")
        print("Ejemplo: python scripts/verificar_excel_productos.py \"C:\\Users\\Agustin\\Desktop\\123.xlsx\"")
        sys.exit(2)
    ruta = sys.argv[1]
    ok = verificar(ruta)
    sys.exit(0 if ok else 1)
