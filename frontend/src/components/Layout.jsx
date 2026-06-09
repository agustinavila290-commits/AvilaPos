import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navRef = useRef(null);

  // Navegar el sidebar con flechas arriba/abajo
  const handleNavKeyDown = useCallback((e) => {
    if (!navRef.current) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const focusables = Array.from(navRef.current.querySelectorAll('a, button'));
    const idx = focusables.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      const next = focusables[idx + 1] ?? focusables[0];
      next?.focus();
    } else {
      const prev = focusables[idx - 1] ?? focusables[focusables.length - 1];
      prev?.focus();
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const IconPOS = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  const IconVentas = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const IconProductos = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  const IconClientes = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const IconInventario = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  const IconAnalisis = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const IconOrdenes = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
  const IconDevoluciones = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
  const IconCuentaCorriente = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
  const IconCompras = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
  const IconTransferencias = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
  const IconPresupuestos = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const IconReportes = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
  const IconBackups = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
  const IconConfig = () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

  // Menú de navegación
  const menuItems = [
    { path: '/', label: 'Punto de venta', icon: <IconPOS />, admin: false },
    { path: '/ventas', label: 'Ventas', icon: <IconVentas />, admin: false },
    { path: '/productos', label: 'Productos', icon: <IconProductos />, admin: false },
    { path: '/clientes', label: 'Clientes', icon: <IconClientes />, admin: false },
    { path: '/inventario', label: 'Inventario', icon: <IconInventario />, admin: false },
    { path: '/devoluciones', label: 'Devoluciones', icon: <IconDevoluciones />, admin: false },
    { path: '/presupuestos', label: 'Presupuestos', icon: <IconPresupuestos />, admin: false },
    { path: '/cuenta-corriente', label: 'Cuenta Corriente', icon: <IconCuentaCorriente />, admin: false },
    { path: '/compras', label: 'Compras', icon: <IconCompras />, admin: true },
    { path: '/compras/ordenes', label: 'Órdenes OC', icon: <IconOrdenes />, admin: true },
    { path: '/transferencias', label: 'Transferencias', icon: <IconTransferencias />, admin: true },
    { path: '/inventario/avanzado', label: 'Inv. Avanzado', icon: <IconAnalisis />, admin: true },
    { path: '/reportes', label: 'Reportes', icon: <IconReportes />, admin: true },
  ];

  const adminTools = [
    { path: '/backups', label: 'Backups', icon: <IconBackups /> },
    { path: '/configuracion', label: 'Configuración', icon: <IconConfig /> },
  ];

  const isActive = (path) => {
    if (path === '/inventario/avanzado') {
      return location.pathname.startsWith('/inventario/avanzado') ||
        location.pathname.startsWith('/inventario/conteo') ||
        location.pathname.startsWith('/inventario/ajuste-masivo')
    }
    if (path === '/compras/ordenes') {
      return location.pathname.startsWith('/compras/ordenes')
    }
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Responsive MUY COMPACTO */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-52 sm:w-56 lg:w-60 bg-white shadow-xl border-r border-slate-100 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="relative flex items-center justify-center px-4 py-3 bg-white border-b-[3px] border-brand-blue">
          <img
            src="/logo-avila.png"
            alt="Avila Moto Repuestos"
            className="h-[90px] w-auto object-contain"
          />
          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-2 top-2 text-slate-400 hover:text-slate-700 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Usuario */}
        <div className="px-3 py-3 border-b border-brand-border">
          <div className="flex items-center gap-2.5 bg-white rounded-lg p-2.5 border-l-4 border-brand-blue shadow-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#2563EB' }}>
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-text truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
              </p>
              <p className="text-xs font-medium" style={{ color: '#2563EB' }}>
                {user?.es_administrador ? 'Administrador' : 'Cajero'}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav ref={navRef} onKeyDown={handleNavKeyDown} className="flex-1 px-2 sm:px-3 py-3 sm:py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems
              .filter(item => !item.admin || isAdmin())
              .map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item'}
                >
                  {item.icon}
                  <span className="text-xs sm:text-sm">{item.label}</span>
                </Link>
              ))}
          </div>

          {/* Herramientas admin */}
          {isAdmin() && (
            <>
              <div className="my-3 sm:my-4 border-t border-slate-200"></div>
              <p className="px-3 sm:px-4 text-xs font-semibold text-slate-400 uppercase mb-2">
                Herramientas
              </p>
              <div className="space-y-1">
                {adminTools.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={isActive(item.path) ? 'sidebar-item-active' : 'sidebar-item'}
                  >
                    {item.icon}
                    <span className="text-xs sm:text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-brand-red text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:brightness-110 hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal - Responsive MUY COMPACTO - SIEMPRE CON MARGIN */}
      <div className="ml-0 lg:ml-60">
        {/* Header móvil */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-2 py-2 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-700 hover:text-slate-900 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/logo-avila.png" alt="Avila" className="h-8 w-auto object-contain" />
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
