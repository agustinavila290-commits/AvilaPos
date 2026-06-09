import { createContext, useContext, useReducer, useState, useEffect, useCallback } from 'react'

const CarritoContext = createContext(null)
const STORAGE_KEY = 'avila_carrito'

function carritoReducer(state, action) {
  switch (action.type) {
    case 'AGREGAR': {
      const existente = state.items.find(i => i.id === action.producto.id)
      if (existente) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.producto.id
              ? { ...i, cantidad: i.cantidad + 1 }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.producto, cantidad: 1 }] }
    }
    case 'QUITAR':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'CAMBIAR_CANTIDAD': {
      if (action.cantidad <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, cantidad: action.cantidad } : i
        ),
      }
    }
    case 'VACIAR':
      return { items: [] }
    default:
      return state
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Compatibilidad: formato viejo era array directo, nuevo es { items: [] }
      if (Array.isArray(parsed)) return { items: parsed }
      if (parsed && Array.isArray(parsed.items)) return parsed
    }
  } catch {}
  return { items: [] }
}

export function CarritoProvider({ children }) {
  const [state, dispatch] = useReducer(carritoReducer, null, loadFromStorage)
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const agregarConToast = useCallback((producto) => {
    dispatch({ type: 'AGREGAR', producto })
    setToastMsg(producto.nombre || 'Producto')
    setTimeout(() => setToastMsg(null), 2500)
  }, [])

  const totalItems = state.items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = state.items.reduce((acc, i) => acc + i.precio_web * i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{ items: state.items, totalItems, totalPrecio, dispatch, agregarConToast, toastMsg }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return ctx
}
