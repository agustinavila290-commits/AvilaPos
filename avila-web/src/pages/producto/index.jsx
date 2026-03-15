import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProducto } from '../../services/tiendaService'
import { useCarrito } from '../../context/CarritoContext'

export default function ProductoDetalle() {
  const { id } = useParams()
  const { agregar } = useCarrito()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await getProducto(id)
        setProducto(data)
      } catch (err) {
        setError(err.message || 'Producto no encontrado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAgregar = () => {
    if (!producto || !(producto.stock > 0)) return
    agregar(producto, cantidad)
  }

  if (loading) return <section className="content"><div className="container"><p>Cargando...</p></div></section>
  if (error || !producto) return <section className="content"><div className="container"><p>{error || 'Producto no encontrado'}</p></div></section>

  const tieneStock = (producto.stock || 0) > 0

  return (
    <section className="content">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }} className="producto-detalle-grid">
          <div className="product-card-image" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
            {producto.imagen_url ? (
              <img src={producto.imagen_url} alt={producto.nombre_completo} />
            ) : (
              <div className="product-card-placeholder" style={{ minHeight: '300px' }}>
                <span>🛠️</span>
              </div>
            )}
          </div>
          <div>
            <p style={{ color: 'var(--avila-gris)', fontSize: '0.875rem' }}>{producto.codigo}</p>
            <h1 style={{ marginTop: '0', marginBottom: '0.5rem' }}>{producto.nombre_completo}</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--avila-rojo)', marginBottom: '1rem' }}>
              ${parseFloat(producto.precio_web || 0).toLocaleString('es-AR')}
            </p>
            <p style={{ marginBottom: '1rem' }}>{producto.descripcion || 'Sin descripción.'}</p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Stock:</strong> {producto.stock > 0 ? producto.stock : 'Sin stock'}
            </p>
            {tieneStock && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label>
                  Cantidad:
                  <input
                    type="number"
                    min={1}
                    max={producto.stock}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                    className="input-field"
                    style={{ width: '80px', marginLeft: '0.5rem' }}
                  />
                </label>
                <button className="btn btn-primary" onClick={handleAgregar}>
                  Agregar al carrito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
