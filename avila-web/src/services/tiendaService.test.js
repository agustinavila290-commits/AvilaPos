import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getProductos, getProducto, getCategorias, getMarcas, crearPedido } from './tiendaService'

describe('tiendaService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('getProductos llama fetch con URL correcta y devuelve datos', async () => {
    const mockData = { results: [], total_pages: 1, count: 0 }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const data = await getProductos({ page: 1 })
    expect(fetch).toHaveBeenCalledWith('/api/tienda/productos/?page=1')
    expect(data).toEqual(mockData)
  })

  it('getProductos con filtros incluye query string', async () => {
    const mockData = { results: [], total_pages: 1 }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    await getProductos({ search: 'piston', categoria: 1, marca: 2 })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=piston')
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('categoria=1')
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('marca=2')
    )
  })

  it('getProductos lanza error cuando fetch no ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false })

    await expect(getProductos()).rejects.toThrow('Error al cargar productos')
  })

  it('getProducto llama fetch con id y devuelve producto', async () => {
    const mockProducto = { id: 1, codigo: 'P001', nombre_completo: 'Producto' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProducto) })

    const data = await getProducto(1)
    expect(fetch).toHaveBeenCalledWith('/api/tienda/productos/1/')
    expect(data).toEqual(mockProducto)
  })

  it('getProducto lanza error cuando 404', async () => {
    fetch.mockResolvedValueOnce({ ok: false })

    await expect(getProducto(999)).rejects.toThrow('Producto no encontrado')
  })

  it('getCategorias devuelve lista', async () => {
    const mockCats = [{ id: 1, nombre: 'Motor' }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCats) })

    const data = await getCategorias()
    expect(fetch).toHaveBeenCalledWith('/api/tienda/categorias/')
    expect(data).toEqual(mockCats)
  })

  it('getMarcas devuelve lista', async () => {
    const mockMarcas = [{ id: 1, nombre: 'Honda' }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMarcas) })

    const data = await getMarcas()
    expect(fetch).toHaveBeenCalledWith('/api/tienda/marcas/')
    expect(data).toEqual(mockMarcas)
  })

  it('crearPedido hace POST con body correcto', async () => {
    const payload = {
      line_items: [{ variante_id: 1, cantidad: 2, precio_unitario: 100 }],
      datos_cliente: { nombre: 'Juan', email: 'j@t.com' },
    }
    const mockResp = { ok: true, venta_numero: 'V-001' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResp) })

    const data = await crearPedido(payload)
    expect(fetch).toHaveBeenCalledWith('/api/tienda/pedidos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(data).toEqual(mockResp)
  })

  it('crearPedido lanza error con mensaje del backend', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Stock insuficiente' }),
    })

    await expect(crearPedido({ line_items: [] })).rejects.toThrow('Stock insuficiente')
  })
})
