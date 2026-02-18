/**
 * Página principal de reportes (admin only)
 */
import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  getVentasPorPeriodo,
  getProductosMasVendidos,
  getStockCritico,
  getMargenPorProducto,
  descargarVentasPeriodoExcel,
  descargarProductosMasVendidosExcel,
} from '../services/reportesService';

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para reporte de ventas
  const [fechaDesde, setFechaDesde] = useState(() => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);
    return hace30Dias.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reporteVentas, setReporteVentas] = useState(null);
  
  // Estado para productos más vendidos
  const [tipoRanking, setTipoRanking] = useState('cantidad');
  const [limiteProductos, setLimiteProductos] = useState(20);
  const [productosMasVendidos, setProductosMasVendidos] = useState(null);
  
  // Estado para stock crítico
  const [umbralStock, setUmbralStock] = useState(2);
  const [stockCritico, setStockCritico] = useState(null);
  
  // Estado para márgenes
  const [ordenMargen, setOrdenMargen] = useState('margen_desc');
  const [reporteMargen, setReporteMargen] = useState(null);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const cargarReporteVentas = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVentasPorPeriodo({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      });
      setReporteVentas(data);
    } catch (err) {
      console.error('Error al cargar reporte de ventas:', err);
      setError('Error al cargar el reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductosMasVendidos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProductosMasVendidos({
        tipo: tipoRanking,
        limite: limiteProductos,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      });
      setProductosMasVendidos(data);
    } catch (err) {
      console.error('Error al cargar productos más vendidos:', err);
      setError('Error al cargar productos más vendidos');
    } finally {
      setLoading(false);
    }
  };

  const cargarStockCritico = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStockCritico({ umbral: umbralStock });
      setStockCritico(data);
    } catch (err) {
      console.error('Error al cargar stock crítico:', err);
      setError('Error al cargar stock crítico');
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteMargen = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMargenPorProducto({
        orden: ordenMargen,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      });
      setReporteMargen(data);
    } catch (err) {
      console.error('Error al cargar reporte de márgenes:', err);
      setError('Error al cargar reporte de márgenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ventas' && !reporteVentas) {
      cargarReporteVentas();
    } else if (activeTab === 'productos' && !productosMasVendidos) {
      cargarProductosMasVendidos();
    } else if (activeTab === 'stock' && !stockCritico) {
      cargarStockCritico();
    } else if (activeTab === 'margenes' && !reporteMargen) {
      cargarReporteMargen();
    }
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Análisis y estadísticas del negocio</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`${
              activeTab === 'ventas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Ventas por Período
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            className={`${
              activeTab === 'productos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Productos Más Vendidos
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`${
              activeTab === 'stock'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Stock Crítico
          </button>
          <button
            onClick={() => setActiveTab('margenes')}
            className={`${
              activeTab === 'margenes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Márgenes
          </button>
        </nav>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Contenido según tab activo */}
      {activeTab === 'ventas' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={cargarReporteVentas}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Cargando...' : 'Generar Reporte'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setExportandoExcel(true);
                    try {
                      await descargarVentasPeriodoExcel({
                        fecha_desde: fechaDesde,
                        fecha_hasta: fechaHasta,
                      });
                    } catch (e) {
                      console.error(e);
                      setError('Error al exportar Excel');
                    } finally {
                      setExportandoExcel(false);
                    }
                  }}
                  disabled={exportandoExcel}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Resumen */}
          {reporteVentas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-sm text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {reporteVentas.resumen.cantidad_ventas}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-sm text-gray-600">Facturación Total</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(reporteVentas.resumen.total_ventas)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-sm text-gray-600">Promedio por Ticket</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(reporteVentas.resumen.promedio_ticket)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-sm text-gray-600">Total Descuentos</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {formatCurrency(reporteVentas.resumen.total_descuentos)}
                  </p>
                </div>
              </div>

              {/* Gráfico ventas por día */}
              {reporteVentas.por_dia?.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ventas por día
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={reporteVentas.por_dia.map((d) => ({
                          name: new Date(d.fecha_venta).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
                          total: Number(d.total),
                          cantidad: d.cantidad,
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Total']} labelFormatter={(l) => `Día: ${l}`} />
                        <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} name="Facturación" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Por método de pago */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ventas por Método de Pago
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Método
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reporteVentas.por_metodo_pago.map((metodo, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {metodo.metodo_pago}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metodo.cantidad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(metodo.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={tipoRanking}
                  onChange={(e) => setTipoRanking(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cantidad">Cantidad Vendida</option>
                  <option value="facturacion">Facturación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite
                </label>
                <input
                  type="number"
                  value={limiteProductos}
                  onChange={(e) => setLimiteProductos(parseInt(e.target.value))}
                  min="5"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  onClick={cargarProductosMasVendidos}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Cargando...' : 'Generar Ranking'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setExportandoExcel(true);
                    try {
                      await descargarProductosMasVendidosExcel({
                        tipo: tipoRanking,
                        limite: limiteProductos,
                        fecha_desde: fechaDesde,
                        fecha_hasta: fechaHasta,
                      });
                    } catch (e) {
                      console.error(e);
                      setError('Error al exportar Excel');
                    } finally {
                      setExportandoExcel(false);
                    }
                  }}
                  disabled={exportandoExcel}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Gráfico productos más vendidos */}
          {productosMasVendidos?.productos?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top 10 – Gráfico
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productosMasVendidos.productos.slice(0, 10).map((p) => {
                      const nombre = p.variante__producto_base__nombre || p.variante__nombre_variante || p.variante__sku || '';
                      return {
                        name: String(nombre).slice(0, 18) + (nombre.length > 18 ? '…' : ''),
                        cantidad: Number(p.cantidad_vendida || 0),
                        facturacion: Number(p.total_facturado || 0),
                      };
                    })}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => [name === 'facturacion' ? formatCurrency(value) : value, name === 'facturacion' ? 'Facturación' : 'Cantidad']} />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#2563eb" name="Cantidad" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="facturacion" fill="#059669" name="Facturación" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabla */}
          {productosMasVendidos && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top {productosMasVendidos.productos.length} Productos
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Facturación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productosMasVendidos.productos.map((producto, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {producto.variante__sku}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {producto.variante__nombre_variante}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.cantidad_vendida}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(producto.total_facturado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umbral de Stock Crítico
                </label>
                <input
                  type="number"
                  value={umbralStock}
                  onChange={(e) => setUmbralStock(parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Productos con stock menor o igual a este valor
                </p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cargarStockCritico}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {stockCritico && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {stockCritico.total} Productos con Stock Crítico
              </h3>
              {stockCritico.total === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No hay productos con stock crítico
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Depósito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockCritico.productos.map((producto, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {producto.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {producto.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {producto.deposito}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {producto.cantidad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              producto.estado === 'SIN_STOCK' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {producto.estado === 'SIN_STOCK' ? 'SIN STOCK' : 'CRÍTICO'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'margenes' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenMargen}
                  onChange={(e) => setOrdenMargen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="margen_desc">Mayor Margen</option>
                  <option value="margen_asc">Menor Margen</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cargarReporteMargen}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Cargando...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {reporteMargen && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Márgenes por Producto
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendidas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Costo Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Venta Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Margen $
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Margen %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporteMargen.productos.map((producto, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {producto.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {producto.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.cantidad_vendida}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(producto.total_costo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(producto.total_venta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(producto.margen_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            producto.margen_porcentaje < 5 
                              ? 'bg-red-100 text-red-800' 
                              : producto.margen_porcentaje < 15 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {producto.margen_porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
