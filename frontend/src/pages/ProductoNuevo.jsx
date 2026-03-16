import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import productosService from '../services/productosService';

function filtrarPorTexto(lista, texto, campoNombre = 'nombre') {
  if (!texto || !texto.trim()) return lista;
  const t = texto.trim().toLowerCase();
  return lista.filter(item => (item[campoNombre] || '').toLowerCase().includes(t));
}

export default function ProductoNuevo() {
  const navigate = useNavigate();
  const location = useLocation();
  const codigoInicial = (location.state?.codigoInicial ?? '').trim();
  const returnTo = location.state?.returnTo;
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [marcaSearch, setMarcaSearch] = useState('');
  const [categoriaSearch, setCategoriaSearch] = useState('');
  const [marcaDropdownOpen, setMarcaDropdownOpen] = useState(false);
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [creandoMarca, setCreandoMarca] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const marcaRef = useRef(null);
  const categoriaRef = useRef(null);
  const isSelectingRef = useRef(false);
  const blurTimeoutRef = useRef(null);

  const MARGEN_DEFAULT = { mostrador: 75, web: 60, tarjeta: 84 };

  const calcPrecio = (costo, pct) => {
    const c = parseFloat(costo);
    if (isNaN(c) || c < 0) return '';
    const p = parseFloat(pct);
    if (isNaN(p) || p < 0) return '';
    return (c * (1 + p / 100)).toFixed(2);
  };

  const calcPct = (costo, precio) => {
    const c = parseFloat(costo);
    const pr = parseFloat(precio);
    if (isNaN(c) || c <= 0 || isNaN(pr) || pr < 0) return '';
    return Math.round((pr / c - 1) * 100);
  };

  const [formData, setFormData] = useState({
    nombre: '',
    // descripcion se mantiene en el payload pero no se edita en el formulario
    descripcion: '',
    marca: '',
    categoria: '',
    variantes: [
      {
        nombre_variante: '',
        codigo: '',
        costo: '',
        precio_mostrador: '',
        precio_web: '',
        precio_tarjeta: '',
        pct_mostrador: MARGEN_DEFAULT.mostrador,
        pct_web: MARGEN_DEFAULT.web,
        pct_tarjeta: MARGEN_DEFAULT.tarjeta,
        stock_inicial: '',
        activo: true
      }
    ]
  });

  const marcasFiltradas = filtrarPorTexto(marcas, marcaSearch);
  const categoriasFiltradas = filtrarPorTexto(categorias, categoriaSearch);
  const existeMarcaIgual = marcas.some(
    (m) => (m.nombre || '').toLowerCase() === marcaSearch.trim().toLowerCase()
  );
  const existeCategoriaIgual = categorias.some(
    (c) => (c.nombre || '').toLowerCase() === categoriaSearch.trim().toLowerCase()
  );
  const marcaSeleccionada = marcas.find(m => String(m.id) === String(formData.marca));
  const categoriaSeleccionada = categorias.find(c => String(c.id) === String(formData.categoria));

  useEffect(() => {
    loadOpciones();
  }, []);

  // Prellenar código si venimos desde Compras (busqué y no existía)
  useEffect(() => {
    if (!codigoInicial) return;
    setFormData(prev => ({
      ...prev,
      variantes: prev.variantes.map((v, i) => i === 0 ? { ...v, codigo: codigoInicial } : v)
    }));
  }, [codigoInicial]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (marcaRef.current && !marcaRef.current.contains(e.target)) setMarcaDropdownOpen(false);
      if (categoriaRef.current && !categoriaRef.current.contains(e.target)) setCategoriaDropdownOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const loadOpciones = async () => {
    try {
      setLoading(true);
      const [dataMarcas, dataCategorias] = await Promise.all([
        productosService.getMarcas(),
        productosService.getCategorias()
      ]);
      setMarcas(dataMarcas.results || dataMarcas);
      setCategorias(dataCategorias.results || dataCategorias);
    } catch (error) {
      console.error('Error al cargar marcas/categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearMarca = async () => {
    const nombre = marcaSearch.trim();
    if (!nombre) return;
    setCreandoMarca(true);
    try {
      const nueva = await productosService.createMarca({ nombre, activo: true });
      setMarcas(prev => [...prev, nueva]);
      setFormData(prev => ({ ...prev, marca: nueva.id }));
      setMarcaSearch(nueva.nombre);
      setMarcaDropdownOpen(false);
      if (errors.marca) setErrors(prev => ({ ...prev, marca: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, marca: err.response?.data?.nombre?.[0] || 'Error al crear la marca' }));
    } finally {
      setCreandoMarca(false);
    }
  };

  const crearCategoria = async () => {
    const nombre = categoriaSearch.trim();
    if (!nombre) return;
    setCreandoCategoria(true);
    try {
      const nueva = await productosService.createCategoria({ nombre, activo: true });
      setCategorias(prev => [...prev, nueva]);
      setFormData(prev => ({ ...prev, categoria: nueva.id }));
      setCategoriaSearch(nueva.nombre);
      setCategoriaDropdownOpen(false);
      if (errors.categoria) setErrors(prev => ({ ...prev, categoria: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, categoria: err.response?.data?.nombre?.[0] || 'Error al crear la categoría' }));
    } finally {
      setCreandoCategoria(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleVarianteChange = (index, field, value) => {
    setFormData(prev => {
      const variantes = [...prev.variantes];
      const v = { ...variantes[index], [field]: value };
      const costo = parseFloat(v.costo);
      const num = (x) => (x === '' || x === null || x === undefined ? NaN : parseFloat(x));

      if (field === 'costo') {
        const c = num(value);
        if (!isNaN(c) && c >= 0) {
          v.precio_mostrador = calcPrecio(value, v.pct_mostrador ?? MARGEN_DEFAULT.mostrador);
          v.precio_web = calcPrecio(value, v.pct_web ?? MARGEN_DEFAULT.web);
          v.precio_tarjeta = calcPrecio(value, v.pct_tarjeta ?? MARGEN_DEFAULT.tarjeta);
        }
      } else if (field === 'pct_mostrador') {
        v.precio_mostrador = calcPrecio(v.costo, value);
      } else if (field === 'pct_web') {
        v.precio_web = calcPrecio(v.costo, value);
      } else if (field === 'pct_tarjeta') {
        v.precio_tarjeta = calcPrecio(v.costo, value);
      } else if (field === 'precio_mostrador' && costo > 0) {
        v.pct_mostrador = calcPct(v.costo, value) !== '' ? calcPct(v.costo, value) : v.pct_mostrador;
      } else if (field === 'precio_web' && costo > 0) {
        v.pct_web = calcPct(v.costo, value) !== '' ? calcPct(v.costo, value) : v.pct_web;
      } else if (field === 'precio_tarjeta' && costo > 0) {
        v.pct_tarjeta = calcPct(v.costo, value) !== '' ? calcPct(v.costo, value) : v.pct_tarjeta;
      }
      variantes[index] = v;
      return { ...prev, variantes };
    });
    if (errors[`variante_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`variante_${index}_${field}`]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre del producto es obligatorio';
    if (!formData.marca) newErrors.marca = 'Seleccioná una marca';
    if (!formData.categoria) newErrors.categoria = 'Seleccioná una categoría';
    formData.variantes.forEach((v, i) => {
      if (!v.nombre_variante?.trim()) newErrors[`variante_${i}_nombre_variante`] = 'Nombre de variante obligatorio';
      if (!v.codigo?.trim()) newErrors[`variante_${i}_codigo`] = 'Código obligatorio';
      if (v.costo === '' || parseFloat(v.costo) < 0) newErrors[`variante_${i}_costo`] = 'Costo válido';
      if (v.precio_mostrador === '' || parseFloat(v.precio_mostrador) < 0) newErrors[`variante_${i}_precio_mostrador`] = 'Precio mostrador válido';
      if (v.precio_web === '' || parseFloat(v.precio_web) < 0) newErrors[`variante_${i}_precio_web`] = 'Precio web válido';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        marca: parseInt(formData.marca, 10),
        categoria: parseInt(formData.categoria, 10),
        variantes: formData.variantes.map(v => ({
          nombre_variante: (v.nombre_variante ?? '').trim(),
          codigo: (v.codigo ?? '').trim(),
          costo: parseFloat(String(v.costo).replace(',', '.')) || 0,
          precio_mostrador: parseFloat(String(v.precio_mostrador).replace(',', '.')) || 0,
          precio_web: parseFloat(String(v.precio_web).replace(',', '.')) || 0,
          precio_tarjeta: (v.precio_tarjeta !== '' && v.precio_tarjeta != null) ? parseFloat(String(v.precio_tarjeta).replace(',', '.')) : 0,
          stock_inicial: v.stock_inicial !== '' && v.stock_inicial != null ? parseInt(v.stock_inicial, 10) || 0 : 0,
          activo: v.activo !== false
        }))
      };
      const creado = await productosService.createProducto(payload);
      const primerVariante = creado.variantes?.[0];
      if (returnTo && primerVariante?.id) {
        navigate(returnTo, { state: { varianteRecienCreada: primerVariante } });
      } else if (primerVariante?.id) {
        navigate(`/productos/${primerVariante.id}`);
      } else {
        navigate('/productos');
      }
    } catch (error) {
      const data = error.response?.data || {};
      let msg = data.detail;
      if (!msg && data.variantes?.[0]) {
        const v = data.variantes[0];
        msg = (typeof v === 'string' ? v : (v.codigo?.[0] || v.nombre_variante?.[0] || v.costo?.[0] || v.precio_mostrador?.[0] || v.precio_web?.[0] || JSON.stringify(v)));
      }
      if (!msg && data.codigo) msg = Array.isArray(data.codigo) ? data.codigo[0] : data.codigo;
      if (!msg && data.marca) msg = Array.isArray(data.marca) ? data.marca[0] : data.marca;
      if (!msg && data.categoria) msg = Array.isArray(data.categoria) ? data.categoria[0] : data.categoria;
      if (!msg && data.nombre) msg = Array.isArray(data.nombre) ? data.nombre[0] : data.nombre;
      if (!msg && typeof data === 'object' && Object.keys(data).length) msg = JSON.stringify(data);
      setErrors({ submit: typeof msg === 'string' ? msg : 'Error al crear el producto' });
    } finally {
      setSaving(false);
    }
  };

  const addVariante = () => {
    setFormData(prev => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        {
          nombre_variante: '',
          codigo: '',
          costo: '',
          precio_mostrador: '',
          precio_web: '',
          precio_tarjeta: '',
          pct_mostrador: MARGEN_DEFAULT.mostrador,
          pct_web: MARGEN_DEFAULT.web,
          pct_tarjeta: MARGEN_DEFAULT.tarjeta,
          activo: true
        }
      ]
    }));
  };

  const removeVariante = (index) => {
    if (formData.variantes.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index)
    }));
  };

  const imprimirCodigoBarras = (codigo) => {
    const code = String(codigo || '').trim();
    if (!code) {
      alert('Escribí el código antes de imprimir.');
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/productos')}
            className="text-gray-400 hover:text-gray-200 mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Productos
          </button>
          <h1 className="text-3xl font-bold text-gray-100">Crear producto</h1>
          <p className="text-gray-400 mt-1">Completá los datos del producto y al menos una variante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {errors.submit && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del producto *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre ?? ''}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: Pistón Honda CG 150"
            />
            {errors.nombre && <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div className="relative" ref={marcaRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">Marca *</label>
            <input
              type="text"
              value={marcaDropdownOpen ? marcaSearch : (marcaSeleccionada?.nombre || marcaSearch)}
              onChange={(e) => {
                setMarcaSearch(e.target.value);
                setMarcaDropdownOpen(true);
              }}
              onFocus={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                setMarcaSearch(marcaSeleccionada?.nombre || marcaSearch);
                setMarcaDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (marcaDropdownOpen && marcaSearch.trim() && !existeMarcaIgual && !creandoMarca) {
                    crearMarca();
                  }
                }
              }}
              onBlur={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = setTimeout(() => {
                  if (isSelectingRef.current) return;
                  const texto = marcaSearch.trim();
                  if (texto) {
                    const exact = marcas.find(
                      (m) => (m.nombre || '').toLowerCase() === texto.toLowerCase()
                    );
                    if (exact) {
                      setFormData((prev) => ({ ...prev, marca: exact.id }));
                      setMarcaSearch(exact.nombre);
                      if (errors.marca) setErrors((prev) => ({ ...prev, marca: null }));
                    }
                  }
                  setMarcaDropdownOpen(false);
                }, 120);
              }}
              className="input-field"
              placeholder="Escribí para buscar o crear marca"
              autoComplete="off"
            />
            {(marcaDropdownOpen || !!marcaSearch.trim()) && (
              <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                {marcasFiltradas.map(m => (
                  <li
                    key={m.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      isSelectingRef.current = true;
                      setTimeout(() => { isSelectingRef.current = false; }, 0);
                      setFormData(prev => ({ ...prev, marca: m.id }));
                      setMarcaSearch(m.nombre);
                      setMarcaDropdownOpen(false);
                      if (errors.marca) setErrors(prev => ({ ...prev, marca: null }));
                    }}
                  >
                    {m.nombre}
                  </li>
                ))}
                {marcaSearch.trim() && !existeMarcaIgual && (
                  <li
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-blue-400 border-t border-gray-600"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (creandoMarca) return;
                      isSelectingRef.current = true;
                      setTimeout(() => { isSelectingRef.current = false; }, 0);
                      crearMarca();
                    }}
                  >
                    {creandoMarca ? 'Creando...' : `+ Crear marca "${marcaSearch.trim()}"`}
                  </li>
                )}
                {marcasFiltradas.length === 0 && !marcaSearch.trim() && (
                  <li className="px-3 py-2 text-gray-500 text-sm">Escribí para buscar o crear una marca</li>
                )}
              </ul>
            )}
            {errors.marca && <p className="text-red-400 text-sm mt-1">{errors.marca}</p>}
          </div>

          <div className="relative" ref={categoriaRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoría *</label>
            <input
              type="text"
              value={categoriaDropdownOpen ? categoriaSearch : (categoriaSeleccionada?.nombre || categoriaSearch)}
              onChange={(e) => {
                setCategoriaSearch(e.target.value);
                setCategoriaDropdownOpen(true);
              }}
              onFocus={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                setCategoriaSearch(categoriaSeleccionada?.nombre || categoriaSearch);
                setCategoriaDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (categoriaDropdownOpen && categoriaSearch.trim() && !existeCategoriaIgual && !creandoCategoria) {
                    crearCategoria();
                  }
                }
              }}
              onBlur={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = setTimeout(() => {
                  if (isSelectingRef.current) return;
                  const texto = categoriaSearch.trim();
                  if (texto) {
                    const exact = categorias.find(
                      (c) => (c.nombre || '').toLowerCase() === texto.toLowerCase()
                    );
                    if (exact) {
                      setFormData((prev) => ({ ...prev, categoria: exact.id }));
                      setCategoriaSearch(exact.nombre);
                      if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: null }));
                    }
                  }
                  setCategoriaDropdownOpen(false);
                }, 120);
              }}
              className="input-field"
              placeholder="Escribí para buscar o crear categoría"
              autoComplete="off"
            />
            {(categoriaDropdownOpen || !!categoriaSearch.trim()) && (
              <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                {categoriasFiltradas.map(c => (
                  <li
                    key={c.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-200"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      isSelectingRef.current = true;
                      setTimeout(() => { isSelectingRef.current = false; }, 0);
                      setFormData(prev => ({ ...prev, categoria: c.id }));
                      setCategoriaSearch(c.nombre);
                      setCategoriaDropdownOpen(false);
                      if (errors.categoria) setErrors(prev => ({ ...prev, categoria: null }));
                    }}
                  >
                    {c.nombre}
                  </li>
                ))}
                {categoriaSearch.trim() && !existeCategoriaIgual && (
                  <li
                    className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-blue-400 border-t border-gray-600"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (creandoCategoria) return;
                      isSelectingRef.current = true;
                      setTimeout(() => { isSelectingRef.current = false; }, 0);
                      crearCategoria();
                    }}
                  >
                    {creandoCategoria ? 'Creando...' : `+ Crear categoría "${categoriaSearch.trim()}"`}
                  </li>
                )}
                {categoriasFiltradas.length === 0 && !categoriaSearch.trim() && (
                  <li className="px-3 py-2 text-gray-500 text-sm">Escribí para buscar o crear una categoría</li>
                )}
              </ul>
            )}
            {errors.categoria && <p className="text-red-400 text-sm mt-1">{errors.categoria}</p>}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-200">Variante(s)</h2>
            <button
              type="button"
              onClick={addVariante}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Agregar otra variante
            </button>
          </div>

          {formData.variantes.map((v, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
              {formData.variantes.length > 1 && (
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => removeVariante(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Quitar variante
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {/* Código primero, con botón de imprimir */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Código *</label>
                    <input
                      type="text"
                      value={v.codigo ?? ''}
                      onChange={(e) => handleVarianteChange(index, 'codigo', e.target.value)}
                      className="input-field"
                      placeholder="Código único (primero cargar esto)"
                    />
                    {errors[`variante_${index}_codigo`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`variante_${index}_codigo`]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => imprimirCodigoBarras(v.codigo)}
                    className="shrink-0 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 flex items-center gap-2"
                    title="Imprimir código de barras (impresora térmica)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir código
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre variante *</label>
                    <input
                      type="text"
                      value={v.nombre_variante ?? ''}
                      onChange={(e) => handleVarianteChange(index, 'nombre_variante', e.target.value)}
                      className="input-field"
                      placeholder="Ej: STD, 0.25, Original"
                    />
                    {errors[`variante_${index}_nombre_variante`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`variante_${index}_nombre_variante`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Costo *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.costo ?? ''}
                      onChange={(e) => handleVarianteChange(index, 'costo', e.target.value)}
                      className="input-field"
                    />
                    {errors[`variante_${index}_costo`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`variante_${index}_costo`]}</p>
                    )}
                  </div>
                </div>

                {/* Precios en filas separadas para que se vea claro */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mostrador *</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.precio_mostrador ?? ''}
                        onChange={(e) => handleVarianteChange(index, 'precio_mostrador', e.target.value)}
                        className="input-field flex-1 min-w-0"
                      />
                      <span className="flex items-center gap-1 shrink-0 w-14">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={v.pct_mostrador !== undefined && v.pct_mostrador !== '' ? v.pct_mostrador : MARGEN_DEFAULT.mostrador}
                          onChange={(e) => handleVarianteChange(index, 'pct_mostrador', e.target.value)}
                          className="input-field text-center w-10"
                          title="% margen"
                        />
                        <span className="text-gray-400 text-sm">%</span>
                      </span>
                    </div>
                    {errors[`variante_${index}_precio_mostrador`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`variante_${index}_precio_mostrador`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Web *</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.precio_web ?? ''}
                        onChange={(e) => handleVarianteChange(index, 'precio_web', e.target.value)}
                        className="input-field flex-1 min-w-0"
                      />
                      <span className="flex items-center gap-1 shrink-0 w-14">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={v.pct_web !== undefined && v.pct_web !== '' ? v.pct_web : MARGEN_DEFAULT.web}
                          onChange={(e) => handleVarianteChange(index, 'pct_web', e.target.value)}
                          className="input-field text-center w-10"
                          title="% margen"
                        />
                        <span className="text-gray-400 text-sm">%</span>
                      </span>
                    </div>
                    {errors[`variante_${index}_precio_web`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`variante_${index}_precio_web`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tarjeta</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.precio_tarjeta ?? ''}
                        onChange={(e) => handleVarianteChange(index, 'precio_tarjeta', e.target.value)}
                        className="input-field flex-1 min-w-0"
                        placeholder="Opc."
                      />
                      <span className="flex items-center gap-1 shrink-0 w-14">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={v.pct_tarjeta !== undefined && v.pct_tarjeta !== '' ? v.pct_tarjeta : MARGEN_DEFAULT.tarjeta}
                          onChange={(e) => handleVarianteChange(index, 'pct_tarjeta', e.target.value)}
                          className="input-field text-center w-10"
                          title="% margen"
                        />
                        <span className="text-gray-400 text-sm">%</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Stock inicial</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={v.stock_inicial ?? ''}
                      onChange={(e) => handleVarianteChange(index, 'stock_inicial', e.target.value)}
                      className="input-field"
                      placeholder="Opc."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/productos')}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
