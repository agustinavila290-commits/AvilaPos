import { useState, useEffect } from 'react'
import { getProductos, getCategorias, getMarcas } from '../../services/tiendaService'
import { ProductCard } from '../../components/tienda'

export default function Catalogo() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState({ page: 1, search: '', categoria: '', marca: '' })
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [data, cats, mks] = await Promise.all([
          getProductos({ ...filtros, page_size: 24 }),
          getCategorias(),
          getMarcas(),
        ])
        setProductos(data.results || [])
        setTotalPages(data.total_pages || 1)
        setCategorias(cats || [])
        setMarcas(mks || [])
      } catch (err) {
        setError(err.message || 'Error al cargar productos')
        setProductos([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filtros])

  return (
    <section className="content">
      <div className="container">
        <h1>Productos</h1>

        <div className="catalogo-filtros" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar..."
            value={filtros.search}
            onChange={(e) => setFiltros({ ...filtros, search: e.target.value, page: 1 })}
            style={{ maxWidth: '200px' }}
          />
          <select
            className="input-field"
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value, page: 1 })}
            style={{ maxWidth: '180px' }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            className="input-field"
            value={filtros.marca}
            onChange={(e) => setFiltros({ ...filtros, marca: e.target.value, page: 1 })}
            style={{ maxWidth: '180px' }}
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p>No hay productos disponibles.</p>
        ) : (
          <>
            <div className="products-grid">
              {productos.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-outline"
                  disabled={filtros.page <= 1}
                  onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
                >
                  Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                  Página {filtros.page} de {totalPages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={filtros.page >= totalPages}
                  onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
