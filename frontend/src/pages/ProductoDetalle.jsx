import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import productosService from '../services/productosService';
import { useAuth } from '../hooks/useAuth';

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const MARGEN_DEFAULT = { mostrador: 75, web: 60, tarjeta: 84 };
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id === 'nuevo' || id === 'importar' || !/^\d+$/.test(id)) {
      navigate('/productos');
      return;
    }
    loadProducto();
  }, [id]);

  const loadProducto = async () => {
    try {
      setLoading(true);
      const data = await productosService.getVariante(id);
      setProducto(data);
      const costo = parseFloat(data.costo) || 0;
      const pm = parseFloat(data.precio_mostrador);
      const pw = parseFloat(data.precio_web);
      const pt = data.precio_tarjeta != null ? parseFloat(data.precio_tarjeta) : null;
      setFormData({
        nombre_variante: data.nombre_variante,
        codigo: data.codigo,
        costo: data.costo,
        precio_mostrador: data.precio_mostrador,
        precio_web: data.precio_web,
        precio_tarjeta: data.precio_tarjeta ?? '',
        pct_mostrador: costo > 0 && !isNaN(pm) ? Math.round((pm / costo - 1) * 100) : MARGEN_DEFAULT.mostrador,
        pct_web: costo > 0 && !isNaN(pw) ? Math.round((pw / costo - 1) * 100) : MARGEN_DEFAULT.web,
        pct_tarjeta: costo > 0 && pt != null && !isNaN(pt) ? Math.round((pt / costo - 1) * 100) : MARGEN_DEFAULT.tarjeta,
        activo: data.activo
      });
    } catch (error) {
      console.error('Error al cargar producto:', error);
      alert('Error al cargar el producto');
      navigate('/productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { ...formData };
      delete payload.pct_mostrador;
      delete payload.pct_web;
      delete payload.pct_tarjeta;
      await productosService.updateVariante(id, payload);
      alert('Producto actualizado correctamente');
      setEditando(false);
      loadProducto();
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert(error.response?.data?.error || 'Error al actualizar el producto');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await productosService.deleteVariante(id);
      alert('Producto eliminado correctamente');
      navigate('/productos');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el producto');
    }
  };

  const imprimirCodigoBarras = (codigo) => {
    const code = String(codigo || '').trim();
    if (!code) {
      alert('El código está vacío.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 8
      });
      const dataUrl = canvas.toDataURL('image/png');
      const ventana = window.open('', '_blank', 'width=320,height=200');
      if (!ventana) {
        alert('Permití ventanas emergentes para imprimir el código de barras.');
        return;
      }
      ventana.document.write(`
        <!DOCTYPE html>
        <html><head><title>Código de barras</title></head>
        <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <img src="${dataUrl}" alt="Código ${code}" />
          <p style="margin-top:8px;font-size:14px;">${code}</p>
          <script>window.onload=function(){window.print();window.close();}</script>
        </body></html>
      `);
      ventana.document.close();
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el código de barras.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!producto) {
    return <div>Producto no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
        <div>
          <button
            onClick={() => navigate('/productos')}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Productos
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate min-w-0">{producto.nombre_completo}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Código: {producto.codigo}</p>
        </div>
        
        {isAdmin() && !editando && (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setEditando(true)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 text-sm sm:text-base"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 text-sm sm:text-base"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {editando ? (
        /* Formulario de edición */
        <form onSubmit={handleSubmit} className="card space-y-3 sm:space-y-4 lg:space-y-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Editar Producto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div className="md:col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                  className="input-field"
                  placeholder="Código del producto"
                />
              </div>
              <button
                type="button"
                onClick={() => imprimirCodigoBarras(formData.codigo)}
                className="shrink-0 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 flex items-center gap-2"
                title="Imprimir código de barras"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir código
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Variante *
              </label>
              <input
                type="text"
                required
                value={formData.nombre_variante}
                onChange={(e) => setFormData({...formData, nombre_variante: e.target.value})}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costo}
                onChange={(e) => {
                  const costo = e.target.value;
                  const c = parseFloat(costo);
                  setFormData(prev => {
                    const next = { ...prev, costo };
                    if (!isNaN(c) && c >= 0) {
                      next.precio_mostrador = (c * (1 + (prev.pct_mostrador ?? 75) / 100)).toFixed(2);
                      next.precio_web = (c * (1 + (prev.pct_web ?? 60) / 100)).toFixed(2);
                      next.precio_tarjeta = (c * (1 + (prev.pct_tarjeta ?? 84) / 100)).toFixed(2);
                    }
                    return next;
                  });
                }}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Mostrador * <span className="text-gray-500 font-normal">(% margen)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio_mostrador}
                  onChange={(e) => {
                    const v = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      precio_mostrador: v,
                      pct_mostrador: costo > 0 && v !== '' ? Math.round((parseFloat(v) / costo - 1) * 100) : (prev.pct_mostrador ?? 75)
                    }));
                  }}
                  className="input-field flex-1"
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.pct_mostrador !== undefined && formData.pct_mostrador !== '' ? formData.pct_mostrador : MARGEN_DEFAULT.mostrador}
                  onChange={(e) => {
                    const pct = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      pct_mostrador: pct,
                      precio_mostrador: costo > 0 && pct !== '' ? (costo * (1 + parseFloat(pct) / 100)).toFixed(2) : prev.precio_mostrador
                    }));
                  }}
                  className="input-field w-16 text-center"
                  title="Margen %"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Web * <span className="text-gray-500 font-normal">(% margen)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio_web}
                  onChange={(e) => {
                    const v = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      precio_web: v,
                      pct_web: costo > 0 && v !== '' ? Math.round((parseFloat(v) / costo - 1) * 100) : (prev.pct_web ?? 60)
                    }));
                  }}
                  className="input-field flex-1"
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.pct_web !== undefined && formData.pct_web !== '' ? formData.pct_web : MARGEN_DEFAULT.web}
                  onChange={(e) => {
                    const pct = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      pct_web: pct,
                      precio_web: costo > 0 && pct !== '' ? (costo * (1 + parseFloat(pct) / 100)).toFixed(2) : prev.precio_web
                    }));
                  }}
                  className="input-field w-16 text-center"
                  title="Margen %"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Tarjeta * <span className="text-gray-500 font-normal">(% margen)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio_tarjeta}
                  onChange={(e) => {
                    const v = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      precio_tarjeta: v,
                      pct_tarjeta: costo > 0 && v !== '' ? Math.round((parseFloat(v) / costo - 1) * 100) : (prev.pct_tarjeta ?? 84)
                    }));
                  }}
                  className="input-field flex-1"
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.pct_tarjeta !== undefined && formData.pct_tarjeta !== '' ? formData.pct_tarjeta : MARGEN_DEFAULT.tarjeta}
                  onChange={(e) => {
                    const pct = e.target.value;
                    const costo = parseFloat(formData.costo);
                    setFormData(prev => ({
                      ...prev,
                      pct_tarjeta: pct,
                      precio_tarjeta: costo > 0 && pct !== '' ? (costo * (1 + parseFloat(pct) / 100)).toFixed(2) : prev.precio_tarjeta
                    }));
                  }}
                  className="input-field w-16 text-center"
                  title="Margen %"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Producto Activo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                loadProducto();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      ) : (
        /* Vista de solo lectura */
        <div className="space-y-6">
          {/* Información General */}
          <div className="card">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Información General</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Producto Base</dt>
                <dd className="mt-1 text-sm text-gray-900">{producto.producto_nombre}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Variante</dt>
                <dd className="mt-1 text-sm text-gray-900">{producto.nombre_variante}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Marca</dt>
                <dd className="mt-1 text-sm text-gray-900">{producto.marca_nombre}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                <dd className="mt-1 text-sm text-gray-900">{producto.categoria_nombre}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Código</dt>
                <dd className="mt-1 text-sm font-mono text-gray-900">{producto.codigo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold rounded-full ${
                    producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Stock Actual</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold rounded-full ${
                    producto.stock_actual <= 2
                      ? 'bg-red-100 text-red-800'
                      : producto.stock_actual <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {producto.stock_actual} unidades
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Precios y Márgenes */}
          {isAdmin() && (
            <div className="card">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Precios y Márgenes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Costo</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">${parseFloat(producto.costo).toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Precio Mostrador</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">${parseFloat(producto.precio_mostrador).toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Precio Web</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">${parseFloat(producto.precio_web).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Precio Tarjeta</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">${parseFloat(producto.precio_tarjeta).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Margen de Ganancia</span>
                  <span className={`text-lg font-bold ${
                    producto.margen_porcentaje < 5
                      ? 'text-red-600'
                      : producto.margen_porcentaje < 15
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {producto.margen_porcentaje.toFixed(2)}% (${(producto.precio_mostrador - producto.costo).toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
