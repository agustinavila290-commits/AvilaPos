import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import SEO from '../../components/SEO'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginGoogle, loading } = useAuth()
  const redirectTo = location.state?.from || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.ok) navigate(redirectTo, { replace: true })
    else setError(result.error)
  }

  async function handleGoogle(credentialResponse) {
    const result = await loginGoogle(credentialResponse.credential)
    if (result.ok) navigate(redirectTo, { replace: true })
    else setError(result.error)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <SEO title="Iniciar sesión" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-text">Iniciar sesión</h1>
          <p className="text-brand-muted text-sm mt-1">Accedé a tu cuenta para ver tus pedidos</p>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          {/* Google */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError('Error al iniciar sesión con Google')}
              text="signin_with"
              shape="rectangular"
              locale="es"
              width="100%"
            />
          </div>

          <div className="flex items-center gap-3">
            <hr className="flex-1 border-brand-border" />
            <span className="text-xs text-brand-muted">o con email</span>
            <hr className="flex-1 border-brand-border" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary py-2.5 mt-1">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-muted mt-4">
          ¿No tenés cuenta?{' '}
          <Link to="/registro" state={{ from: redirectTo }} className="text-brand-blue hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
