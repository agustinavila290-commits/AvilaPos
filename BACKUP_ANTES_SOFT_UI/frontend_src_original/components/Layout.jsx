import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo y título */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-400 whitespace-nowrap mr-8">Casa de Repuestos</h1>
            </div>

            {/* Navegación central */}
            <nav className="flex items-center space-x-2 flex-1 justify-center">
              <a href="/" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Punto de venta
              </a>
              <a href="/ventas" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Ventas
              </a>
              <a href="/productos" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Productos
              </a>
              <a href="/clientes" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Clientes
              </a>
              <a href="/inventario" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Inventario
              </a>
              <a href="/devoluciones" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                Devoluciones
              </a>
              {isAdmin() && (
                <>
                  <a href="/compras" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    Compras
                  </a>
                  <a href="/reportes" className="text-gray-300 hover:text-blue-400 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    Reportes
                  </a>
                </>
              )}
            </nav>

            {/* Usuario y controles (derecha) */}
            <div className="flex items-center space-x-6 flex-shrink-0">
              {/* Iconos de admin */}
              {isAdmin() && (
                <div className="flex items-center gap-2 pr-6 border-r border-gray-700">
                  <Link
                    to="/backups"
                    className="text-gray-400 hover:text-blue-400 transition-colors p-2.5 rounded-lg hover:bg-gray-700"
                    title="Backups"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </Link>
                  <Link
                    to="/configuracion"
                    className="text-gray-400 hover:text-blue-400 transition-colors p-2.5 rounded-lg hover:bg-gray-700"
                    title="Configuración"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </div>
              )}
              
              {/* Info del usuario */}
              <div className="flex items-center gap-4">
                <div className="text-right min-w-[120px]">
                  <p className="text-sm font-semibold text-gray-200 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.es_administrador ? 'Administrador' : 'Cajero'}
                  </p>
                </div>
                
                {/* Botón logout */}
                <button
                  onClick={handleLogout}
                  className="bg-red-900 text-red-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors border border-red-800 whitespace-nowrap shadow-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
