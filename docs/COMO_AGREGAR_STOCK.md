# Cómo agregar stock

En el sistema hay **tres formas** de cargar o modificar el stock de productos.

---

## 1. Registrar una compra (recomendado para entradas nuevas)

Cuando comprás mercadería a un proveedor, el stock se carga desde **Compras → Registrar compra**.

### Pasos

1. En el menú, entrá a **Compras** y luego **Registrar compra**.
2. Elegí el **proveedor**.
3. El **depósito** suele venir ya elegido (depósito principal). Si tenés varios, seleccioná el correcto.
4. **Agregar productos**:
   - En “Buscar producto” escribí **código** o **nombre** y dale a Buscar.
   - En la lista, hacé clic en el producto para agregarlo a la compra.
   - En la grilla podés cambiar **cantidad**, **costo unitario** y si querés que se actualice costo/precio del producto.
5. Opcional: número de factura, fecha, observaciones.
6. **Confirmar compra**.

Al confirmar, el sistema:

- Crea o actualiza el stock de cada producto en el depósito elegido.
- Puede actualizar costo (y precio si lo marcaste) del producto.
- Registra el movimiento en el historial de inventario.

**Idea:** Esta es la forma normal de “dar de alta” stock cuando entra mercadería. Sirve tanto para productos nuevos (primera vez que tienen stock) como para reponer.

---

## 2. Ajuste manual de stock (para correcciones)

Sirve para **corregir** cantidades (inventario físico, errores, mermas, etc.). No reemplaza a “Registrar compra” para las compras reales.

### Pasos

1. En el menú, entrá a **Inventario**.
2. Elegí el **depósito** en el filtro (si tenés más de uno).
3. En la tabla verás los productos que **ya tienen** stock en ese depósito (aunque sea 0).
4. En la fila del producto que quieras corregir, hacé clic en **Ajustar**.
5. En la pantalla de ajuste:
   - **Nueva cantidad**: número al que querés dejar el stock (ej. 5, 10, 0).
   - **Observaciones**: motivo del ajuste (obligatorio, mínimo 10 caracteres).
6. Confirmá con el botón de guardar.

El sistema calcula la diferencia entre la cantidad actual y la nueva, registra un movimiento de tipo “Ajuste” y deja el stock en la cantidad que pusiste.

**Importante:** Solo usuarios **administrador** ven el botón **Ajustar**. Si un producto **nunca tuvo stock** en ese depósito, puede no aparecer en la lista de Inventario; en ese caso usá **Registrar compra** para darle stock la primera vez.

---

## 3. Importar productos con stock inicial (Excel)

Si cargás muchos productos desde Excel, podés incluir **stock inicial** en la planilla.

### Pasos

1. En **Productos** → **Importar Excel**.
2. Usá (o descargá) la plantilla que incluye la columna **stock_inicial**.
3. Completá una fila por **variante** (código, nombre, marca, categoría, costos, precios y **stock_inicial**).
4. Subí el archivo y confirmá la importación.

El sistema crea los productos y, para cada uno, puede crear movimiento de **inventario inicial** en el depósito principal (según cómo esté implementada la importación). Si no ves esa columna en la plantilla, en tu versión la importación podría no crear stock; en ese caso usá **Registrar compra** o **Ajustar** después.

---

## Resumen rápido

| Situación | Dónde | Acción |
|-----------|--------|--------|
| Llegó mercadería del proveedor | **Compras → Registrar compra** | Cargar compra con productos y cantidades. |
| Corregir cantidad (inventario, error, merma) | **Inventario** → en la fila del producto **Ajustar** | Poner nueva cantidad y observaciones. |
| Alta masiva con stock inicial | **Productos → Importar Excel** | Incluir columna `stock_inicial` en el archivo. |

---

## Depósito principal

El sistema usa un **depósito principal** para ventas y, por defecto, para compras. Si no lo tenés creado, puede fallar “Registrar compra” o no aparecer stock. En la base de datos debe existir al menos un depósito marcado como principal; si te falta, se puede crear con un comando del backend (por ejemplo `crear_deposito_principal` si existe en tu proyecto).

Si querés, en el siguiente paso podemos revisar que ese comando exista y cómo ejecutarlo en tu PC.
