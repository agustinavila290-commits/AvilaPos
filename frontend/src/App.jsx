import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { initUppercaseInput } from './utils/uppercaseInput'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Clientes from './pages/Clientes'
import ClienteForm from './pages/ClienteForm'
import ClienteDetalle from './pages/ClienteDetalle'
import Productos from './pages/Productos'
import ProductoDetalle from './pages/ProductoDetalle'
import ProductoNuevo from './pages/ProductoNuevo'
import ImportarProductos from './pages/ImportarProductos'
import Inventario from './pages/Inventario'
import StockCritico from './pages/StockCritico'
import AjustarStock from './pages/AjustarStock'
import Movimientos from './pages/Movimientos'
import PuntoVenta from './pages/PuntoVenta'
import Ventas from './pages/Ventas'
import VentaDetalle from './pages/VentaDetalle'
import RegistrarCompra from './pages/RegistrarCompra'
import Compras from './pages/Compras'
import CompraDetalle from './pages/CompraDetalle'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import Devoluciones from './pages/Devoluciones'
import NuevaDevolucion from './pages/NuevaDevolucion'
import Backups from './pages/Backups'
import AuditLogs from './pages/AuditLogs'

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

function App() {
  useEffect(() => initUppercaseInput(), [])
  return (
    <Router future={routerFuture}>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <PuntoVenta />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          
          {/* Productos */}
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Productos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos/importar"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <ImportarProductos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos/nuevo"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <ProductoNuevo />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductoDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Clientes */}
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/nuevo"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClienteForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClienteDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/:id/editar"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClienteForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de Inventario */}
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Layout>
                  <Inventario />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventario/critico"
            element={
              <ProtectedRoute>
                <Layout>
                  <StockCritico />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventario/ajustar/:varianteId/:depositoId"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AjustarStock />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventario/movimientos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Movimientos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de Compras */}
          <Route
            path="/compras"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Compras />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/compras/nueva"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <RegistrarCompra />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/compras/:id"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <CompraDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reportes"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Reportes />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Configuracion />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/backups"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Backups />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/devoluciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <Devoluciones />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/devoluciones/nueva"
            element={
              <ProtectedRoute>
                <Layout>
                  <NuevaDevolucion />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Ventas - POS */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Layout>
                  <PuntoVenta />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ventas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Ventas />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ventas/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <VentaDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
