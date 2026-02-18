/**
 * Página para crear nueva devolución
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVentas } from '../services/ventasService';
import { getProductosDevolubles, createDevolucion } from '../services/devolucionesService';
import { getDepositos } from '../services/inventarioService';

export default function NuevaDevolucion() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [itemsDevolucion, setItemsDevolucion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    motivo: 'DEFECTO',
    deposito_id: '',
    observaciones: '',
    genera_nota_credito: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [ventasData, depositosData] = await Promise.all([
        getVentas({ estado: 'COMPLETADA' }),
        getDepositos()
      ]);
      setVentas(Array.isArray(ventasData) ? ventasData : []);
      setDepositos(Array.isArray(depositosData) ? depositosData : []);
      if (depositosData.length > 0) {
        setFormData(prev => ({ ...prev, deposito_id: depositosData[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos');
    }
  };

  const handleVentaChange = async (ventaId) => {
    if (!ventaId) {
      setVentaSeleccionada(null);
      setProductosDisponibles([]);
      setItemsDevolucion([]);
      return;
    }

    try {
      const venta = ventas.find(v => v.id === parseInt(ventaId));
      setVentaSeleccionada(venta);
      
      const productos = await getProductosDevolubles(ventaId);
      setProductosDisponibles(productos);
      setItemsDevolucion([]);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar productos de la venta');
    }
  };

  const agregarProducto = (producto) => {
    if (itemsDevolucion.find(item => item.detalle_id === producto.detalle_id)) {
      return; // Ya está agregado
    }

    setItemsDevolucion([...itemsDevolucion, {
      detalle_id: producto.detalle_id,
      variante: producto.variante,
      cantidad: 1,
      cantidad_disponible: producto.cantidad_disponible,
      precio_unitario: parseFloat(producto.precio_unitario),
      estado_producto: ''
    }]);
  };

  const actualizarCantidad = (detalleId, cantidad) => {
    setItemsDevolucion(itemsDevolucion.map(item =>
      item.detalle_id === detalleId
        ? { ...item, cantidad: Math.min(parseInt(cantidad) || 0, item.cantidad_disponible) }
        : item
    ));
  };

  const eliminarProducto = (detalleId) => {
    setItemsDevolucion(itemsDevolucion.filter(item => item.detalle_id !== detalleId));
  };

  const calcularTotal = () => {
    return itemsDevolucion.reduce((sum, item) =>
      sum + (item.cantidad * item.precio_unitario), 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ventaSeleccionada) {
      setError('Debe seleccionar una venta');
      return;
    }

    if (itemsDevolucion.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        venta_id: ventaSeleccionada.id,
        motivo: formData.motivo,
        deposito_id: parseInt(formData.deposito_id),
        observaciones: formData.observaciones,
        genera_nota_credito: formData.genera_nota_credito,
        items: itemsDevolucion.map(item => ({
          detalle_venta_id: item.detalle_id,
          cantidad: item.cantidad,
          estado_producto: item.estado_producto
        }))
      };

      await createDevolucion(data);
      navigate('/devoluciones');
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al crear la devolución');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Devolución</h1>
        <p className="text-gray-600 mt-1">Registrar devolución de productos</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de venta */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Venta Original</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Venta *
              </label>
              <select
                value={ventaSeleccionada?.id || ''}
                onChange={(e) => handleVentaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccione una venta...</option>
                {ventas.map((venta) => (
                  <option key={venta.id} value={venta.id}>
                    Venta #{venta.numero} - {venta.cliente_nombre} - {formatCurrency(venta.total)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ventaSeleccionada && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Cliente:</strong> {ventaSeleccionada.cliente_nombre}<br />
                <strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleString()}<br />
                <strong>Total:</strong> {formatCurrency(ventaSeleccionada.total)}
              </p>
            </div>
          )}
        </div>

        {/* Datos de la devolución */}
        {ventaSeleccionada && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Devolución</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo *
                  </label>
                  <select
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="DEFECTO">Defecto en el producto</option>
                    <option value="INCORRECTO">Producto incorrecto</option>
                    <option value="ARREPENTIMIENTO">Arrepentimiento del cliente</option>
                    <option value="ERROR">Error en la venta</option>
                    <option value="GARANTIA">Garantía</option>
                    <option value="OTRO">Otro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depósito *
                  </label>
                  <select
                    value={formData.deposito_id}
                    onChange={(e) => setFormData({ ...formData, deposito_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {depositos.map((deposito) => (
                      <option key={deposito.id} value={deposito.id}>
                        {deposito.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.genera_nota_credito}
                      onChange={(e) => setFormData({ ...formData, genera_nota_credito: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Generar nota de crédito</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Productos disponibles */}
            {productosDisponibles.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Productos Disponibles para Devolver
                </h2>
                <div className="space-y-2">
                  {productosDisponibles.map((producto) => (
                    <div key={producto.detalle_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{producto.variante.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Disponible: {producto.cantidad_disponible} unidades - {formatCurrency(producto.precio_unitario)}/unidad
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => agregarProducto(producto)}
                        disabled={itemsDevolucion.find(item => item.detalle_id === producto.detalle_id)}
                        className="ml-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm"
                      >
                        {itemsDevolucion.find(item => item.detalle_id === producto.detalle_id) ? 'Agregado' : 'Agregar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items a devolver */}
            {itemsDevolucion.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Productos a Devolver
                </h2>
                <div className="space-y-4">
                  {itemsDevolucion.map((item) => (
                    <div key={item.detalle_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.variante.nombre}</p>
                          <p className="text-sm text-gray-600">
                            Precio: {formatCurrency(item.precio_unitario)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarProducto(item.detalle_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad (máx: {item.cantidad_disponible})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.cantidad_disponible}
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(item.detalle_id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtotal
                          </label>
                          <input
                            type="text"
                            value={formatCurrency(item.cantidad * item.precio_unitario)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total a Devolver</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(calcularTotal())}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/devoluciones')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || itemsDevolucion.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
              >
                {loading ? 'Procesando...' : 'Procesar Devolución'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
