import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (result.ok) {
      navigate('/admin')
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1 className="logo-avila">
          <span className="letra-a">A</span><span className="resto">VILA</span>
        </h1>
        <p style={{ color: 'var(--avila-gris)', marginBottom: '1.5rem' }}>Administración de la tienda</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee', color: '#c00', borderRadius: '0.375rem' }}>
              {error}
            </div>
          )}
          <label>
            Usuario
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <a href="/" style={{ color: 'var(--avila-gris)' }}>← Volver a la tienda</a>
        </p>
      </div>

      <style>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--avila-negro);
        }
        .admin-login-card {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .admin-login-card label {
          display: block;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .admin-login-card label input {
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}
