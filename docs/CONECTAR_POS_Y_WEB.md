# Cómo conectar los productos entre el POS y la web (forma sencilla)

## La idea en una frase

**El “código” del producto en el POS y el “SKU” en la tienda web tienen que ser el mismo.** Esa es la “llave” que usa el sistema para saber qué producto del POS es el mismo que en la web.

---

## 1. Qué es el “código” y el “SKU”

- **En el POS:** cada variante de producto tiene un **código** (ej: `ACEITE-1L`, `FILTRO-001`). Lo ves en Productos / variantes.
- **En la web (WooCommerce):** cada producto tiene un **SKU** (es lo mismo que el código, pero WooCommerce le dice SKU).

Si en el POS el código es `ACEITE-1L`, en la web ese mismo producto debe tener SKU = `ACEITE-1L`. Así el sistema puede “emparejar” un producto del POS con uno de la web.

---

## 2. Dos direcciones de la conexión

### De POS → Web (stock y precio)

- El POS tiene el stock y el **precio web** de cada producto.
- Un proceso (comando o tarea programada) **lee** esos datos del POS y **actualiza** en la web:
  - stock actual,
  - precio.
- La relación se hace por **código = SKU**: si en la web existe un producto con SKU `ACEITE-1L`, se actualiza ese; si no existe, se ignora (no se crean productos nuevos en la web desde el POS con este flujo).

**Resumen:** “Lo que hay en el POS (stock y precio web) se lleva a la web buscando por código/SKU.”

### De Web → POS (ventas)

- Cuando un cliente compra en la web, WooCommerce tiene un pedido con ítems (cada ítem tiene SKU y cantidad).
- Ese pedido se envía al POS. El POS:
  - busca cada ítem por **código** (el SKU del pedido),
  - crea una **venta** en el POS,
  - descuenta **stock** de ese depósito.

**Resumen:** “Cada venta de la web se registra en el POS como una venta y se descuenta stock, usando código = SKU.”

---

## 3. Pasos prácticos (resumidos)

1. **En el POS**
   - Que cada producto/variante que quieras vender en la web tenga **código** y **precio web** cargados.
   - Tener configurado el **depósito principal** (de ahí se toma el stock para la web y se descuenta en ventas web).

2. **En la web (WooCommerce)**
   - Crear (o tener) los mismos productos.
   - En cada producto, poner en **SKU** exactamente el mismo valor que el **código** del POS (ej: `ACEITE-1L`).
   - No hace falta que el nombre sea idéntico; lo que une es el código/SKU.

3. **Configuración de la integración**
   - En el POS (Configuración / integración):
     - **WOOCOMMERCE_API_KEY**: clave para que la web pueda llamar al POS (pedidos).
     - **WOOCOMMERCE_URL**, **WOOCOMMERCE_CONSUMER_KEY**, **WOOCOMMERCE_CONSUMER_SECRET**: para que el POS pueda actualizar productos en la web.

4. **Sincronizar POS → Web**
   - Ejecutar de forma periódica (o manual) el comando que actualiza stock y precio en la web (por ejemplo cada 5–15 minutos con una tarea programada).

5. **Recibir ventas de la web en el POS**
   - Configurar en WooCommerce un webhook “Order created” que envíe el pedido a la URL del POS (webhook de pedidos). El POS recibe el pedido, lo convierte en venta y descuenta stock por código/SKU.

---

## 4. Esquema rápido

```
POS (productos con "código" y "precio web")
    │
    │  código = SKU  ←—— esta es la “conexión” entre sistemas
    │
Web (productos con "SKU")

POS → Web:  “Actualizo en la web el stock y precio de los que tengan el mismo código/SKU.”
Web → POS: “Cada pedido de la web lo registro como venta en el POS y descuento stock por código/SKU.”
```

---

## 5. Dónde está cada cosa en el proyecto

- **Documentación técnica** de la integración: `backend/apps/woocommerce/README.md`
- **Configuración inicial** (claves WooCommerce, etc.): se puede definir en el script de configuración del backend o en Admin → Configuración.
- **Comando para sincronizar** POS → Web: `python manage.py sync_woocommerce` (desde la carpeta `backend`).

Si querés, en el siguiente paso podemos bajar a un solo flujo (solo “POS → Web” o solo “Web → POS”) y escribirlo paso a paso con pantallas o comandos exactos.
