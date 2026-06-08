import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext'

export default function ToastNotification() {
  const { toastMsg } = useCarrito()

  if (!toastMsg) return null

  return (
    <div className="fixed bottom-24 left-4 z-50 bg-brand-text text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-xs">
      <span className="w-5 h-5 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="flex-1 truncate">{toastMsg}</span>
      <Link to="/carrito" className="text-blue-300 hover:text-white whitespace-nowrap text-xs underline flex-shrink-0">
        Ver carrito
      </Link>
    </div>
  )
}
