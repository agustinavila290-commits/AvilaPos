import { Link } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'

export default function Header() {
  const { totalItems } = useCarrito()

  return (
    <header className="header-avila">
      <div className="container header-inner">
        <Link to="/" className="logo-link">
          <span className="logo-avila">
            <span className="letra-a">A</span><span className="resto">VILA</span>
          </span>
          <span className="logo-sub">MOTO REPUESTOS Y ACCESORIOS</span>
          <span className="logo-direccion">AV PTE CASTILLO 1165</span>
        </Link>
        <nav className="header-nav">
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/carrito" className="carrito-link">
            🛒 Carrito
            {totalItems > 0 && <span className="carrito-badge">{totalItems}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}
