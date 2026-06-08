import { Link } from 'react-router-dom'
import { WA_NUMBER, SITIO } from '../../config'

export default function Footer() {
  return (
    <footer className="bg-brand-blue-dark text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-bold text-lg mb-1">{SITIO.nombre}</p>
          <p className="text-blue-200 text-sm">{SITIO.direccion}</p>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-green-300 hover:text-green-200 transition-colors"
          >
            Consultar por WhatsApp
          </a>
        </div>

        <div>
          <p className="font-semibold mb-2">Navegación</p>
          <ul className="space-y-1 text-sm text-blue-200">
            <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link to="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
            <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto y ubicación</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-2">Medios de pago</p>
          <ul className="space-y-1 text-sm text-blue-200">
            <li>Mercado Pago</li>
            <li>Transferencia bancaria</li>
            <li>Efectivo al retirar</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-blue-800 text-center text-xs text-blue-300 py-4">
        © {new Date().getFullYear()} Avila Moto Repuestos. Todos los derechos reservados.
      </div>
    </footer>
  )
}
