import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'

export default function Carrito() {
  const { items, totalItems, totalMonto, actualizarCantidad, eliminar } = useCarrito()

  if (items.length === 0) {
    return (
      <section className="content">
        <div className="container">
          <h1>Carrito</h1>
          <p>Tu carrito está vacío.</p>
          <Link to="/productos" className="btn btn-primary">Ver productos</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="content">
      <div className="container">
        <h1>Carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</h1>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div
              key={item.variante_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--avila-gris-claro)',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{item.nombre_completo}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--avila-gris)' }}>
                  Cód: {item.codigo}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => actualizarCantidad(item.variante_id, parseInt(e.target.value) || 1)}
                  className="input-field"
                  style={{ width: '70px', textAlign: 'center' }}
                />
              </div>
              <p style={{ margin: 0, fontWeight: 700, minWidth: '100px', textAlign: 'right' }}>
                ${(item.precio_web * item.cantidad).toLocaleString('es-AR')}
              </p>
              <button
                type="button"
                onClick={() => eliminar(item.variante_id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/productos" className="btn btn-outline">Seguir comprando</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>
              Total: ${totalMonto.toLocaleString('es-AR')}
            </span>
            <Link to="/checkout" className="btn btn-primary">
              Ir al checkout
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
