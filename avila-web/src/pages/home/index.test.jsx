import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from './index'

describe('Home', () => {
  it('renderiza sin error', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )
    expect(screen.getByText(/Repuestos y accesorios para motos/)).toBeInTheDocument()
  })

  it('tiene link a productos', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )
    const link = screen.getByRole('link', { name: /Ver productos/i })
    expect(link).toHaveAttribute('href', '/productos')
  })

  it('tiene link a contacto', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )
    const link = screen.getByRole('link', { name: /Contacto/i })
    expect(link).toHaveAttribute('href', '/contacto')
  })
})
