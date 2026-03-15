# Tests del proyecto Avila

## Backend (Django)

Los tests del backend usan el framework de Django y se ejecutan con:

```bash
cd backend
.\venv\Scripts\activate
python manage.py test apps.tienda.tests apps.woocommerce.tests apps.ventas.tests apps.productos.tests apps.inventario.tests apps.configuracion.tests --verbosity=1
```

O usando el batch:

```bash
backend\run_tests.bat
```

### App tienda (API pública)

- `apps/tienda/tests.py` — Tests de la API pública:
  - `GET /api/tienda/productos/` — listado, filtros (categoría, marca, búsqueda), paginación
  - `GET /api/tienda/productos/<id>/` — detalle, 404
  - `GET /api/tienda/categorias/`
  - `GET /api/tienda/marcas/`
  - `POST /api/tienda/pedidos/` — crear pedido, validaciones, stock insuficiente
  - Sin depósito principal → 503

## Frontend (avila-web)

Los tests del frontend usan Vitest y React Testing Library:

```bash
cd avila-web
npm run test
```

Con watch (re-ejecutar al guardar):

```bash
npm run test:watch
```

### Archivos de test

| Archivo | Qué prueba |
|---------|------------|
| `src/services/tiendaService.test.js` | Llamadas a la API (fetch mockeado) |
| `src/context/CarritoContext.test.jsx` | Agregar, actualizar, eliminar, vaciar carrito |
| `src/components/tienda/ProductCard.test.jsx` | Render, link, botón agregar, stock |
| `src/pages/home/index.test.jsx` | Home: texto, links |
| `src/pages/carrito/index.test.jsx` | Carrito vacío |
| `src/App.test.jsx` | App: layout, navegación |
