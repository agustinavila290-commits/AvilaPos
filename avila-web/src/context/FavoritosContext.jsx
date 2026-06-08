import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const FavoritosContext = createContext(null)
const STORAGE_KEY = 'avila_favoritos'

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return new Set(JSON.parse(saved))
  } catch {}
  return new Set()
}

export function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState(() => loadFromStorage())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoritos]))
  }, [favoritos])

  const toggleFavorito = useCallback((id) => {
    setFavoritos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const esFavorito = useCallback((id) => favoritos.has(id), [favoritos])

  return (
    <FavoritosContext.Provider value={{ favoritos, toggleFavorito, esFavorito, count: favoritos.size }}>
      {children}
    </FavoritosContext.Provider>
  )
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext)
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de FavoritosProvider')
  return ctx
}
