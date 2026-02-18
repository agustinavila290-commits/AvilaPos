import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-200">
          Bienvenido, {user?.first_name}!
        </h1>
        <p className="text-gray-400 mt-2">
          Sistema de Gestión - Casa de Repuestos de Motos
        </p>
      </div>

      {/* Acceso rápido al POS - responsive */}
      <Link
        to="/pos"
        className="block mb-6 sm:mb-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Icono */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            
            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                🛒 PUNTO DE VENTA
              </h2>
              <p className="text-green-100 text-sm sm:text-base lg:text-lg">
                Haz clic aquí para iniciar una nueva venta
              </p>
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-green-100">
                <span>⌨️ Atajos</span>
                <span className="hidden sm:inline">•</span>
                <span>💳 Contado/Tarjeta</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">🖨️ Tickets</span>
              </div>
            </div>
            
            {/* Flecha (oculta en móvil) */}
            <div className="text-right hidden md:block">
              <div className="text-4xl lg:text-6xl font-bold opacity-50">→</div>
              <p className="text-xs lg:text-sm text-green-100 mt-1 lg:mt-2 whitespace-nowrap">
                Presiona ENTER<br/>o haz clic
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Resumen de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ventas */}
        <a href="/ventas" className="card hover:shadow-lg transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ventas</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Gestiona ventas, genera tickets y PDFs
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            Modulo 5 - Completado
          </span>
        </a>

        {/* Productos */}
        <a href="/productos" className="card hover:shadow-lg transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Catálogo de productos y variantes
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            Modulo 3 - Completado
          </span>
        </a>

        {/* Clientes */}
        <a href="/clientes" className="card hover:shadow-lg transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Base de datos de clientes
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            Modulo 2 - Completado
          </span>
        </a>

        {/* Inventario */}
        <a href="/inventario" className="card hover:shadow-lg transition-shadow cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Control de stock y movimientos
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
            Modulo 4 - Completado
          </span>
        </a>

        {/* Compras (solo admin) */}
        {isAdmin() && (
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compras</h3>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Registro de compras a proveedores
            </p>
            <span className="inline-block px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
              Módulo 6 - Pendiente
            </span>
          </div>
        )}

        {/* Reportes (solo admin) */}
        {isAdmin() && (
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Estadísticas y análisis de ventas
            </p>
            <span className="inline-block px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
              Módulo 7 - Pendiente
            </span>
          </div>
        )}
      </div>

      {/* Estado del proyecto */}
      <div className="card mt-8 bg-primary-50 border border-primary-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-900">Estado del Proyecto</h3>
            <div className="mt-2 text-sm text-primary-700">
              <p className="mb-2">✅ <strong>ETAPA 0:</strong> Setup inicial completado</p>
              <p className="mb-2">✅ <strong>MÓDULO 1:</strong> Autenticación completada</p>
              <p className="text-primary-600">⏳ <strong>Próximo:</strong> MÓDULO 2 - Gestión de Clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
