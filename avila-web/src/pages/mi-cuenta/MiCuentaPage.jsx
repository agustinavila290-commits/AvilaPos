import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import SEO from '../../components/SEO'

function EstadoBadge({ estado }) {
  const map = {
    COMPLETADA: { label: 'Completada', cls: 'bg-green-100 text-green-700' },
    PENDIENTE:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
    CANCELADA:  { label: 'Cancelada',  cls: 'bg-red-100 text-red-700' },
  }
  const info = map[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.cls}`}>
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
          <p className="text-brand-muted mb-4">Todavía no realizaste ningún pedido.</p>
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">Pedido #{p.venta_numero}</span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <p className="text-xs text-brand-muted">
                    {new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' · '}{p.items.length} {p.items.length === 1 ? 'producto' : 'productos'}
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
                  <div className="flex flex-col gap-2">
                    {p.items.map((item, i) => (
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
