import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div className="container" style={containerStyle}>
        <p style={pStyle}>
          © {new Date().getFullYear()} Avila Motor Repuesto. Todos los derechos reservados.
        </p>
        <nav style={navStyle}>
          <Link to="/privacidad" style={linkStyle}>Privacidad</Link>
          <span style={sepStyle}>·</span>
          <Link to="/terminos" style={linkStyle}>Términos</Link>
          <span style={sepStyle}>·</span>
          <Link to="/contacto" style={linkStyle}>Contacto</Link>
        </nav>
      </div>
    </footer>
  )
}

const footerStyle = {
  marginTop: 'auto',
  background: '#1a1a2e',
  color: 'rgba(255,255,255,0.85)',
  padding: '1.25rem 0',
  fontSize: '0.875rem',
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem',
}

const pStyle = { margin: 0 }

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const linkStyle = {
  color: 'rgba(255,255,255,0.9)',
  textDecoration: 'none',
}

const sepStyle = {
  color: 'rgba(255,255,255,0.5)',
  userSelect: 'none',
}
