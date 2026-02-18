/**
 * Página de detalle de venta
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVenta, anularVenta } from '../services/ventasService';
import { useAuth } from '../hooks/useAuth';
import TicketTermico from '../components/TicketTermico';

export default function VentaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Anulación
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  
  // Impresión
  const [mostrarTicket, setMostrarTicket] = useState(false);

  useEffect(() => {
    cargarVenta();
  }, [id]);

  const cargarVenta = async () => {
    try {
      setLoading(true);
      const data = await getVenta(id);
      setVenta(data);
    } catch (err) {
      console.error('Error al cargar venta:', err);
      setError('Error al cargar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    
    if (!confirm('¿Está seguro que desea anular esta venta? Esta acción devolverá el stock.')) {
      return;
    }
    
    try {
      setAnulando(true);
      setError('');
      
      const ventaAnulada = await anularVenta(id, motivoAnulacion);
      setVenta(ventaAnulada);
      setMostrarAnulacion(false);
      setMotivoAnulacion('');
    } catch (err) {
      console.error('Error al anular venta:', err);
      setError(err.response?.data?.error || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'Anulada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando venta...</p>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Venta no encontrada</p>
        <Link to="/ventas" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Venta #{venta.numero}</h1>
          <p className="text-gray-600 mt-1">{formatFecha(venta.fecha)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarTicket(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            🖨️ Imprimir Ticket
          </button>
          {isAdmin() && venta.estado_display === 'Completada' && (
            <button
              onClick={() => setMostrarAnulacion(!mostrarAnulacion)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Anular Venta
            </button>
          )}
          <Link
            to="/ventas"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formulario de anulación */}
      {mostrarAnulacion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Anular Venta</h3>
          <p className="text-sm text-yellow-700 mb-4">
            Esta acción devolverá el stock al inventario. El motivo debe tener al menos 10 caracteres.
          </p>
          <textarea
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3"
            placeholder="Motivo de anulación (mínimo 10 caracteres)..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleAnular}
              disabled={anulando || motivoAnulacion.length < 10}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {anulando ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
            <button
              onClick={() => {
                setMostrarAnulacion(false);
                setMotivoAnulacion('');
                setError('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información general */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Estado</h2>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getEstadoColor(venta.estado_display)}`}>
                {venta.estado_display}
              </span>
            </div>
            
            {venta.estado_display === 'Anulada' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-900">Motivo de anulación:</p>
                <p className="text-sm text-red-700 mt-1">{venta.motivo_anulacion}</p>
                <p className="text-xs text-red-600 mt-2">
                  Anulada por {venta.usuario_anulacion} el {formatFecha(venta.fecha_anulacion)}
                </p>
              </div>
            )}
            
            {venta.margen_es_bajo && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">
                  Alerta: Margen bajo ({venta.margen_porcentaje?.toFixed(2)}%)
                </p>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Productos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {venta.detalles?.map((detalle) => (
                    <tr key={detalle.id}>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-gray-900">{detalle.codigo}</p>
                        <p className="text-gray-500">{detalle.nombre_producto}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detalle.cantidad}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${detalle.precio_unitario?.toFixed(2)}
                        {detalle.descuento_unitario > 0 && (
                          <span className="text-xs text-red-600 block">
                            -${detalle.descuento_unitario?.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${detalle.subtotal?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cliente</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 font-medium">{venta.cliente_nombre}</span>
              </p>
              <Link
                to={`/clientes/${venta.cliente}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver historial del cliente
              </Link>
            </div>
          </div>

          {/* Vendedor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendedor</h3>
            <p className="text-sm font-medium">{venta.usuario_nombre}</p>
          </div>

          {/* Pago */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pago</h3>
            <p className="text-sm">
              <span className="text-gray-600">Método:</span>
              <span className="ml-2 font-medium">{venta.metodo_pago_display}</span>
            </p>
          </div>

          {/* Totales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Totales</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${venta.subtotal?.toFixed(2)}</span>
              </div>
              {(venta.descuento_monto > 0 || venta.descuento_porcentaje > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Descuento
                    {venta.descuento_porcentaje > 0 && ` (${venta.descuento_porcentaje}%)`}:
                  </span>
                  <span className="font-medium text-red-600">
                    -${venta.descuento_monto?.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${venta.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de impresión de ticket */}
      {mostrarTicket && (
        <TicketTermico
          venta={venta}
          onClose={() => setMostrarTicket(false)}
        />
      )}
    </div>
  );
}
