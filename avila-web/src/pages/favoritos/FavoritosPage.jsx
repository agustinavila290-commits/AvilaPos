import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFavoritos } from '../../context/FavoritosContext'
import { tiendaApi } from '../../services/api'
import SEO from '../../components/SEO'
import ProductCard from '../../components/tienda/ProductCard'
import ProductCardSkeleton from '../../components/tienda/ProductCardSkeleton'

export default function FavoritosPage() {
  const { favoritos } = useFavoritos()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (favoritos.size === 0) {
      setProductos([])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all(
      [...favoritos].map(id =>
        tiendaApi.getProducto(id).then(r => r.data).catch(() => null)
      )
    )
      .then(results => setProductos(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [favoritos])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEO title="Mis favoritos" description="Tus productos guardados en Avila Moto Repuestos." />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Mis favoritos</h1>
        {productos.length > 0 && (
          <span className="text-sm text-brand-muted">{productos.length} producto{productos.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🤍</p>
          <p className="text-lg font-semibold text-brand-text mb-2">No tenés favoritos todavía</p>
          <p className="text-brand-muted text-sm mb-6">Tocá el corazón en cualquier producto para guardarlo acá</p>
          <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}
    </div>
  )
}
