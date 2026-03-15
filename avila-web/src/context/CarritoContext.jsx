import { createContext, useContext, useState, useEffect } from 'react';

const CarritoContext = createContext(null);

const STORAGE_KEY = 'avila_carrito';

function loadCarrito() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error loading carrito', e);
  }
  return [];
}

function saveCarrito(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving carrito', e);
  }
}

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(loadCarrito);

  useEffect(() => {
    saveCarrito(items);
  }, [items]);

  const agregar = (producto, cantidad = 1) => {
    const existente = items.find((i) => i.variante_id === producto.id);
    if (existente) {
      setItems(items.map((i) =>
        i.variante_id === producto.id
          ? { ...i, cantidad: i.cantidad + cantidad }
          : i
      ));
    } else {
      setItems([
        ...items,
        {
          variante_id: producto.id,
          codigo: producto.codigo,
          nombre_completo: producto.nombre_completo,
          precio_web: parseFloat(producto.precio_web) || 0,
          cantidad,
          imagen_url: producto.imagen_url,
        },
      ]);
    }
  };

  const actualizarCantidad = (varianteId, cantidad) => {
    if (cantidad < 1) {
      eliminar(varianteId);
      return;
    }
    setItems(items.map((i) =>
      i.variante_id === varianteId ? { ...i, cantidad } : i
    ));
  };

  const eliminar = (varianteId) => {
    setItems(items.filter((i) => i.variante_id !== varianteId));
  };

  const vaciar = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const totalMonto = items.reduce((s, i) => s + i.precio_web * i.cantidad, 0);

  const value = {
    items,
    totalItems,
    totalMonto,
    agregar,
    actualizarCantidad,
    eliminar,
    vaciar,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
}
