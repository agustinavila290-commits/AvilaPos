import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import SEO from '../../components/SEO'

export default function RegistroPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registro, loginGoogle, loading } = useAuth()
  const redirectTo = location.state?.from || '/'

  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [errores, setErrores] = useState({})

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrores(e => ({ ...e, [e.target?.name]: null, general: null }))
  }

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.email.trim()) e.email = 'El email es obligatorio'
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }
    const result = await registro(form.nombre, form.email, form.password)
    if (result.ok) navigate(redirectTo, { replace: true })
    else setErrores({ general: result.error })
  }

  async function handleGoogle(credentialResponse) {
    const result = await loginGoogle(credentialResponse.credential)
    if (result.ok) navigate(redirectTo, { replace: true })
    else setErrores({ general: result.error })
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <SEO title="Crear cuenta" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-text">Crear cuenta</h1>
          <p className="text-brand-muted text-sm mt-1">Guardá tus pedidos y datos de envío</p>
        </div>

        <div className="card p-6 flex flex-col gap-4">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setErrores({ general: 'Error al continuar con Google' })}
              text="signup_with"
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {[
              { name: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez', autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com', autoComplete: 'email' },
              { name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres', autoComplete: 'new-password' },
              { name: 'confirmar', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-brand-text">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  value={form[f.name]}
                  onChange={handleChange}
                  required
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  className={`input ${errores[f.name] ? 'border-brand-red' : ''}`}
                />
                {errores[f.name] && <p className="text-xs text-brand-red">{errores[f.name]}</p>}
              </div>
            ))}

            {errores.general && (
              <p className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errores.general}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary py-2.5 mt-1">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-muted mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" state={{ from: redirectTo }} className="text-brand-blue hover:underline font-medium">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
