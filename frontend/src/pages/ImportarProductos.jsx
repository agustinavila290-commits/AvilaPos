import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productosService from '../services/productosService';

export default function ImportarProductos() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar extensión
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const data = await productosService.importarExcel(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setResult(data);
    } catch (error) {
      console.error('Error al importar:', error);
      alert('Error al importar el archivo: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Crear template de ejemplo
    const csvContent = `codigo,nombre_producto,nombre_variante,marca,categoria,costo,precio_mostrador,precio_web,stock_inicial
7891234567890,Pistón Honda CG 150,STD,Honda,Motor,1000.00,1500.00,1400.00,10
7891234567891,Pistón Honda CG 150,0.25,Honda,Motor,1050.00,1550.00,1450.00,5
7891234567892,Pistón Honda CG 150,0.50,Honda,Motor,1100.00,1600.00,1500.00,8`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_productos.csv';
    a.click();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/productos')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Productos
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Importar Productos desde Excel</h1>
        <p className="text-gray-600 mt-1">Carga masiva de productos y variantes</p>
      </div>

      {/* Instrucciones */}
      <div className="card bg-blue-50 border border-blue-200 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Instrucciones</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>El archivo debe ser Excel (.xlsx o .xls)</li>
          <li>La primera fila debe contener los encabezados</li>
          <li><strong>Columnas requeridas:</strong> codigo, nombre_producto, marca, costo, precio_mostrador</li>
          <li><strong>Opcionales (con valor por defecto):</strong> nombre_variante (Única), categoria (General), precio_web (0), stock_inicial</li>
          <li>El código puede ser un código de barras, SKU o cualquier identificador único</li>
          <li>El sistema agrupa automáticamente las variantes por nombre de producto</li>
          <li>Si una marca o categoría no existe, se crea automáticamente</li>
        </ol>
        <div className="mt-4">
          <button
            onClick={downloadTemplate}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar plantilla de ejemplo
          </button>
        </div>
      </div>

      {/* Selector de archivo */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Archivo</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="btn-primary inline-block">
                Seleccionar Archivo Excel
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="sr-only"
                disabled={uploading}
              />
            </label>
          </div>
          
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {file && !uploading && !result && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              className="btn-primary"
            >
              Importar Productos
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Subiendo archivo...</span>
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultados de la Importación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Productos Creados</div>
              <div className="text-2xl font-bold text-green-900">{result.productos_creados}</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Variantes Creadas</div>
              <div className="text-2xl font-bold text-blue-900">{result.variantes_creadas}</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm font-medium">Errores</div>
              <div className="text-2xl font-bold text-red-900">{result.total_errores}</div>
            </div>
          </div>

          {result.errores && result.errores.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-red-900 mb-3">Detalle de Errores</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-red-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-red-900 uppercase">Fila</th>
                      <th className="text-left text-xs font-medium text-red-900 uppercase">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errores.map((error, index) => (
                      <tr key={index}>
                        <td className="py-2 text-sm text-red-900">{error.fila}</td>
                        <td className="py-2 text-sm text-red-800">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="btn-secondary"
            >
              Importar Otro Archivo
            </button>
            <button
              onClick={() => navigate('/productos')}
              className="btn-primary"
            >
              Ver Productos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
