/**
 * Página de configuración del sistema (solo admin)
 */
import { useState, useEffect } from 'react';
import { 
  getConfiguraciones, 
  actualizarValorConfig,
  getCategorias 
} from '../services/configuracionService';

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
      const [configs, cats] = await Promise.all([
        getConfiguraciones(),
        getCategorias()
      ]);
      
      setConfiguraciones(configs);
      setCategorias(cats.categorias || []);
      
      // Inicializar valores temporales
      const temp = {};
      configs.forEach(config => {
        temp[config.id] = config.valor;
      });
      setValoresTemp(temp);
      
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);
      setError('Error al cargar las configuraciones');
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
      setConfiguraciones(configuraciones.map(c => 
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

  const configsFiltradas = configuraciones.filter(
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );
      
      default: // STRING
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleValorChange(config.id, e.target.value)}
            disabled={!config.es_editable || guardando}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        );
    }
  };

  const getCategoriaNombre = (categoria) => {
    const nombres = {
      'INVENTARIO': 'Inventario',
      'VENTAS': 'Ventas',
      'GENERAL': 'General',
      'REPORTES': 'Reportes',
      'SISTEMA': 'Sistema'
    };
    return nombres[categoria] || categoria;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">
          Parámetros configurables del sistema
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{mensaje}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuraciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de categorías */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
              <div className="space-y-2">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      categoriaActiva === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {getCategoriaNombre(cat)}
                    <span className="ml-2 text-xs opacity-75">
                      ({configuraciones.filter(c => c.categoria === cat).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {getCategoriaNombre(categoriaActiva)}
              </h2>
              
              {configsFiltradas.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No hay configuraciones en esta categoría
                </p>
              ) : (
                <div className="space-y-6">
                  {configsFiltradas.map((config) => (
                    <div key={config.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-900">
                            {config.clave}
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            {config.descripcion}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {config.tipo_dato_display}
                            </span>
                            {!config.es_editable && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Solo lectura
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <div className="flex-1">
                          {renderInput(config)}
                        </div>
                        
                        {config.es_editable && valoresTemp[config.id] !== config.valor && (
                          <button
                            onClick={() => guardarConfiguracion(config)}
                            disabled={guardando}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                          >
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los cambios en la configuración se aplican inmediatamente.
              Algunos parámetros pueden requerir reiniciar la sesión para verse reflejados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
