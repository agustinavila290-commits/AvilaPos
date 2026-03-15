import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renderiza layout y ruta home por defecto', () => {
    render(<App />)
    expect(screen.getByText(/Bienvenido a Avila/)).toBeInTheDocument()
  })

  it('incluye navegación con Inicio, Productos, Contacto', () => {
    render(<App />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/productos')
    expect(hrefs).toContain('/contacto')
  })
})
