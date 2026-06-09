import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import { ORDER_STATUS_LABELS, WA_MESSAGES } from '../../config'
import SEO from '../../components/SEO'

const WA_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function EstadoBadge({ estado }) {
  const info = ORDER_STATUS_LABELS[estado] || { label: estado, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>
      {info.label}
    </span>
  )
}

export default function MiCuentaPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/mi-cuenta' } }); return }
    authApi.misPedidos()
      .then(r => setPedidos(r.data))
      .catch(() => {})
      .finally(() => setLoadingPedidos(false))
  }, [user])

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEO title="Mi cuenta" />

      {/* Perfil */}
      <div className="card p-5 mb-6 flex items-center gap-4">
        {user.avatar_url
          ? <img src={user.avatar_url} alt={user.nombre} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          : <div className="w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-text text-lg truncate">{user.nombre}</p>
          <p className="text-brand-muted text-sm truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-brand-muted hover:text-brand-red transition-colors flex-shrink-0"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Historial de pedidos */}
      <h2 className="text-lg font-bold text-brand-text mb-4">Mis pedidos</h2>

      {loadingPedidos ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-brand-text mb-1">Todavía no realizaste pedidos</p>
          <p className="text-brand-muted text-sm mb-4">Explorá el catálogo y encontrá lo que necesitás.</p>
          <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map(p => (
            <div key={p.id} className="card overflow-hidden">
              {/* Cabecera del pedido */}
              <button
                onClick={() => setPedidoAbierto(pedidoAbierto === p.id ? null : p.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-brand-bg transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm">Pedido #{p.venta_numero}</span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <p className="text-xs text-brand-muted">
                    {new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' · '}{p.items?.length || 0} {(p.items?.length || 0) === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-brand-blue">
                    ${parseFloat(p.total).toLocaleString('es-AR')}
                  </span>
                  <svg
                    className={`w-4 h-4 text-brand-muted transition-transform ${pedidoAbierto === p.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detalle expandible */}
              {pedidoAbierto === p.id && (
                <div className="border-t border-brand-border px-4 pb-4 pt-3">
                  <div className="flex flex-col gap-2 mb-4">
                    {p.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-brand-muted">
                          {item.nombre} <span className="text-brand-text font-medium">×{item.cantidad}</span>
                        </span>
                        <span className="text-brand-text font-medium">
                          ${parseFloat(item.subtotal).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Botón WA para consultar pedido */}
                  <a
                    href={WA_MESSAGES.consultarPedido(p.venta_numero)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-green border border-brand-green px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    {WA_SVG} Consultar este pedido
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
