import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientesService from '../services/clientesService';

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clienteData, historialData] = await Promise.all([
        clientesService.getCliente(id),
        clientesService.getHistorial(id)
      ]);
      setCliente(clienteData);
      setHistorial(historialData);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clientes')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Clientes
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
            <p className="text-gray-600 mt-1">DNI: {cliente.dni}</p>
          </div>
          <button
            onClick={() => navigate(`/clientes/${id}/editar`)}
            className="btn-primary"
          >
            Editar Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="text-sm font-medium text-gray-900">{cliente.dni}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{cliente.telefono}</p>
              </div>

              {cliente.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.email}</p>
                </div>
              )}

              {cliente.direccion && (
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">{cliente.direccion}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  cliente.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fecha de registro</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(cliente.fecha_creacion).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Gastado</span>
                <span className="text-lg font-bold text-primary-600">
                  ${historial?.total_gastado?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Cantidad de Compras</span>
                <span className="text-lg font-bold text-gray-900">
                  {historial?.cantidad_compras || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Ticket Promedio</span>
                <span className="text-lg font-bold text-gray-900">
                  ${historial?.ticket_promedio?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Compras */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Compras</h2>
            
            {!historial?.ventas?.length ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin compras registradas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Este cliente aún no ha realizado ninguna compra.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historial.ventas.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(v.fecha).toLocaleDateString('es-AR', { dateStyle: 'short' })} {new Date(v.fecha).toLocaleTimeString('es-AR', { timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{v.numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${typeof v.total === 'number' ? v.total.toFixed(2) : v.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Completada
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => navigate(`/ventas/${v.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
