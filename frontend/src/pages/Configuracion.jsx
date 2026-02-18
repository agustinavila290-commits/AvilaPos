/**
 * Página de configuración del sistema (solo admin) - Soft UI
 */
import { useState, useEffect } from 'react';
import { 
  getConfiguraciones, 
  actualizarValorConfig,
  getCategorias 
} from '../services/configuracionService';
import SoftCard from '../components/SoftCard';

export default function Configuracion() {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('INVENTARIO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // Estados temporales para edición
  const [valoresTemp, setValoresTemp] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [configsRes, cats] = await Promise.all([
        getConfiguraciones(),
        getCategorias()
      ]);
      const configs = Array.isArray(configsRes) ? configsRes : (configsRes?.results ?? []);
      setConfiguraciones(configs);
      setCategorias(Array.isArray(cats?.categorias) ? cats.categorias : (cats?.categorias ? [cats.categorias] : []));
      
      // Inicializar valores temporales
      const temp = {};
      configs.forEach(config => {
        temp[config.id] = config.valor;
      });
      setValoresTemp(temp);
      
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);
      setError('Error al cargar las configuraciones');
      setConfiguraciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValorChange = (configId, nuevoValor) => {
    setValoresTemp({
      ...valoresTemp,
      [configId]: nuevoValor
    });
  };

  const guardarConfiguracion = async (config) => {
    try {
      setGuardando(true);
      setError('');
      setMensaje('');
      
      const nuevoValor = valoresTemp[config.id];
      
      await actualizarValorConfig(config.id, nuevoValor);
      
      // Actualizar en la lista local
      setConfiguraciones((Array.isArray(configuraciones) ? configuraciones : []).map(c => 
        c.id === config.id 
          ? { ...c, valor: nuevoValor }
          : c
      ));
      
      setMensaje(`✓ ${config.clave} actualizado correctamente`);
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const configsFiltradas = (Array.isArray(configuraciones) ? configuraciones : []).filter(
    c => c.categoria === categoriaActiva
  );

  const renderInput = (config) => {
    const valor = valoresTemp[config.id] ?? config.valor;
    
    switch (config.tipo_dato) {
      case 'BOOLEAN':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={valor === 'true' || valor === true}
              onChange={(e) => handleValorChange(config.id, e.target.checked ? 'true' : 'false')}
              disabled={!config.es_editable || guardando}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              {valor === 'true' || valor === true ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        );
      
      case 'INTEGER':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => handleValorChange(config.id, e.target.value)}
            disabled={!config.es_editable || guardando}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm disabled:bg-gray-100"
          />
        );
      
      case 'DECIMAL':
        return (
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => handleValorChange(config.id, e.target.value)}
            disabled={!config.es_editable || guardando}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm disabled:bg-gray-100"
          />
        );
      
      default: // STRING
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleValorChange(config.id, e.target.value)}
            disabled={!config.es_editable || guardando}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm disabled:bg-gray-100"
          />
        );
    }
  };

  const getCategoriaNombre = (categoria) => {
    const nombres = {
      'INVENTARIO': 'Inventario',
      'VENTAS': 'POS / Ventas',
      'GENERAL': 'Datos de la empresa',
      'REPORTES': 'Reportes',
      'SISTEMA': 'Sistema'
    };
    return nombres[categoria] || categoria;
  };

  /** Etiquetas amigables para las claves (especialmente útiles para el POS) */
  const getClaveLabel = (clave) => {
    const labels = {
      UMBRAL_STOCK_BAJO: 'Umbral stock bajo (unidades)',
      UMBRAL_STOCK_CRITICO: 'Umbral stock crítico (unidades)',
      PERMITIR_STOCK_NEGATIVO: 'Permitir stock negativo',
      UMBRAL_MARGEN_BAJO: 'Margen bajo (%) – alerta',
      DESCUENTO_MAX_CAJERO: 'Descuento máximo cajero (%)',
      DESCUENTO_MAX_ADMIN: 'Descuento máximo administrador (%)',
      CLIENTE_OBLIGATORIO: 'Cliente obligatorio en ventas',
      ALERTAR_MARGEN_BAJO: 'Alertar cuando el margen es bajo',
      NOMBRE_EMPRESA: 'Nombre de la empresa',
      TELEFONO_EMPRESA: 'Teléfono',
      DIRECCION_EMPRESA: 'Dirección',
      CUIT_EMPRESA: 'CUIT',
      LIMITE_PRODUCTOS_TOP: 'Límite productos en ranking',
      DIAS_REPORTE_DEFECTO: 'Días por defecto en reportes',
      VERSION_SISTEMA: 'Versión del sistema',
      MODO_MANTENIMIENTO: 'Modo mantenimiento'
    };
    return labels[clave] || clave;
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Soft UI */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">⚙️ Configuración del Sistema</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Parámetros configurables del sistema y del Punto de Venta (POS)
        </p>
      </div>

      {/* Resumen configuración POS */}
      <SoftCard title="Configuración del POS (Punto de Venta)" icon="🛒" className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          En la categoría <strong>POS / Ventas</strong> puedes modificar:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li><strong>Cliente obligatorio</strong>: si debe elegirse un cliente en cada venta.</li>
          <li><strong>Descuento máximo cajero / admin</strong>: límites de descuento por rol (el backend ya los aplica).</li>
          <li><strong>Margen bajo</strong>: umbral y alerta cuando el margen de la venta es bajo.</li>
        </ul>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          En <strong>Datos de la empresa</strong>: nombre, teléfono, dirección y CUIT (útil para tickets e impresiones).
        </p>
      </SoftCard>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-green-800">{mensaje}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Cargando configuraciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Sidebar de categorías - Soft UI */}
          <div className="lg:col-span-1">
            <SoftCard title="Categorías" icon="📁">
              <div className="space-y-2">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      categoriaActiva === cat
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {getCategoriaNombre(cat)}
                    <span className="ml-2 text-xs opacity-75">
                      ({(Array.isArray(configuraciones) ? configuraciones : []).filter(c => c.categoria === cat).length})
                    </span>
                  </button>
                ))}
              </div>
            </SoftCard>
          </div>

          {/* Contenido principal - Soft UI */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:space-y-6">
            <SoftCard title={getCategoriaNombre(categoriaActiva)} icon="📝">
              
              {configsFiltradas.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No hay configuraciones en esta categoría
                </p>
              ) : (
                <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                  {configsFiltradas.map((config) => (
                    <div key={config.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {getClaveLabel(config.clave)}
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            {config.descripcion}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                              {config.tipo_dato_display}
                            </span>
                            {!config.es_editable && (
                              <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
                                Solo lectura
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          {renderInput(config)}
                        </div>
                        
                        {config.es_editable && valoresTemp[config.id] !== config.valor && (
                          <button
                            onClick={() => guardarConfiguracion(config)}
                            disabled={guardando}
                            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SoftCard>
          </div>
        </div>
      )}

      {/* Información adicional - Soft UI */}
      <SoftCard
        title="Nota"
        icon="ℹ️"
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
      >
        <p className="text-sm text-blue-800">
          Los cambios en la configuración se aplican inmediatamente.
          Algunos parámetros pueden requerir reiniciar la sesión para verse reflejados.
        </p>
      </SoftCard>
    </div>
  );
}
