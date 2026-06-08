import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/layout/Layout'
import HomePage from './pages/home/HomePage'
import CatalogoPage from './pages/catalogo/CatalogoPage'
import ProductoPage from './pages/producto/ProductoPage'
import CarritoPage from './pages/carrito/CarritoPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import ConfirmacionPage from './pages/confirmacion/ConfirmacionPage'
import ContactoPage from './pages/contacto/ContactoPage'
import UbicacionPage from './pages/ubicacion/UbicacionPage'
import LoginPage from './pages/login/LoginPage'
import RegistroPage from './pages/registro/RegistroPage'
import MiCuentaPage from './pages/mi-cuenta/MiCuentaPage'
import FavoritosPage from './pages/favoritos/FavoritosPage'
import { CarritoProvider } from './context/CarritoContext'
import { FavoritosProvider } from './context/FavoritosContext'
import { AuthProvider } from './context/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <FavoritosProvider>
          <CarritoProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="catalogo" element={<CatalogoPage />} />
                <Route path="producto/:id" element={<ProductoPage />} />
                <Route path="carrito" element={<CarritoPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="confirmacion/:id" element={<ConfirmacionPage />} />
                <Route path="contacto" element={<ContactoPage />} />
                <Route path="ubicacion" element={<UbicacionPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="registro" element={<RegistroPage />} />
                <Route path="mi-cuenta" element={<MiCuentaPage />} />
                <Route path="favoritos" element={<FavoritosPage />} />
              </Route>
            </Routes>
          </CarritoProvider>
          </FavoritosProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
