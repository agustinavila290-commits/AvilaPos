/**
 * Página principal de reportes (admin only) - Soft UI
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
import MetricCard from '../components/MetricCard';
import SoftCard from '../components/SoftCard';

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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">📊 Reportes</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Análisis y estadísticas del negocio</p>
      </div>

      {/* Tabs - Soft UI */}
      <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100">
        <nav className="flex flex-wrap gap-2">
          {['ventas', 'productos', 'stock', 'margenes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'ventas' && 'Ventas por Período'}
              {tab === 'productos' && 'Productos Más Vendidos'}
              {tab === 'stock' && 'Stock Crítico'}
              {tab === 'margenes' && 'Márgenes'}
            </button>
          ))}
        </nav>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Contenido según tab activo */}
      {activeTab === 'ventas' && (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Filtros - Soft UI */}
          <SoftCard title="Filtros" icon="📅">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={cargarReporteVentas}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  className="flex-1 bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>
          </SoftCard>

          {/* Resumen - MetricCard */}
          {reporteVentas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <MetricCard
                  title="Total Ventas"
                  value={reporteVentas.resumen.cantidad_ventas}
                  icon="📈"
                  color="blue"
                />
                <MetricCard
                  title="Facturación Total"
                  value={formatCurrency(reporteVentas.resumen.total_ventas)}
                  icon="💵"
                  color="green"
                />
                <MetricCard
                  title="Promedio por Ticket"
                  value={formatCurrency(reporteVentas.resumen.promedio_ticket)}
                  icon="🎫"
                  color="blue"
                />
                <MetricCard
                  title="Total Descuentos"
                  value={formatCurrency(reporteVentas.resumen.total_descuentos)}
                  icon="🏷️"
                  color="orange"
                />
              </div>

              {/* Gráfico ventas por día - Soft UI */}
              {reporteVentas.por_dia?.length > 0 && (
                <SoftCard title="Ventas por día" icon="📉">
                  <div className="h-72 min-h-[200px] w-full" style={{ minWidth: 280 }}>
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
                </SoftCard>
              )}

              {/* Por método de pago - Soft UI */}
              <SoftCard title="Ventas por Método de Pago" icon="💳">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                          Método
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {reporteVentas.por_metodo_pago.map((metodo, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {metodo.metodo_pago}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {metodo.cantidad}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {formatCurrency(metodo.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SoftCard>
            </>
          )}
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Filtros - Soft UI */}
          <SoftCard title="Configuración" icon="⚙️">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={tipoRanking}
                  onChange={(e) => setTipoRanking(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                >
                  <option value="cantidad">Cantidad Vendida</option>
                  <option value="facturacion">Facturación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Límite
                </label>
                <input
                  type="number"
                  value={limiteProductos}
                  onChange={(e) => setLimiteProductos(parseInt(e.target.value))}
                  min="5"
                  max="100"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  onClick={cargarProductosMasVendidos}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  className="flex-1 bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {exportandoExcel ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>
          </SoftCard>

          {/* Gráfico productos más vendidos - Soft UI */}
          {productosMasVendidos?.productos?.length > 0 && (
            <SoftCard title="Top 10 – Gráfico" icon="📊">
              <div className="h-80 min-h-[200px] w-full" style={{ minWidth: 280 }}>
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
            </SoftCard>
          )}

          {/* Tabla - Soft UI */}
          {productosMasVendidos && (
            <SoftCard title={`Top ${productosMasVendidos.productos.length} Productos`} icon="🏆">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Cantidad</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Facturación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {productosMasVendidos.productos.map((producto, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          {producto.variante__sku}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-800">
                          {producto.variante__nombre_variante}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {producto.cantidad_vendida}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(producto.total_facturado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SoftCard>
          )}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Filtros - Soft UI */}
          <SoftCard title="Configuración" icon="⚙️">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Umbral de Stock Crítico
                </label>
                <input
                  type="number"
                  value={umbralStock}
                  onChange={(e) => setUmbralStock(parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Productos con stock menor o igual a este valor
                </p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cargarStockCritico}
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </SoftCard>

          {/* Tabla - Soft UI */}
          {stockCritico && (
            <SoftCard title={`${stockCritico.total} Productos con Stock Crítico`} icon="⚠️">
              {stockCritico.total === 0 ? (
                <p className="text-center py-12 text-gray-500">
                  No hay productos con stock crítico
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Depósito</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Stock</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {stockCritico.productos.map((producto, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {producto.codigo}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-800">
                            {producto.nombre}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                            {producto.deposito}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {producto.cantidad}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg border ${
                              producto.estado === 'SIN_STOCK' 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
            </SoftCard>
          )}
        </div>
      )}

      {activeTab === 'margenes' && (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Filtros - Soft UI */}
          <SoftCard title="Configuración" icon="⚙️">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenMargen}
                  onChange={(e) => setOrdenMargen(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
                >
                  <option value="margen_desc">Mayor Margen</option>
                  <option value="margen_asc">Menor Margen</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cargarReporteMargen}
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Cargando...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
          </SoftCard>

          {/* Tabla - Soft UI */}
          {reporteMargen && (
            <SoftCard title="Márgenes por Producto" icon="📈">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Vendidas</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden lg:table-cell">Costo Total</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden lg:table-cell">Venta Total</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Margen $</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reporteMargen.productos.map((producto, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          {producto.codigo}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-800">
                          {producto.nombre}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {producto.cantidad_vendida}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800 hidden lg:table-cell">
                          {formatCurrency(producto.total_costo)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800 hidden lg:table-cell">
                          {formatCurrency(producto.total_venta)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(producto.margen_total)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs sm:text-sm font-semibold rounded-lg border ${
                            producto.margen_porcentaje < 5 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : producto.margen_porcentaje < 15 
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {producto.margen_porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SoftCard>
          )}
        </div>
      )}
    </div>
  );
}
