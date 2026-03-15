import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CarritoProvider } from './context/CarritoContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Páginas públicas
import Home from './pages/home/HomePage'
import Catalogo from './pages/catalogo'
import ProductoDetalle from './pages/producto'
import Carrito from './pages/carrito'
import Checkout from './pages/checkout'
import Confirmacion from './pages/confirmacion'
import Contacto from './pages/contacto'
import Privacidad from './pages/privacidad'
import Terminos from './pages/terminos'

// Admin
import AdminLogin from './pages/admin/login'
import AdminDashboard from './pages/admin/dashboard'
import AdminPedidos from './pages/admin/pedidos'
import AdminPedidoDetalle from './pages/admin/pedidos/PedidoDetalle'
import AdminProductos from './pages/admin/productos'

function App() {
  return (
    <CarritoProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Tienda pública */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="productos" element={<Catalogo />} />
              <Route path="productos/:id" element={<ProductoDetalle />} />
              <Route path="carrito" element={<Carrito />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="confirmacion/:id" element={<Confirmacion />} />
              <Route path="contacto" element={<Contacto />} />
              <Route path="privacidad" element={<Privacidad />} />
              <Route path="terminos" element={<Terminos />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="pedidos" element={<AdminPedidos />} />
              <Route path="pedidos/:id" element={<AdminPedidoDetalle />} />
              <Route path="productos" element={<AdminProductos />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </CarritoProvider>
  )
}

export default App
