import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useFavoritos } from '../../context/FavoritosContext'

const PLACEHOLDER = (
  <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
)

export default function ProductCard({ producto }) {
  const { agregarConToast } = useCarrito()
  const { esFavorito, toggleFavorito } = useFavoritos()
  const precio = parseFloat(producto.precio_web)
  const sinStock = producto.stock <= 0
  const nombre = producto.nombre_completo.charAt(0).toUpperCase() + producto.nombre_completo.slice(1).toLowerCase()
  const marca = producto.marca ? producto.marca.charAt(0).toUpperCase() + producto.marca.slice(1).toLowerCase() : ''
  const favorito = esFavorito(producto.id)

  function agregarAlCarrito(e) {
    e.preventDefault()
    if (sinStock) return
    agregarConToast({
      id: producto.id,
      nombre,
      precio_web: precio,
      imagen_url: producto.imagen_url,
    })
  }

  function handleFavorito(e) {
    e.preventDefault()
    toggleFavorito(producto.id)
  }

  return (
    <Link to={`/producto/${producto.id}`} className="card group flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {producto.imagen_url
          ? <img
              src={producto.imagen_url}
              alt={producto.nombre_completo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          : PLACEHOLDER
        }
        {sinStock && (
          <span className="absolute top-2 left-2 bg-brand-muted text-white text-xs font-semibold px-2 py-0.5 rounded">
            Sin stock
          </span>
        )}
        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <svg className={`w-4 h-4 transition-colors ${favorito ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {marca && (
          <span className="text-xs text-brand-muted uppercase tracking-wide font-medium">
            {marca}
          </span>
        )}
        <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">
          {nombre}
        </p>
        <p className="text-brand-blue font-bold text-base mt-auto pt-2">
          ${precio.toLocaleString('es-AR')}
        </p>
        <button
          onClick={agregarAlCarrito}
          disabled={sinStock}
          className="mt-2 w-full btn-primary text-sm py-1.5 disabled:opacity-40"
        >
          {sinStock ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>
    </Link>
  )
}
