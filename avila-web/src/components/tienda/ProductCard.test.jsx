import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { CarritoProvider } from '../../context/CarritoContext'
import ProductCard from './ProductCard'

function Wrapper({ children }) {
  return (
    <CarritoProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </CarritoProvider>
  )
}

const productoConStock = {
  id: 1,
  codigo: 'P001',
  nombre_completo: 'Pistón Honda CG',
  precio_web: 230,
  stock: 10,
  imagen_url: null,
}

const productoSinStock = { ...productoConStock, stock: 0 }

describe('ProductCard', () => {
  it('muestra nombre, código y precio', () => {
    render(
      <Wrapper>
        <ProductCard producto={productoConStock} />
      </Wrapper>
    )
    expect(screen.getByText('Pistón Honda CG')).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.getByText(/230/)).toBeInTheDocument()
  })

  it('link apunta al detalle del producto', () => {
    render(
      <Wrapper>
        <ProductCard producto={productoConStock} />
      </Wrapper>
    )
    const link = screen.getByRole('link', { name: /Pistón Honda CG/ })
    expect(link).toHaveAttribute('href', '/productos/1')
  })

  it('botón "Agregar al carrito" habilitado con stock', () => {
    render(
      <Wrapper>
        <ProductCard producto={productoConStock} />
      </Wrapper>
    )
    const btn = screen.getByRole('button', { name: /Agregar al carrito/i })
    expect(btn).not.toBeDisabled()
  })

  it('botón "Sin stock" deshabilitado sin stock', () => {
    render(
      <Wrapper>
        <ProductCard producto={productoSinStock} />
      </Wrapper>
    )
    const btn = screen.getByRole('button', { name: /Sin stock/i })
    expect(btn).toBeDisabled()
  })

  it('agregar al carrito suma al contexto', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <ProductCard producto={productoConStock} />
      </Wrapper>
    )
    const btn = screen.getByRole('button', { name: /Agregar al carrito/i })
    await user.click(btn)
    expect(localStorage.getItem('avila_carrito')).toContain('"variante_id":1')
  })
})
