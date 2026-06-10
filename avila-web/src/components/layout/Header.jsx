import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useAuth } from '../../context/AuthContext'
import { useFavoritos } from '../../context/FavoritosContext'
import { tiendaApi } from '../../services/api'

const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/contacto', label: 'Contacto' },
]

function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
  )
}

function HeaderSearch({ compact = false }) {
  const navigate = useNavigate()
  const [val, setVal] = useState('')
  const [sugs, setSugs] = useState([])
  const [show, setShow] = useState(false)
  const ref = useRef(null)
  const debRef = useRef(null)

  function handleInput(v) {
    setVal(v)
    clearTimeout(debRef.current)
    if (!v.trim()) { setSugs([]); setShow(false); return }
    debRef.current = setTimeout(() => {
      tiendaApi.getProductos({ search: v, page_size: 6 })
        .then(r => { setSugs(r.data.results); setShow(true) })
        .catch(() => {})
    }, 300)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (val.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(val.trim())}`)
      setShow(false)
      setSugs([])
    }
  }

  useEffect(() => {
    function onOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
          <SearchIcon className="w-4 h-4" />
        </span>
        <input
          type="search"
          value={val}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => sugs.length > 0 && setShow(true)}
          placeholder="Buscar repuestos, marcas, códigos..."
          className="w-full border-2 border-brand-border bg-brand-bg rounded-xl
                     pl-9 pr-[4.5rem] py-2 text-sm text-brand-text placeholder:text-brand-muted
                     focus:outline-none focus:border-brand-blue focus:bg-white
                     transition-all duration-200"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2
                     bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-black
                     px-3 py-1.5 rounded-lg transition-colors active:scale-95"
        >
          Buscar
        </button>
      </form>

      {show && sugs.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brand-border
                        rounded-xl shadow-card-hover z-[60] overflow-hidden">
          {sugs.map(p => {
            const nombre = p.nombre_completo.charAt(0).toUpperCase() + p.nombre_completo.slice(1).toLowerCase()
            return (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                onClick={() => { setShow(false); setSugs([]) }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-brand-bg transition-colors
                           border-b border-brand-border last:border-0"
              >
                <div className="w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-brand-border">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{nombre}</p>
                  {p.marca && <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wide">{p.marca}</p>}
                </div>
                <span className="text-sm font-black text-brand-blue flex-shrink-0">
                  ${parseFloat(p.precio_web).toLocaleString('es-AR')}
                </span>
              </Link>
            )
          })}
          <button
            onClick={() => { navigate(`/catalogo?search=${encodeURIComponent(val)}`); setShow(false) }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-bg
                       text-sm font-semibold text-brand-blue hover:bg-red-50 transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Ver todos los resultados para "{val}"
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { totalItems } = useCarrito()
  const { user } = useAuth()
  const { count: favCount } = useFavoritos()
  const [menuOpen, setMenuOpen] = useState(false)
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    tiendaApi.getCategorias()
      .then(r => setCategorias(r.data.slice(0, 8)))
      .catch(() => {})
  }, [])

  function closeMenu() { setMenuOpen(false) }

  return (
    <header className="bg-white border-b border-brand-border sticky top-0 z-50 shadow-sm">

      {/* ─── BARRA PRINCIPAL ─── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex-shrink-0 mr-1">
            <img
              src="/logo.png"
              alt="Avila Moto Repuestos"
              className="h-9 w-auto object-contain"
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <span
              style={{ display: 'none' }}
              className="items-center gap-1 font-black text-sm text-brand-text"
            >
              <span className="text-brand-blue text-lg">●</span>
              <span>Avila Moto</span>
            </span>
          </Link>

          {/* Buscador — solo desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <HeaderSearch />
          </div>

          {/* Íconos derecha */}
          <div className="flex items-center gap-0.5 ml-auto md:ml-0">

            {/* Favoritos */}
            <Link
              to="/favoritos"
              onClick={closeMenu}
              className="relative p-2 rounded-lg hover:bg-brand-bg transition-colors"
              aria-label="Favoritos"
            >
              <svg className="h-5 w-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-blue text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black leading-none">
                  {favCount > 9 ? '9+' : favCount}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <Link
              to="/carrito"
              onClick={closeMenu}
              className="relative p-2 rounded-lg hover:bg-brand-bg transition-colors"
              aria-label="Carrito"
            >
              <svg className="h-5 w-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-blue text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mi cuenta */}
            <Link
              to={user ? '/mi-cuenta' : '/login'}
              onClick={closeMenu}
              className="hidden md:flex p-2 rounded-lg hover:bg-brand-bg transition-colors"
              aria-label={user ? 'Mi cuenta' : 'Iniciar sesión'}
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.nombre} className="w-5 h-5 rounded-full object-cover" />
                : <svg className="h-5 w-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
              }
            </Link>

            {/* Hamburguesa — solo mobile */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-brand-bg transition-colors ml-0.5"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen
                ? <svg className="h-5 w-5 text-brand-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                : <svg className="h-5 w-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
              }
            </button>
          </div>
        </div>

        {/* Buscador mobile — segunda fila */}
        <div className="md:hidden pb-2.5">
          <HeaderSearch />
        </div>
      </div>

      {/* ─── BARRA CATEGORÍAS — solo desktop ─── */}
      {categorias.length > 0 && (
        <div className="hidden md:block border-t border-brand-border bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-0.5 h-9 overflow-x-auto scrollbar-hide">
              <NavLink
                to="/catalogo"
                end
                className={({ isActive }) =>
                  `flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    isActive ? 'text-brand-blue bg-red-50' : 'text-brand-muted hover:text-brand-blue hover:bg-red-50'
                  }`
                }
              >
                Todo
              </NavLink>
              {categorias.map(c => (
                <NavLink
                  key={c.id}
                  to={`/catalogo?categoria=${c.id}`}
                  className={({ isActive }) =>
                    `flex-shrink-0 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isActive ? 'text-brand-blue bg-red-50' : 'text-brand-muted hover:text-brand-blue hover:bg-red-50'
                    }`
                  }
                >
                  {c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1).toLowerCase()}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ─── MENÚ MOBILE ─── */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white shadow-card-hover">
          <nav className="flex flex-col py-1">
            {NAV_LINKS.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium border-l-[3px] transition-colors ${
                    isActive
                      ? 'border-brand-blue text-brand-blue bg-red-50'
                      : 'border-transparent text-brand-text hover:bg-brand-bg hover:text-brand-blue'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/carrito"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-l-[3px] transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-brand-blue text-brand-blue bg-red-50'
                    : 'border-transparent text-brand-text hover:bg-brand-bg hover:text-brand-blue'
                }`
              }
            >
              Carrito
              {totalItems > 0 && (
                <span className="bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </NavLink>
            <NavLink
              to={user ? '/mi-cuenta' : '/login'}
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-l-[3px] transition-colors ${
                  isActive
                    ? 'border-brand-blue text-brand-blue bg-red-50'
                    : 'border-transparent text-brand-text hover:bg-brand-bg hover:text-brand-blue'
                }`
              }
            >
              {user ? `Mi cuenta (${user.nombre.split(' ')[0]})` : 'Iniciar sesión'}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
