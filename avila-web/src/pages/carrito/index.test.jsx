import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CarritoProvider } from '../../context/CarritoContext'
import Carrito from './index'

function Wrapper({ children }) {
  return (
    <CarritoProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </CarritoProvider>
  )
}

describe('Carrito', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra mensaje vacío cuando no hay items', () => {
    render(
      <Wrapper>
        <Carrito />
      </Wrapper>
    )
    expect(screen.getByText(/carrito está vacío/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver productos/i })).toBeInTheDocument()
  })
})
