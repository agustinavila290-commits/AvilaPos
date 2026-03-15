import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPedidos } from '../../../services/adminService'

export default function AdminPedidos() {
  const [data, setData] = useState({ results: [], total_pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await getPedidos({ page, page_size: 20 })
        setData(res)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  return (
    <div>
      <h1>Pedidos de la tienda web</h1>
      <p style={{ color: 'var(--avila-gris)', marginBottom: '1.5rem' }}>
        Pedidos realizados desde el sitio público
      </p>

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : data.results.length === 0 ? (
        <p>No hay pedidos.</p>
      ) : (
        <>
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
                {data.results.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>#{p.numero}</td>
                    <td style={{ padding: '0.75rem' }}>{p.cliente_nombre}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      ${parseFloat(p.total).toLocaleString('es-AR')}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--avila-gris)' }}>
                      {new Date(p.fecha).toLocaleDateString('es-AR')} {new Date(p.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/admin/pedidos/${p.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total_pages > 1 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Página {page} de {data.total_pages}</span>
              <button
                className="btn btn-outline"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
