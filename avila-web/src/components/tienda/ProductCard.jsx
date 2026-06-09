import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useFavoritos } from '../../context/FavoritosContext'
import { WA_NUMBER } from '../../config'

const PLACEHOLDER = (
  <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
)

const WA_SVG = (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function ProductCard({ producto }) {
  const { agregarConToast } = useCarrito()
  const { esFavorito, toggleFavorito } = useFavoritos()
  const precio = parseFloat(producto.precio_web)
  const sinStock = producto.stock <= 0
  const nombre = producto.nombre_completo.charAt(0).toUpperCase() + producto.nombre_completo.slice(1).toLowerCase()
  const marca = producto.marca ? producto.marca.charAt(0).toUpperCase() + producto.marca.slice(1).toLowerCase() : ''
  const favorito = esFavorito(producto.id)

  const waConsultaUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hola! Quiero consultar disponibilidad de: ${nombre}${producto.codigo ? ` (Cód: ${producto.codigo})` : ''}`
  )}`

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

        {/* Badge sin stock */}
        {sinStock && (
          <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-semibold px-2 py-0.5 rounded">
            Sin stock
          </span>
        )}

        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <svg
            className={`w-4 h-4 transition-colors ${favorito ? 'text-brand-blue fill-brand-blue' : 'text-gray-400'}`}
            viewBox="0 0 24 24" stroke="currentColor" fill="none"
          >
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

        <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2 flex-1">
          {nombre}
        </p>

        {/* Motos compatibles */}
        {producto.motos_compatibles?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {producto.motos_compatibles.slice(0, 2).map(m => (
              <span key={m.id} className="text-xs bg-red-50 text-brand-blue border border-red-200 rounded-full px-2 py-0.5 leading-none">
                {m.marca} {m.modelo}
              </span>
            ))}
            {producto.motos_compatibles.length > 2 && (
              <span className="text-xs text-brand-muted">+{producto.motos_compatibles.length - 2}</span>
            )}
          </div>
        )}

        <p className="text-brand-blue font-bold text-base mt-auto pt-1">
          ${precio.toLocaleString('es-AR')}
        </p>

        {sinStock ? (
          <a
            href={waConsultaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="mt-1 w-full flex items-center justify-center gap-1.5 border border-brand-green text-brand-green font-semibold text-xs py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            {WA_SVG} Consultar disponibilidad
          </a>
        ) : (
          <button
            onClick={agregarAlCarrito}
            className="mt-1 w-full btn-primary text-sm py-1.5"
          >
            Agregar al carrito
          </button>
        )}
      </div>
    </Link>
  )
}
