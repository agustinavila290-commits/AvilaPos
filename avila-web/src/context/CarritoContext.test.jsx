import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarritoProvider, useCarrito } from './CarritoContext'

function TestConsumer() {
  const { items, totalItems, totalMonto, agregar, actualizarCantidad, eliminar, vaciar } = useCarrito()
  const producto = { id: 1, codigo: 'P001', nombre_completo: 'Producto Test', precio_web: 100 }
  return (
    <div>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-monto">{totalMonto}</span>
      <span data-testid="items-count">{items.length}</span>
      <button onClick={() => agregar(producto)}>Agregar</button>
      <button onClick={() => agregar(producto, 3)}>Agregar 3</button>
      <button onClick={() => actualizarCantidad(1, 5)}>Actualizar</button>
      <button onClick={() => eliminar(1)}>Eliminar</button>
      <button onClick={vaciar}>Vaciar</button>
    </div>
  )
}

describe('CarritoContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provee items vacíos al inicio', () => {
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    expect(screen.getByTestId('total-monto')).toHaveTextContent('0')
    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
  })

  it('agrega producto al carrito', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar'))
    expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    expect(screen.getByTestId('total-monto')).toHaveTextContent('100')
    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
  })

  it('agrega cantidad correcta', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar 3'))
    expect(screen.getByTestId('total-items')).toHaveTextContent('3')
    expect(screen.getByTestId('total-monto')).toHaveTextContent('300')
  })

  it('suma al existente al agregar mismo producto', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar'))
    await user.click(screen.getByText('Agregar'))
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
  })

  it('actualiza cantidad', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar'))
    await user.click(screen.getByText('Actualizar'))
    expect(screen.getByTestId('total-items')).toHaveTextContent('5')
    expect(screen.getByTestId('total-monto')).toHaveTextContent('500')
  })

  it('elimina item', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar'))
    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
    await user.click(screen.getByText('Eliminar'))
    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total-monto')).toHaveTextContent('0')
  })

  it('vaciar limpia el carrito', async () => {
    const user = userEvent.setup()
    render(
      <CarritoProvider>
        <TestConsumer />
      </CarritoProvider>
    )
    await user.click(screen.getByText('Agregar'))
    await user.click(screen.getByText('Vaciar'))
    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
  })

  it('useCarrito fuera de Provider lanza error', () => {
    const ConsoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useCarrito debe usarse dentro de CarritoProvider')
    ConsoleSpy.mockRestore()
  })
})
