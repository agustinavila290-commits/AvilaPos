import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPedido } from '../../../services/adminService'

export default function PedidoDetalle() {
  const { id } = useParams()
  const [venta, setVenta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getPedido(id)
        setVenta(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p>Cargando...</p>
  if (error) return <p style={{ color: '#c00' }}>{error}</p>
  if (!venta) return null

  return (
    <div>
      <Link to="/admin/pedidos" style={{ marginBottom: '1rem', display: 'inline-block' }}>← Volver a pedidos</Link>
      <h1>Pedido #{venta.numero}</h1>
      <p style={{ color: 'var(--avila-gris)' }}>
        {new Date(venta.fecha).toLocaleString('es-AR')} · {venta.estado_display}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }} className="admin-pedido-grid">
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Cliente</h3>
          <p style={{ margin: 0 }}>{venta.cliente_nombre}</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Total</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--avila-rojo)' }}>
            ${parseFloat(venta.total).toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ padding: '1rem', margin: 0, background: 'var(--avila-gris-claro)' }}>Productos</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Producto</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cantidad</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio unit.</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles?.map((d) => (
              <tr key={d.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{d.nombre_producto || d.variante_info?.nombre_completo}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{d.cantidad}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  ${parseFloat(d.precio_unitario).toLocaleString('es-AR')}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                  ${parseFloat(d.subtotal).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .admin-pedido-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
