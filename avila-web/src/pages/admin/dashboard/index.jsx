import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPedidos } from '../../../services/adminService'

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getPedidos({ page_size: 10 })
        setPedidos(data.results || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1>Panel de administración</h1>
      <p style={{ color: 'var(--avila-gris)', marginBottom: '2rem' }}>
        Gestión de la tienda web
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Link to="/admin/pedidos" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--avila-gris)' }}>Pedidos web</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--avila-rojo)' }}>
              {loading ? '...' : pedidos.length}
            </p>
            <span style={{ fontSize: '0.875rem', color: 'var(--avila-gris)' }}>Ver todos →</span>
          </Link>
        </div>
        <div className="admin-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Link to="/admin/productos" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--avila-gris)' }}>Productos</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--avila-rojo)' }}>Catálogo</p>
            <span style={{ fontSize: '0.875rem', color: 'var(--avila-gris)' }}>Gestionar →</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <section>
        <h2>Últimos pedidos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : pedidos.length === 0 ? (
          <p>No hay pedidos aún.</p>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--avila-gris-claro)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nº</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>#{p.numero}</td>
                    <td style={{ padding: '0.75rem' }}>{p.cliente_nombre}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      ${parseFloat(p.total).toLocaleString('es-AR')}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--avila-gris)' }}>
                      {new Date(p.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/admin/pedidos/${p.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
