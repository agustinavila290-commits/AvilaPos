import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menú de navegación
  const menuItems = [
    { path: '/', label: 'Punto de venta', icon: '🛒', admin: false },
    { path: '/ventas', label: 'Ventas', icon: '💰', admin: false },
    { path: '/productos', label: 'Productos', icon: '📦', admin: false },
    { path: '/clientes', label: 'Clientes', icon: '👥', admin: false },
    { path: '/inventario', label: 'Inventario', icon: '📊', admin: false },
    { path: '/devoluciones', label: 'Devoluciones', icon: '↩️', admin: false },
    { path: '/compras', label: 'Compras', icon: '🛍️', admin: true },
    { path: '/reportes', label: 'Reportes', icon: '📈', admin: true },
  ];

  const adminTools = [
    { path: '/backups', label: 'Backups', icon: '💾' },
    { path: '/configuracion', label: 'Configuración', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Responsive MUY COMPACTO con Dark Mode */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-52 sm:w-56 lg:w-60 bg-white dark:bg-slate-800 shadow-xl border-r border-gray-100 dark:border-slate-700 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Casa de Repuestos
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sistema de gestión</p>
          </div>
          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Usuario */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm">
            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {user?.es_administrador ? 'Admin' : 'Cajero'}
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems
              .filter(item => !item.admin || isAdmin())
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    isActive(item.path)
                      ? 'sidebar-item-active'
                      : 'sidebar-item'
                  }
                >
                  <span className="text-base sm:text-lg">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                </Link>
              ))}
          </div>

          {/* Herramientas admin */}
          {isAdmin() && (
            <>
              <div className="my-3 sm:my-4 border-t border-gray-200 dark:border-slate-700"></div>
              <p className="px-3 sm:px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">
                Herramientas
              </p>
              <div className="space-y-1">
                {adminTools.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={
                      isActive(item.path)
                        ? 'sidebar-item-active'
                        : 'sidebar-item'
                    }
                  >
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Dark Mode Toggle */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm"
          >
            {darkMode ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline">Modo Claro</span>
                <span className="sm:hidden">Claro</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="hidden sm:inline">Modo Oscuro</span>
                <span className="sm:hidden">Oscuro</span>
              </>
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium shadow-lg shadow-red-500/30 dark:shadow-red-600/40 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal - Responsive MUY COMPACTO - SIEMPRE CON MARGIN */}
      <div className="ml-0 lg:ml-60">
        {/* Header móvil */}
        <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-2 py-2 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100">Casa de Repuestos</h2>
          <div className="w-5"></div>
        </div>

        {/* Contenido: Punto de Venta a ancho completo, el resto centrado con max-width */}
        <main className="min-h-screen">
          <div className={
            location.pathname === '/'
              ? 'w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4'
              : 'max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4'
          }>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
