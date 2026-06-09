import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useFavoritos } from '../../context/FavoritosContext'
import { WA_NUMBER } from '../../config'
import StockBadge from '../ui/StockBadge'

const WA_SVG = (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function HeartIcon({ filled }) {
  return (
    <svg
      className={`w-4 h-4 transition-all duration-200 ${filled ? 'fill-brand-blue text-brand-blue scale-110' : 'text-gray-400 fill-none'}`}
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

// Placeholder visual con patrón de carbono
function ProductPlaceholder({ nombre }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-plate to-graphite carbon-pattern
                    flex flex-col items-center justify-center gap-2">
      <svg className="w-12 h-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-[9px] text-white/25 font-medium text-center px-2 leading-tight line-clamp-2 uppercase tracking-wide">
        {nombre}
      </span>
    </div>
  )
}

export default function ProductCard({ producto }) {
  const { agregarConToast } = useCarrito()
  const { esFavorito, toggleFavorito } = useFavoritos()
  const [adding, setAdding] = useState(false)
  const [favAnimate, setFavAnimate] = useState(false)

  const precio = parseFloat(producto.precio_web)
  const sinStock = producto.stock <= 0

  const nombre = producto.nombre_completo.charAt(0).toUpperCase() + producto.nombre_completo.slice(1).toLowerCase()
  const marca = producto.marca ? producto.marca.toUpperCase() : ''
  const favorito = esFavorito(producto.id)

  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hola! Quiero consultar:\nProducto: ${nombre}${producto.codigo ? `\nCódigo: ${producto.codigo}` : ''}`
  )}`

  function agregarAlCarrito(e) {
    e.preventDefault()
    if (sinStock || adding) return
    agregarConToast({ id: producto.id, nombre, precio_web: precio, imagen_url: producto.imagen_url })
    setAdding(true)
    setTimeout(() => setAdding(false), 700)
  }

  function handleFavorito(e) {
    e.preventDefault()
    toggleFavorito(producto.id)
    setFavAnimate(true)
    setTimeout(() => setFavAnimate(false), 400)
  }

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group relative bg-white rounded-2xl border border-brand-border flex flex-col overflow-hidden
                 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/12 hover:border-brand-blue/20
                 transition-all duration-300 ease-out
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
    >
      {/* IMAGEN */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={nombre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            style={{ '--tw-scale-x': 'var(--hover-scale, 1)', '--tw-scale-y': 'var(--hover-scale, 1)' }}
          />
        ) : (
          <ProductPlaceholder nombre={nombre} />
        )}

        {/* Overlay hover sutil */}
        <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/5 transition-colors duration-300" />

        {/* Badge stock */}
        <div className="absolute top-2 left-2">
          <StockBadge stock={producto.stock} />
        </div>

        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md
                      transition-all duration-200
                      ${favAnimate ? 'scale-125' : 'hover:scale-110'}
                      ${favorito ? 'bg-brand-blue' : 'bg-white/90 hover:bg-white'}`}
        >
          <HeartIcon filled={favorito} />
        </button>
      </div>

      {/* INFO */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Marca */}
        {marca && (
          <span className="text-[10px] font-black text-brand-muted tracking-widest uppercase leading-none">
            {marca}
          </span>
        )}

        {/* Nombre */}
        <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2 flex-1
                      group-hover:text-brand-blue transition-colors duration-200">
          {nombre}
        </p>

        {/* Compatibilidad */}
        {producto.motos_compatibles?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {producto.motos_compatibles.slice(0, 2).map(m => (
              <span key={m.id} className="text-[10px] bg-red-50 text-brand-blue border border-red-200
                                          rounded-full px-2 py-0.5 leading-none font-medium">
                {m.marca} {m.modelo}
              </span>
            ))}
            {producto.motos_compatibles.length > 2 && (
              <span className="text-[10px] text-brand-muted">+{producto.motos_compatibles.length - 2}</span>
            )}
          </div>
        )}

        {/* Precio */}
        <p className={`font-black text-lg leading-none mt-auto pt-1.5
                       ${sinStock ? 'text-gray-300 line-through text-sm' : 'text-brand-blue'}`}>
          ${precio.toLocaleString('es-AR')}
        </p>

        {/* CTA */}
        {sinStock ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="mt-1.5 w-full flex items-center justify-center gap-1.5
                       border border-avila-green text-avila-green text-xs font-bold py-2.5 rounded-xl
                       hover:bg-avila-green hover:text-white transition-all duration-200 active:scale-95"
          >
            {WA_SVG} Consultar disponibilidad
          </a>
        ) : (
          <button
            onClick={agregarAlCarrito}
            disabled={adding}
            className={`mt-1.5 w-full text-sm font-bold py-2.5 rounded-xl
                        transition-all duration-200 active:scale-95
                        ${adding
                          ? 'bg-avila-green text-white'
                          : 'bg-brand-blue hover:bg-brand-blue-dark text-white hover:shadow-md hover:shadow-brand-blue/30'
                        }`}
          >
            {adding ? '✓ Agregado' : 'Agregar al carrito'}
          </button>
        )}
      </div>

      {/* Borde inferior rojo animado */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue
                      origin-left scale-x-0 group-hover:scale-x-100
                      transition-transform duration-400 ease-out" />
    </Link>
  )
}
