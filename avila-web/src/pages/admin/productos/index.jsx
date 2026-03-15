import { useState, useEffect, useRef } from 'react'
import { getProductos, uploadProductoImagen, updateVariante } from '../../../services/adminService'

function imagenUrl(imagen) {
  if (!imagen) return null
  if (imagen.startsWith('http')) return imagen
  if (imagen.startsWith('/')) return imagen
  return `/media/${imagen}`
}

export default function AdminProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [precioEdit, setPrecioEdit] = useState('')
  const [uploading, setUploading] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const params = search ? { search } : {}
        const res = await getProductos(params)
        setProductos(Array.isArray(res) ? res : res.results || res || [])
      } catch (e) {
        setError(e.message)
        setProductos([])
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleEditPrecio = (v) => {
    setEditing(v.id)
    setPrecioEdit(String(v.precio_web || ''))
  }

  const handleSavePrecio = async () => {
    if (!editing) return
    try {
      await updateVariante(editing, { precio_web: parseFloat(precioEdit) || 0 })
      setProductos((prev) =>
        prev.map((pb) => ({
          ...pb,
          variantes: (pb.variantes || []).map((v) =>
            v.id === editing ? { ...v, precio_web: parseFloat(precioEdit) } : v
          ),
        }))
      )
      setEditing(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCancelEdit = () => setEditing(null)

  const handleSelectImagen = (productoBaseId) => {
    fileInputRef.current?.setAttribute('data-producto-id', productoBaseId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    const productoBaseId = fileInputRef.current?.getAttribute('data-producto-id')
    if (!file || !productoBaseId) return
    e.target.value = ''
    try {
      setUploading(parseInt(productoBaseId, 10))
      setError('')
      const updated = await uploadProductoImagen(productoBaseId, file)
      setProductos((prev) =>
        prev.map((p) =>
          p.id === parseInt(productoBaseId, 10)
            ? { ...p, imagen: updated?.imagen ?? p.imagen }
            : p
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div>
      <h1>Productos del catálogo</h1>
      <p style={{ color: 'var(--avila-gris)', marginBottom: '1.5rem' }}>
        Productos del POS. Podés subir fotos y editar el precio web para la tienda.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Buscar por nombre, marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-producto-id=""
      />

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : productos.length === 0 ? (
        <p>No hay productos. Cargalos desde el POS.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {productos.map((pb) => (
            <div
              key={pb.id}
              style={{
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      background: 'var(--avila-gris-claro)',
                      borderRadius: '0.375rem',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pb.imagen ? (
                      <img
                        src={imagenUrl(pb.imagen)}
                        alt={pb.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem', opacity: 0.5 }}>🛠️</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '100%' }}
                    onClick={() => handleSelectImagen(pb.id)}
                    disabled={uploading === pb.id}
                  >
                    {uploading === pb.id ? 'Subiendo...' : 'Subir foto'}
                  </button>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: '0 0 0.5rem' }}>{pb.nombre}</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--avila-gris)' }}>
                    {pb.marca_nombre} · {pb.categoria_nombre}
                  </p>
                  <div style={{ marginTop: '1rem' }}>
                    {(pb.variantes || []).map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 0',
                          borderTop: '1px solid #eee',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{v.codigo}</span>
                        <span style={{ flex: 1 }}>{v.nombre_variante}</span>
                        {editing === v.id ? (
                          <>
                            <input
                              type="number"
                              className="input-field"
                              value={precioEdit}
                              onChange={(e) => setPrecioEdit(e.target.value)}
                              style={{ width: 90, textAlign: 'right' }}
                              min="0"
                              step="0.01"
                            />
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleSavePrecio}>
                              Guardar
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleCancelEdit}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontWeight: 600 }}>${parseFloat(v.precio_web || 0).toLocaleString('es-AR')}</span>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleEditPrecio(v)}>
                              Editar precio
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
