# Imágenes para productos (repuestos de motos)

Guía de **dónde conseguir imágenes** que podés usar en tu catálogo y **cómo usarlas** en el sistema.

---

## 1. Dónde buscar imágenes (libres o con licencia)

### Freepik
- **Sitio:** [freepik.es](https://www.freepik.es) → buscar "repuestos motos", "repuesto moto", "moto repuestos".
- **Qué hay:** Fotos, vectores, iconos de repuestos, motores, ruedas, frenos, cadenas, baterías, talleres, herramientas.
- **Uso:** Tienen opción gratuita (a veces con atribución). Revisá la licencia de cada imagen antes de usarla en el comercio.

### Unsplash
- **Sitio:** [unsplash.com](https://unsplash.com).
- **Buscar:** "motorcycle engine", "engine parts", "motorcycle", "mechanical parts".
- **Licencia:** Fotos gratuitas (Unsplash License), uso comercial sin atribución obligatoria. Muy útil para motores y piezas en general.

### Pexels
- **Sitio:** [pexels.com](https://www.pexels.com).
- **Buscar:** "motorcycle", "engine", "motor parts", "mechanic".
- **Licencia:** Gratuitas para uso comercial. Menos específicas de repuestos, pero sirven para motos y taller.

### Vecteezy
- **Sitio:** [vecteezy.com](https://www.vecteezy.com) → Free Photos → "motorcycle parts".
- **Qué hay:** Muchas fotos de repuestos y motores en alta resolución.
- **Licencia:** Revisar cada recurso; suelen tener opciones gratuitas con atribución.

---

## 2. Consejos al descargar

- **Formato:** JPG o PNG. Para fotos de producto, JPG suele ser suficiente y ocupa menos.
- **Tamaño:** 800–1200 px de ancho suele bastar para listados y ficha; el sistema puede redimensionar si hace falta.
- **Fondo:** Preferí fondos neutros (blanco, gris) para que el repuesto se vea claro en la ficha.

---

## 3. Cómo agregar la imagen al producto en tu sistema

El modelo de producto (**Producto base**) ya tiene un campo **Imagen** en el backend.

### Opción A: Desde el admin de Django (ya disponible)

1. Entrá al admin: `http://tu-dominio/admin/` (o `localhost:8000/admin/` en desarrollo).
2. Productos → **Productos base** (o **Producto bases**).
3. Abrí el producto al que querés poner la imagen.
4. En el campo **Imagen**, elegí el archivo que descargaste y guardá.

Las imágenes se guardan en `media/productos/` y se sirven con la URL que devuelve la API (por ejemplo `/media/productos/nombre.jpg`).

### Opción B: Desde la app (frontend)

Hoy el formulario de **Crear producto** y la pantalla de **Editar producto** (detalle de variante) **no tienen** todavía un campo para subir la imagen del producto base. Si más adelante querés que se pueda subir la foto desde la app, habría que:

- En **Crear producto:** enviar el formulario como `multipart/form-data` y agregar un `<input type="file" accept="image/*">` para la imagen del producto base.
- En **Detalle de producto:** permitir subir o cambiar la imagen del producto base (el backend ya expone el campo `imagen` en el producto).

Mientras tanto, podés usar el **admin de Django** para cargar las imágenes que bajes de Freepik, Unsplash, Pexels o Vecteezy.

---

## 4. Resumen rápido

| Fuente   | Tipo de contenido      | Licencia / uso        |
|----------|------------------------|------------------------|
| Freepik  | Fotos, vectores, iconos| Revisar (hay gratis)   |
| Unsplash | Fotos HD               | Uso comercial libre    |
| Pexels   | Fotos y videos         | Uso comercial libre    |
| Vecteezy | Fotos repuestos/motos  | Revisar (hay gratis)   |

Descargá la imagen desde la fuente que elijas y cargala en el producto desde el **admin de Django** (Productos → Productos base → Imagen). Si más adelante querés subir la imagen desde la app web, se puede agregar el campo de subida en los formularios de producto.
