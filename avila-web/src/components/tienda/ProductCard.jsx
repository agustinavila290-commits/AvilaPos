import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'

export default function ProductCard({ producto }) {
  const { agregar } = useCarrito()
  const tieneStock = (producto.stock || 0) > 0

  const handleAgregar = (e) => {
    e.preventDefault()
    if (tieneStock) agregar(producto, 1)
  }

  return (
    <Link to={`/productos/${producto.id}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="product-card-image">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre_completo} />
        ) : (
          <div className="product-card-placeholder">
            <span>🛠️</span>
          </div>
        )}
        {!tieneStock && <span className="product-card-sinstock">Sin stock</span>}
      </div>
      <div className="product-card-body">
        <p className="product-card-codigo">{producto.codigo}</p>
        <h3 className="product-card-nombre">{producto.nombre_completo}</h3>
        <p className="product-card-precio">${parseFloat(producto.precio_web || 0).toLocaleString('es-AR')}</p>
        <button
          type="button"
          className="btn btn-primary product-card-btn"
          disabled={!tieneStock}
          onClick={handleAgregar}
        >
          {tieneStock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
      </div>
    </Link>
  )
}
