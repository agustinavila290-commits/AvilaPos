import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'avila_token'
const USER_KEY = 'avila_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(false)

  // Verificar que el token guardado sigue siendo válido al cargar la app
  useEffect(() => {
    if (token && !user) {
      authApi.me().then(r => {
        setUser(r.data)
        localStorage.setItem(USER_KEY, JSON.stringify(r.data))
      }).catch(() => logout())
    }
  }, [])

  function saveSession(tokenValue, userData) {
    setToken(tokenValue)
    setUser(userData)
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  async function registro(nombre, email, password) {
    setLoading(true)
    try {
      const r = await authApi.registro({ nombre, email, password })
      saveSession(r.data.token, r.data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Error al registrarse' }
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    setLoading(true)
    try {
      const r = await authApi.login({ email, password })
      saveSession(r.data.token, r.data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Email o contraseña incorrectos' }
    } finally {
      setLoading(false)
    }
  }

  async function loginGoogle(idToken) {
    setLoading(true)
    try {
      const r = await authApi.loginGoogle(idToken)
      saveSession(r.data.token, r.data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Error al iniciar sesión con Google' }
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, registro, login, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
