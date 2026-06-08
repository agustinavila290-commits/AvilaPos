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
  getCajeros,
  getVentasAnuladas,
  getDescuentosResumen,
  getClientesDeuda,
  getComprasPorProveedor,
  descargarVentasAnuladasExcel,
  descargarClientesDeudaExcel,
  descargarComprasProveedorExcel,
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

  // Cajeros (filtro compartido)
  const [cajeros, setCajeros] = useState([]);
  const [cajeroId, setCajeroId] = useState('');

  // Estado para ventas anuladas
  const [anuladas, setAnuladas] = useState(null);

  // Estado para descuentos
  const [descuentos, setDescuentos] = useState(null);

  // Estado para clientes con deuda
  const [deuda, setDeuda] = useState(null);
  const [soloVencidos, setSoloVencidos] = useState(false);

  // Estado para compras por proveedor
  const [comprasProv, setComprasProv] = useState(null);

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

  const cargarVentasAnuladas = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true); setError('');
    try {
      const data = await getVentasAnuladas({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, usuario_id: cajeroId || undefined });
      setAnuladas(data);
    } catch { setError('Error al cargar ventas anuladas'); }
    finally { setLoading(false); }
  };

  const cargarDescuentos = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true); setError('');
    try {
      const data = await getDescuentosResumen({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, usuario_id: cajeroId || undefined });
      setDescuentos(data);
    } catch { setError('Error al cargar descuentos'); }
    finally { setLoading(false); }
  };

  const cargarDeuda = async () => {
    setLoading(true); setError('');
    try {
      const data = await getClientesDeuda({ solo_vencidos: soloVencidos });
      setDeuda(data);
    } catch { setError('Error al cargar clientes con deuda'); }
    finally { setLoading(false); }
  };

  const cargarComprasProv = async () => {
    setLoading(true); setError('');
    try {
      const data = await getComprasPorProveedor({ fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined });
      setComprasProv(data);
    } catch { setError('Error al cargar compras por proveedor'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    getCajeros().then(setCajeros).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'ventas' && !reporteVentas) {
      cargarReporteVentas();
    } else if (activeTab === 'productos' && !productosMasVendidos) {
      cargarProductosMasVendidos();
    } else if (activeTab === 'stock' && !stockCritico) {
      cargarStockCritico();
    } else if (activeTab === 'margenes' && !reporteMargen) {
      cargarReporteMargen();
    } else if (activeTab === 'anuladas' && !anuladas) {
      cargarVentasAnuladas();
    } else if (activeTab === 'descuentos' && !descuentos) {
      cargarDescuentos();
    } else if (activeTab === 'deuda' && !deuda) {
      cargarDeuda();
    } else if (activeTab === 'compras_prov' && !comprasProv) {
      cargarComprasProv();
    }
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
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
          {[
            { id: 'ventas', label: 'Ventas' },
            { id: 'anuladas', label: 'Anuladas' },
            { id: 'descuentos', label: 'Descuentos' },
            { id: 'productos', label: 'Más Vendidos' },
            { id: 'stock', label: 'Stock Crítico' },
            { id: 'margenes', label: 'Márgenes' },
            { id: 'deuda', label: 'Clientes c/Deuda' },
            { id: 'compras_prov', label: 'Compras Prov.' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                activeTab === id
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cajero</label>
                <select
                  value={cajeroId}
                  onChange={e => setCajeroId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 shadow-sm"
                >
                  <option value="">Todos</option>
                  {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
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
      {/* ── TAB: VENTAS ANULADAS ──────────────────────────────────── */}
      {activeTab === 'anuladas' && (
        <div className="space-y-4">
          <SoftCard title="Ventas Anuladas" icon="🚫">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cajero</label>
                <select value={cajeroId} onChange={e => setCajeroId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <option value="">Todos</option>
                  {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={cargarVentasAnuladas} disabled={loading}
                  className="flex-1 bg-gradient-to-br from-red-500 to-red-600 text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                  {loading ? 'Cargando...' : 'Generar'}
                </button>
                {anuladas && (
                  <button onClick={() => descargarVentasAnuladasExcel({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta })}
                    className="flex-1 bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl font-semibold">
                    Excel
                  </button>
                )}
              </div>
            </div>
          </SoftCard>
          {anuladas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Ventas Anuladas" value={anuladas.resumen?.cantidad || 0} icon="🚫" color="red" />
                <MetricCard title="Monto Anulado" value={formatCurrency(anuladas.resumen?.total_anulado || 0)} icon="💸" color="red" />
              </div>
              <SoftCard title={`Detalle (${anuladas.ventas?.length || 0})`} icon="📋">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['N°', 'Fecha', 'Cliente', 'Total', 'Método', 'Motivo Anulación', 'Cajero', 'Anuló'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(anuladas.ventas || []).map(v => (
                        <tr key={v.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold text-red-600">#{v.numero}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2">{v.cliente__nombre || 'Cons. Final'}</td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(v.total)}</td>
                          <td className="px-3 py-2 text-xs">{v.metodo_pago}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{v.motivo_anulacion || '—'}</td>
                          <td className="px-3 py-2 text-xs">{`${v.usuario__first_name || ''} ${v.usuario__last_name || ''}`.trim() || '—'}</td>
                          <td className="px-3 py-2 text-xs">{`${v.usuario_anulacion__first_name || ''} ${v.usuario_anulacion__last_name || ''}`.trim() || '—'}</td>
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

      {/* ── TAB: DESCUENTOS ──────────────────────────────────────── */}
      {activeTab === 'descuentos' && (
        <div className="space-y-4">
          <SoftCard title="Descuentos Aplicados" icon="🏷️">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cajero</label>
                <select value={cajeroId} onChange={e => setCajeroId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <option value="">Todos</option>
                  {cajeros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={cargarDescuentos} disabled={loading}
                  className="w-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                  {loading ? 'Cargando...' : 'Generar'}
                </button>
              </div>
            </div>
          </SoftCard>
          {descuentos && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Ventas c/Descuento" value={descuentos.resumen?.cantidad_con_descuento || 0} icon="🏷️" color="yellow" />
                <MetricCard title="Total Descuentos" value={formatCurrency(descuentos.resumen?.total_descuentos || 0)} icon="💸" color="yellow" />
                <MetricCard title="% Promedio" value={`${parseFloat(descuentos.resumen?.promedio_descuento_pct || 0).toFixed(1)}%`} icon="📉" color="blue" />
              </div>
              {descuentos.por_cajero?.length > 0 && (
                <SoftCard title="Por Cajero" icon="👤">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Cajero', 'Ventas con Desc.', 'Total Descuento'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {descuentos.por_cajero.map((c, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{`${c.usuario__first_name || ''} ${c.usuario__last_name || ''}`.trim() || 'Sistema'}</td>
                          <td className="px-3 py-2 text-center">{c.cantidad}</td>
                          <td className="px-3 py-2 font-semibold text-yellow-700">{formatCurrency(c.total_descuento)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SoftCard>
              )}
              <SoftCard title={`Ventas con descuento (${descuentos.ventas_con_descuento?.length || 0})`} icon="📋">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['N°', 'Fecha', 'Cliente', 'Total', 'Descuento $', 'Desc. %', 'Cajero'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(descuentos.ventas_con_descuento || []).map(v => (
                        <tr key={v.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold text-blue-600">#{v.numero}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2">{v.cliente__nombre || 'Cons. Final'}</td>
                          <td className="px-3 py-2">{formatCurrency(v.total)}</td>
                          <td className="px-3 py-2 font-semibold text-yellow-700">{formatCurrency(v.descuento_monto)}</td>
                          <td className="px-3 py-2">{parseFloat(v.descuento_porcentaje || 0).toFixed(1)}%</td>
                          <td className="px-3 py-2 text-xs">{`${v.usuario__first_name || ''} ${v.usuario__last_name || ''}`.trim() || '—'}</td>
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

      {/* ── TAB: CLIENTES CON DEUDA ────────────────────────────────── */}
      {activeTab === 'deuda' && (
        <div className="space-y-4">
          <SoftCard title="Clientes con Deuda Pendiente" icon="💳">
            <div className="flex flex-wrap gap-4 items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={soloVencidos} onChange={e => setSoloVencidos(e.target.checked)}
                  className="accent-red-500" />
                Solo vencidos
              </label>
              <button onClick={cargarDeuda} disabled={loading}
                className="bg-gradient-to-br from-red-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Cargando...' : 'Actualizar'}
              </button>
              {deuda && (
                <button onClick={() => descargarClientesDeudaExcel({ solo_vencidos: soloVencidos })}
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white px-5 py-2.5 rounded-xl font-semibold">
                  Exportar Excel
                </button>
              )}
            </div>
          </SoftCard>
          {deuda && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Clientes con Deuda" value={deuda.total_clientes_con_deuda || 0} icon="👥" color="red" />
                <MetricCard title="Deuda Total" value={formatCurrency(deuda.total_deuda || 0)} icon="💰" color="red" />
              </div>
              <SoftCard title="Listado de deudores" icon="📋">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Cliente', 'Teléfono', 'Deuda Total', 'Tickets Pend.', 'Tickets Venc.', 'WhatsApp'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(deuda.clientes || []).map((c, i) => (
                        <tr key={i} className={`border-b hover:bg-gray-50 ${c.tickets_vencidos > 0 ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 font-medium">{c.nombre}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{c.telefono || '—'}</td>
                          <td className="px-3 py-2 font-bold text-red-600">{formatCurrency(c.deuda_total)}</td>
                          <td className="px-3 py-2 text-center">{c.tickets_pendientes}</td>
                          <td className="px-3 py-2 text-center">
                            {c.tickets_vencidos > 0
                              ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.tickets_vencidos}</span>
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {c.whatsapp && (
                              <a
                                href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(c.nombre)}%2C%20te%20contactamos%20por%20una%20deuda%20pendiente%20de%20${encodeURIComponent(formatCurrency(c.deuda_total))}.`}
                                target="_blank" rel="noreferrer"
                                className="text-green-600 text-xs underline"
                              >
                                Enviar
                              </a>
                            )}
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

      {/* ── TAB: COMPRAS POR PROVEEDOR ─────────────────────────────── */}
      {activeTab === 'compras_prov' && (
        <div className="space-y-4">
          <SoftCard title="Compras por Proveedor" icon="📦">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={cargarComprasProv} disabled={loading}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                  {loading ? 'Cargando...' : 'Generar'}
                </button>
                {comprasProv && (
                  <button onClick={() => descargarComprasProveedorExcel({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta })}
                    className="flex-1 bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl font-semibold">
                    Excel
                  </button>
                )}
              </div>
            </div>
          </SoftCard>
          {comprasProv && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Total Compras" value={comprasProv.resumen?.cantidad_total || 0} icon="📥" color="blue" />
                <MetricCard title="Monto Total" value={formatCurrency(comprasProv.resumen?.monto_total || 0)} icon="💵" color="blue" />
              </div>
              <SoftCard title="Por Proveedor" icon="🏭">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Proveedor', 'N° Compras', 'Monto Total'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(comprasProv.por_proveedor || []).map((p, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{p.proveedor__nombre}</td>
                          <td className="px-3 py-2 text-center">{p.cantidad_compras}</td>
                          <td className="px-3 py-2 font-bold text-blue-700">{formatCurrency(p.monto_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SoftCard>
              <SoftCard title={`Detalle de compras (${comprasProv.detalle?.length || 0})`} icon="📋">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['N°', 'Fecha', 'Proveedor', 'Factura', 'Total', 'Registró'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(comprasProv.detalle || []).map(c => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold text-blue-600">#{c.numero}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2">{c.proveedor__nombre}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{c.numero_factura || '—'}</td>
                          <td className="px-3 py-2 font-semibold">{formatCurrency(c.total)}</td>
                          <td className="px-3 py-2 text-xs">{`${c.usuario__first_name || ''} ${c.usuario__last_name || ''}`.trim() || '—'}</td>
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
    </div>
  );
}
