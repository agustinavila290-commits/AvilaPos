/**
 * Página de detalle de compra - Soft UI
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompra, cancelarCompra, descargarAdjuntoFactura, subirAdjuntoFactura } from '../services/comprasService';
import SoftCard from '../components/SoftCard';

export default function CompraDetalle() {
  const { id } = useParams();
  
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const inputFileFacturaRef = useRef(null);

  useEffect(() => {
    cargarCompra();
  }, [id]);

  const cargarCompra = async () => {
    try {
      setLoading(true);
      const data = await getCompra(id);
      setCompra(data);
    } catch (err) {
      console.error('Error al cargar compra:', err);
      setError('Error al cargar la compra');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Está seguro que desea cancelar esta compra? Se devolverá el stock.')) {
      return;
    }
    
    try {
      setCancelando(true);
      setError('');
      
      const compraCancelada = await cancelarCompra(id);
      setCompra(compraCancelada);
    } catch (err) {
      console.error('Error al cancelar compra:', err);
      setError(err.response?.data?.error || 'Error al cancelar la compra');
    } finally {
      setCancelando(false);
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

  const handleSubirFactura = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSubiendoFactura(true);
    setError('');
    try {
      await subirAdjuntoFactura(id, file);
      const data = await getCompra(id);
      setCompra(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setSubiendoFactura(false);
      e.target.value = '';
      if (inputFileFacturaRef.current) inputFileFacturaRef.current.value = '';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Cargando compra...</p>
        </div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Compra no encontrada</p>
        <Link
          to="/compras"
          className="mt-4 inline-block bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 lg:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">📦 Compra #{compra.numero}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{formatFecha(compra.fecha)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
          {compra.estado_display === 'Completada' && (
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {cancelando ? 'Cancelando...' : 'Cancelar Compra'}
            </button>
          )}
          <Link
            to="/compras"
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-gray-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Información general */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Estado - Soft UI */}
          <SoftCard title="Estado" icon="📌">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estado de la compra</span>
              <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg ${getEstadoColor(compra.estado_display)}`}>
                {compra.estado_display}
              </span>
            </div>
          </SoftCard>

          {/* Productos - Soft UI */}
          <SoftCard title="Productos Comprados" icon="📦">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Cantidad</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Costo Unit.</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Subtotal</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Actualizaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {compra.detalles?.map((detalle) => (
                    <tr key={detalle.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        <p className="font-medium text-gray-800">{detalle.codigo}</p>
                        <p className="text-gray-600">{detalle.nombre_producto}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {detalle.cantidad}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        ${detalle.costo_unitario?.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        ${detalle.subtotal?.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {detalle.actualizar_costo && (
                          <span className="block text-xs text-green-600">✓ Costo actualizado</span>
                        )}
                        {detalle.actualizar_precio && (
                          <span className="block text-xs text-blue-600">✓ Precio actualizado</span>
                        )}
                        {!detalle.actualizar_costo && !detalle.actualizar_precio && (
                          <span className="text-xs text-gray-400">Sin actualizaciones</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>
        </div>

        {/* Sidebar - Soft UI */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Proveedor */}
          <SoftCard title="Proveedor" icon="🏢">
            <p className="text-sm font-medium text-gray-800">{compra.proveedor_nombre}</p>
          </SoftCard>

          {/* Usuario */}
          <SoftCard title="Registrado por" icon="👤">
            <p className="text-sm font-medium text-gray-800">{compra.usuario_nombre}</p>
          </SoftCard>

          {/* Factura y adjuntos */}
          <SoftCard title="Factura" icon="🧾">
            {compra.numero_factura ? (
              <p className="text-sm font-medium mb-3 text-gray-800">{compra.numero_factura}</p>
            ) : (
              <p className="text-sm text-gray-500 mb-3">Sin número de factura</p>
            )}
            {(compra.adjuntos_factura?.length > 0 || true) && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Imágenes de facturas</p>
                {compra.adjuntos_factura?.length > 0 ? (
                  <ul className="space-y-2">
                    {compra.adjuntos_factura.map((adj, i) => (
                      <li key={adj.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                        <span className="text-gray-700">
                          Factura {adj.orden || i + 1}
                          {adj.archivo && (
                            <span className="text-gray-500 ml-1">
                              ({typeof adj.archivo === 'string' ? adj.archivo.split('/').pop() : 'imagen'})
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => descargarAdjuntoFactura(compra.id, adj.id, `compra_${compra.numero}_factura_${i + 1}.jpg`)}
                          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                        >
                          Descargar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No hay imágenes cargadas.</p>
                )}
                <input
                  ref={inputFileFacturaRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSubirFactura}
                />
                <button
                  type="button"
                  onClick={() => inputFileFacturaRef.current?.click()}
                  disabled={subiendoFactura}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 transition-colors"
                >
                  {subiendoFactura ? 'Subiendo...' : '+ Agregar imagen de factura'}
                </button>
              </div>
            )}
          </SoftCard>

          {/* Depósito */}
          <SoftCard title="Depósito" icon="📁">
            <p className="text-sm font-medium text-gray-800">{compra.deposito_nombre}</p>
          </SoftCard>

          {/* Total */}
          <SoftCard title="Total" icon="💰">
            <div className="text-center py-2">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                ${compra.total?.toFixed(2)}
              </p>
            </div>
          </SoftCard>

          {/* Observaciones */}
          {compra.observaciones && (
            <SoftCard title="Observaciones" icon="📝">
              <p className="text-sm text-gray-600">{compra.observaciones}</p>
            </SoftCard>
          )}
        </div>
      </div>
    </div>
  );
}
