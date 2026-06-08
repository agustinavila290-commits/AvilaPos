import { Navigate } from 'react-router-dom'

// La página de ubicación fue unificada con contacto
export default function UbicacionPage() {
  return <Navigate to="/contacto" replace />
}
