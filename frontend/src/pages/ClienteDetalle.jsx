import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientesService from '../services/clientesService';
import { getTickets } from '../services/cuentaCorrienteService';
import MetricCard from '../components/MetricCard';
import SoftCard from '../components/SoftCard';

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [ticketsCC, setTicketsCC] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clienteData, historialData, ticketsData] = await Promise.all([
        clientesService.getCliente(id),
        clientesService.getHistorial(id),
        getTickets({ cliente: id }).catch(() => []),
      ]);
      setCliente(clienteData);
      setHistorial(historialData);
      setTicketsCC(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar el cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-4">
        <div>
          <button
            onClick={() => navigate('/clientes')}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Clientes
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate min-w-0">👤 {cliente.nombre}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">DNI: {cliente.dni}</p>
        </div>
        <button
          onClick={() => navigate(`/clientes/${id}/editar`)}
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          Editar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Información del Cliente - Soft UI */}
        <div className="lg:col-span-1 space-y-6">
          <SoftCard title="Información del Cliente" icon="📋">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="text-sm font-medium text-gray-800">{cliente.dni}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-800">{cliente.telefono}</p>
              </div>

              {cliente.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.email}</p>
                </div>
              )}

              {cliente.direccion && (
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-sm font-medium text-gray-800">{cliente.direccion}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold rounded-lg border ${
                  cliente.activo
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha de registro</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(cliente.fecha_creacion).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </SoftCard>

          {/* Estadísticas - MetricCard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <MetricCard
              title="Total Gastado"
              value={`$${historial?.total_gastado?.toFixed(2) || '0.00'}`}
              icon="💵"
              color="green"
            />
            <MetricCard
              title="Cantidad de Compras"
              value={historial?.cantidad_compras || 0}
              icon="🛒"
              color="blue"
            />
            <MetricCard
              title="Ticket Promedio"
              value={`$${historial?.ticket_promedio?.toFixed(2) || '0.00'}`}
              icon="🎫"
              color="purple"
            />
          </div>
        </div>

        {/* Historial de Compras - Soft UI */}
        <div className="lg:col-span-2">
          <SoftCard title="Historial de Compras" icon="📜">
            {!historial?.ventas?.length ? (
              <div className="text-center py-12">
                <svg className="mx-auto w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-800">Sin compras registradas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Este cliente aún no ha realizado ninguna compra.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Número</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Estado</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {historial.ventas.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(v.fecha).toLocaleDateString('es-AR', { dateStyle: 'short' })} {new Date(v.fecha).toLocaleTimeString('es-AR', { timeStyle: 'short' })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          #{v.numero}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${typeof v.total === 'number' ? v.total.toFixed(2) : v.total}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-800 border border-green-200">
                            Completada
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => navigate(`/ventas/${v.id}`)}
                            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SoftCard>

          {/* Tickets cuenta corriente */}
          <SoftCard title="Tickets cuenta corriente" icon="📋" className="mt-6">
            {!ticketsCC?.length ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Sin tickets a cuenta corriente</p>
                <button
                  onClick={() => navigate('/cuenta-corriente/nuevo')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Crear ticket →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Descripción</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsCC.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">#{t.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.descripcion || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            t.estado === 'A_SALDAR' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {t.estado_display ?? t.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          ${Number(t.total ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/cuenta-corriente/${t.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Ver →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
