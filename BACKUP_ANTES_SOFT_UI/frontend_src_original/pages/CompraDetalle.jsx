/**
 * Página de detalle de compra
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompra, cancelarCompra, descargarAdjuntoFactura, subirAdjuntoFactura } from '../services/comprasService';

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
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada':
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
          <p className="mt-4 text-gray-600">Cargando compra...</p>
        </div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Compra no encontrada</p>
        <Link to="/compras" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
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
          <h1 className="text-3xl font-bold text-gray-900">Compra #{compra.numero}</h1>
          <p className="text-gray-600 mt-1">{formatFecha(compra.fecha)}</p>
        </div>
        <div className="flex gap-2">
          {compra.estado_display === 'Completada' && (
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {cancelando ? 'Cancelando...' : 'Cancelar Compra'}
            </button>
          )}
          <Link
            to="/compras"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información general */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Estado</h2>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getEstadoColor(compra.estado_display)}`}>
                {compra.estado_display}
              </span>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Productos Comprados</h2>
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
                      Costo Unit.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actualizaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {compra.detalles?.map((detalle) => (
                    <tr key={detalle.id}>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-gray-900">{detalle.codigo}</p>
                        <p className="text-gray-500">{detalle.nombre_producto}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detalle.cantidad}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${detalle.costo_unitario?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${detalle.subtotal?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Proveedor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Proveedor</h3>
            <p className="text-sm font-medium">{compra.proveedor_nombre}</p>
          </div>

          {/* Usuario */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Registrado por</h3>
            <p className="text-sm font-medium">{compra.usuario_nombre}</p>
          </div>

          {/* Factura y adjuntos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Factura</h3>
            {compra.numero_factura ? (
              <p className="text-sm font-medium mb-3">{compra.numero_factura}</p>
            ) : (
              <p className="text-sm text-gray-500 mb-3">Sin número de factura</p>
            )}
            {(compra.adjuntos_factura?.length > 0 || true) && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Imágenes de facturas</p>
                {compra.adjuntos_factura?.length > 0 ? (
                  <ul className="space-y-2">
                    {compra.adjuntos_factura.map((adj, i) => (
                      <li key={adj.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
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
                          className="text-blue-600 hover:text-blue-800 font-medium"
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
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {subiendoFactura ? 'Subiendo...' : '+ Agregar imagen de factura'}
                </button>
              </div>
            )}
          </div>

          {/* Depósito */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Depósito</h3>
            <p className="text-sm font-medium">{compra.deposito_nombre}</p>
          </div>

          {/* Total */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Total</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                ${compra.total?.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {compra.observaciones && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones</h3>
              <p className="text-sm text-gray-600">{compra.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
