import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header style={headerStyle}>
      <div className="container" style={containerStyle}>
        <Link to="/" style={logoStyle}>
          Avila Motor Repuesto
        </Link>
        <nav style={navStyle}>
          <Link to="/" style={linkStyle}>Inicio</Link>
          <Link to="/contacto" style={linkStyle}>Contacto</Link>
          <Link to="/privacidad" style={linkStyle}>Privacidad</Link>
          <Link to="/terminos" style={linkStyle}>Términos</Link>
        </nav>
      </div>
    </header>
  )
}

const headerStyle = {
  background: '#1a1a2e',
  color: '#fff',
  padding: '0.75rem 0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.5rem',
}

const logoStyle = {
  color: '#fff',
  fontWeight: 700,
  fontSize: '1.125rem',
  textDecoration: 'none',
}

const navStyle = {
  display: 'flex',
  gap: '1.25rem',
}

const linkStyle = {
  color: 'rgba(255,255,255,0.9)',
  textDecoration: 'none',
  fontSize: '0.9375rem',
}
