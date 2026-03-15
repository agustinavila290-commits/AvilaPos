import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer-avila">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="logo-avila">
            <span className="letra-a">A</span><span className="resto">VILA</span>
          </span>
          <p>Moto repuestos y accesorios</p>
          <p>Av Pte Castillo 1165</p>
        </div>
        <div className="footer-links">
          <Link to="/productos">Productos</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/terminos">Términos</Link>
        </div>
      </div>
    </footer>
  )
}
