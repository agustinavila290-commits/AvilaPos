import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCarrito } from '../../context/CarritoContext'
import { useAuth } from '../../context/AuthContext'
import { useFavoritos } from '../../context/FavoritosContext'

const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Header() {
  const { totalItems } = useCarrito()
  const { user } = useAuth()
  const { count: favCount } = useFavoritos()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() { setMenuOpen(false) }

  return (
    <header className="bg-brand-dark text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="Avila Moto Repuestos"
            className="h-10 w-auto object-contain"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span
            style={{ display: 'none' }}
            className="items-center gap-2 font-bold text-lg text-white"
          >
            <span className="text-brand-blue">●</span> Avila Moto
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                isActive
                  ? 'text-brand-blue font-semibold'
                  : 'text-gray-300 hover:text-white transition-colors'
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Derecha: iconos + hamburguesa */}
        <div className="flex items-center gap-1">
          {/* Favoritos */}
          <Link
            to="/favoritos"
            onClick={closeMenu}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Favoritos"
          >
            <svg className="h-6 w-6 text-gray-300 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {favCount}
              </span>
            )}
          </Link>

          {/* Carrito */}
          <Link
            to="/carrito"
            onClick={closeMenu}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Carrito"
          >
            <svg className="h-6 w-6 text-gray-300 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mi cuenta */}
          <Link
            to={user ? '/mi-cuenta' : '/login'}
            onClick={closeMenu}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={user ? 'Mi cuenta' : 'Iniciar sesión'}
          >
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.nombre} className="w-6 h-6 rounded-full object-cover" />
              : <svg className="h-6 w-6 text-gray-300 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            }
          </Link>

          {/* Hamburguesa (solo mobile) */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen
              ? <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              : <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            }
          </button>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-dark">
          <nav className="flex flex-col py-2">
            {NAV_LINKS.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                    isActive
                      ? 'border-brand-blue text-white bg-white/10'
                      : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
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
                `px-4 py-3 text-sm font-medium border-l-4 transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-brand-blue text-white bg-white/10'
                    : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
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
                `px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  isActive
                    ? 'border-brand-blue text-white bg-white/10'
                    : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
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
