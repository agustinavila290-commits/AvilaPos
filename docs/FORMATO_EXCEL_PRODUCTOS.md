# Formato Excel para importar productos

## Cómo verificar tu archivo

Desde la carpeta **backend** del proyecto ejecutá:

```bash
python scripts/verificar_excel_productos.py "C:\Users\Agustin\Desktop\123.xlsx"
```

El script muestra las columnas que tiene tu Excel y si coinciden con las requeridas.

## Columnas requeridas

La **primera fila** del Excel debe ser la de encabezados. El sistema acepta estos nombres (o equivalentes):

| Nombre interno    | Acepta también (ejemplos)        |
|-------------------|-----------------------------------|
| `codigo`          | Código, CODIGO, SKU               |
| `nombre_producto`| Nombre producto, Producto, Descripción |
| `nombre_variante` | Nombre variante, Variante, Modelo |
| `marca`           | Marca, Brand                      |
| `categoria`       | Categoría, Rubro                 |
| `costo`           | Costo, Costo unitario             |
| `precio_mostrador`| Precio mostrador, Precio, PV      |
| `precio_web`       | Precio web                        |

- Se ignoran mayúsculas/minúsculas y espacios (ej. "Nombre Producto" = "nombre_producto").
- Los números (costo, precios) pueden ir con punto o coma decimal.

## Opcional

- **stock_inicial**: si existe la columna, se puede usar en el futuro para cargar stock al importar.

## Ejemplo de filas

| codigo   | nombre_producto   | nombre_variante | marca | categoria | costo   | precio_mostrador | precio_web |
|----------|--------------------|-----------------|-------|-----------|---------|------------------|------------|
| 789001   | Cámara moto        | STD             | Genérica | Accesorios | 1500.00 | 2500.00         | 2400.00    |
| 789002   | Cámara moto        | Ref. 2.50       | Genérica | Accesorios | 1600.00 | 2600.00         | 2500.00    |

## Dónde importar en el sistema

Menú **Productos** → **Importar productos** (o **Productos** → **Importar**). Solo usuarios administradores pueden importar.
