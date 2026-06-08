import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { ENVIO_GRATIS_DESDE } from '../../config'
import SEO from '../../components/SEO'

function ItemCarrito({ item, dispatch }) {
  const subtotal = item.precio_web * item.cantidad

  return (
    <div className="card p-4 flex gap-4 items-start">
      {/* Imagen */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-brand-border flex items-center justify-center">
        {item.imagen_url
          ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
          : <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-text text-sm leading-snug mb-1 truncate">{item.nombre}</p>
        <p className="text-brand-muted text-sm">${item.precio_web.toLocaleString('es-AR')} c/u</p>

        {/* Cantidad */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => dispatch({ type: 'CAMBIAR_CANTIDAD', id: item.id, cantidad: item.cantidad - 1 })}
            className="w-7 h-7 rounded border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors text-base leading-none"
          >−</button>
          <span className="w-7 text-center font-semibold text-sm">{item.cantidad}</span>
          <button
            onClick={() => dispatch({ type: 'CAMBIAR_CANTIDAD', id: item.id, cantidad: item.cantidad + 1 })}
            className="w-7 h-7 rounded border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors text-base leading-none"
          >+</button>
        </div>
      </div>

      {/* Subtotal + quitar */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <p className="font-bold text-brand-blue">${subtotal.toLocaleString('es-AR')}</p>
        <button
          onClick={() => dispatch({ type: 'QUITAR', id: item.id })}
          className="text-xs text-brand-muted hover:text-brand-red transition-colors"
          aria-label="Quitar del carrito"
        >
          Quitar
        </button>
      </div>
    </div>
  )
}

export default function CarritoPage() {
  const { items, totalItems, totalPrecio, dispatch } = useCarrito()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <SEO title="Carrito" />
        <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-brand-text mb-1">Tu carrito está vacío</p>
        <p className="text-brand-muted text-sm mb-6">Agregá productos desde el catálogo</p>
        <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEO title={`Carrito (${totalItems})`} />
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-text">
          Carrito <span className="text-brand-muted font-normal text-lg">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
        </h1>
        <button
          onClick={() => dispatch({ type: 'VACIAR' })}
          className="text-sm text-brand-muted hover:text-brand-red transition-colors"
        >
          Vaciar carrito
        </button>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3 mb-6">
        {items.map(item => (
          <ItemCarrito key={item.id} item={item} dispatch={dispatch} />
        ))}
      </div>

      {/* Banner envío gratis */}
      {totalPrecio < ENVIO_GRATIS_DESDE && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-brand-blue font-medium">
              🚚 Te faltan <span className="font-bold">${(ENVIO_GRATIS_DESDE - totalPrecio).toLocaleString('es-AR')}</span> para envío gratis
            </span>
            <span className="text-brand-muted text-xs">${ENVIO_GRATIS_DESDE.toLocaleString('es-AR')} mín.</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalPrecio / ENVIO_GRATIS_DESDE) * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      )}
      {totalPrecio >= ENVIO_GRATIS_DESDE && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-brand-green font-medium text-center">
          🎉 ¡Alcanzaste el envío gratis!
        </div>
      )}

      {/* Resumen */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-brand-muted text-sm">Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
          <span className="font-semibold">${totalPrecio.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
          <span className="text-brand-muted text-sm">Envío</span>
          <span className="text-sm text-brand-muted">Se calcula al finalizar</span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-bold text-brand-blue">${totalPrecio.toLocaleString('es-AR')}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full text-center block py-3 text-base rounded-xl">
          Continuar con el pedido →
        </Link>
        <Link to="/catalogo" className="block text-center text-sm text-brand-muted hover:text-brand-text mt-3 transition-colors">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  )
}
