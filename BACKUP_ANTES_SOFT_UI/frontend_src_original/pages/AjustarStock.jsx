/**
 * Página para ajustar stock manualmente (solo admin)
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ajustarStock } from '../services/inventarioService';
import productosService from '../services/productosService';

export default function AjustarStock() {
  const { varianteId, depositoId } = useParams();
  const navigate = useNavigate();
  
  const [variante, setVariante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nueva_cantidad: '',
    observaciones: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarVariante();
  }, [varianteId]);

  const cargarVariante = async () => {
    try {
      setLoading(true);
      const data = await productosService.getVariante(varianteId);
      setVariante(data);
      
      // Obtener stock actual del depósito seleccionado
      const stockEnDeposito = data.stocks?.find(s => s.deposito === parseInt(depositoId));
      if (stockEnDeposito) {
        setFormData(prev => ({
          ...prev,
          nueva_cantidad: stockEnDeposito.cantidad.toString()
        }));
      }
    } catch (err) {
      console.error('Error al cargar variante:', err);
      setError('Error al cargar los datos del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nueva_cantidad || formData.nueva_cantidad === '') {
      newErrors.nueva_cantidad = 'La cantidad es obligatoria';
    } else if (parseInt(formData.nueva_cantidad) < 0) {
      newErrors.nueva_cantidad = 'La cantidad no puede ser negativa';
    }
    
    if (!formData.observaciones.trim()) {
      newErrors.observaciones = 'Las observaciones son obligatorias';
    } else if (formData.observaciones.trim().length < 10) {
      newErrors.observaciones = 'Las observaciones deben tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await ajustarStock({
        variante_id: parseInt(varianteId),
        deposito_id: parseInt(depositoId),
        nueva_cantidad: parseInt(formData.nueva_cantidad),
        observaciones: formData.observaciones.trim()
      });
      
      setSuccess(response.message || 'Ajuste realizado correctamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/inventario');
      }, 2000);
    } catch (err) {
      console.error('Error al ajustar stock:', err);
      setError(err.response?.data?.error || err.response?.data?.observaciones?.[0] || 'Error al ajustar el stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ajustar Stock</h1>
        <p className="text-gray-600 mt-1">
          Realiza un ajuste manual de stock para este producto
        </p>
      </div>

      {/* Información del Producto */}
      {variante && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900">Producto</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Código:</span> {variante.codigo}
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Nombre:</span> {variante.nombre_completo}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Advertencia
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              El ajuste manual de stock debe usarse solo para correcciones de inventario. 
              Para compras y ventas, use los módulos correspondientes.
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Nueva Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva Cantidad *
          </label>
          <input
            type="number"
            name="nueva_cantidad"
            value={formData.nueva_cantidad}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nueva_cantidad ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.nueva_cantidad && (
            <p className="mt-1 text-sm text-red-600">{errors.nueva_cantidad}</p>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones * (mínimo 10 caracteres)
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.observaciones ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Motivo del ajuste, inventario físico, corrección de error, etc."
          />
          {errors.observaciones && (
            <p className="mt-1 text-sm text-red-600">{errors.observaciones}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.observaciones.length} caracteres
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Ajustando...' : 'Ajustar Stock'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/inventario')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
