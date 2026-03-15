import { Link, useParams, useLocation } from 'react-router-dom'

export default function Confirmacion() {
  const { pedidoId } = useParams()
  const { state } = useLocation()
  const venta = state?.venta

  return (
    <section className="content">
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--avila-rojo)' }}>¡Pedido recibido!</h1>
        <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
          Tu pedido <strong>#{pedidoId || venta?.venta_numero}</strong> fue registrado correctamente.
        </p>
        <p>
          Te contactaremos a la brevedad para coordinar el pago y la entrega.
        </p>
        <Link to="/productos" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Seguir comprando
        </Link>
      </div>
    </section>
  )
}
