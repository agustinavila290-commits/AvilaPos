import { useParams, useSearchParams, Link } from 'react-router-dom'
import { WA_MESSAGES } from '../../config'
import { useAuth } from '../../context/AuthContext'
import SEO from '../../components/SEO'

const WA_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const INSTRUCCIONES = {
  transferencia: {
    titulo: '¡Pedido creado!',
    subtitulo: 'Tu pedido fue registrado. Realizá la transferencia para confirmarlo.',
    colorTitulo: 'text-brand-blue',
    colorFondo: 'bg-blue-50 border-blue-200',
    icono: '🏦',
    pasos: [
      'Realizá la transferencia con los datos bancarios que te enviamos.',
      'Enviá el comprobante por WhatsApp indicando tu número de pedido.',
      'Una vez acreditado el pago, coordinamos la entrega o el retiro.',
    ],
    mostrarWaTransferencia: true,
  },
  efectivo: {
    titulo: '¡Pedido creado!',
    subtitulo: 'Tu pedido fue registrado. Podés abonarlo al retirar en el local.',
    colorTitulo: 'text-brand-green',
    colorFondo: 'bg-green-50 border-green-200',
    icono: '💵',
    pasos: [
      'Acercate a Av. Pte. Castillo 1165 con tu número de pedido.',
      'Abonás en efectivo al momento del retiro.',
      'Ante cualquier duda, consultanos por WhatsApp.',
    ],
  },
  mercadopago: {
    titulo: '¡Pago aprobado!',
    subtitulo: 'Tu pago con Mercado Pago fue procesado correctamente.',
    colorTitulo: 'text-brand-green',
    colorFondo: 'bg-green-50 border-green-200',
    icono: '✅',
    pasos: [
      'Recibirás una notificación de Mercado Pago con el comprobante.',
      'Estamos preparando tu pedido.',
      'Coordinamos la entrega o el retiro en breve.',
    ],
  },
  'mercadopago-pending': {
    titulo: 'Pago pendiente',
    subtitulo: 'Tu pago está pendiente de confirmación por Mercado Pago.',
    colorTitulo: 'text-amber-600',
    colorFondo: 'bg-amber-50 border-amber-200',
    icono: '⏳',
    pasos: [
      'Mercado Pago está verificando tu pago. Puede demorar unos minutos.',
      'Te notificaremos cuando se acredite.',
      'Si tenés dudas, contactanos por WhatsApp.',
    ],
  },
  'mercadopago-error': {
    titulo: 'Pedido registrado',
    subtitulo: 'No pudimos confirmar el pago. Podés intentar nuevamente o consultar por WhatsApp.',
    colorTitulo: 'text-brand-blue',
    colorFondo: 'bg-blue-50 border-blue-200',
    icono: '📋',
    pasos: [
      'Tu pedido fue registrado correctamente.',
      'Podés pagar por transferencia o en efectivo al retirar.',
      'Contactanos por WhatsApp para coordinar.',
    ],
  },
}

export default function ConfirmacionPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const pago = searchParams.get('pago') || 'transferencia'
  const status = searchParams.get('status')
  const errorMp = searchParams.get('error')
  const nombreCliente = decodeURIComponent(searchParams.get('nombre') || user?.nombre || '')

  let clave = pago
  if (pago === 'mercadopago') {
    if (status === 'pending') clave = 'mercadopago-pending'
    else if (status === 'failure' || errorMp === 'mp') clave = 'mercadopago-error'
    else clave = 'mercadopago'
  }

  const info = INSTRUCCIONES[clave] || INSTRUCCIONES.transferencia

  const waUrl = info.mostrarWaTransferencia && nombreCliente
    ? WA_MESSAGES.pedidoTransferencia(id, nombreCliente)
    : WA_MESSAGES.consultarPedido(id)

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <SEO title={`Pedido #${id} — ${info.titulo}`} />
      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">{info.icono}</div>
        <h1 className={`text-2xl font-bold mb-2 ${info.colorTitulo}`}>{info.titulo}</h1>
        <p className="text-brand-muted mb-1">{info.subtitulo}</p>
        <p className="text-sm text-brand-muted mb-6">
          Pedido <strong className="text-brand-text font-mono">#{id}</strong>
        </p>

        {/* Pasos */}
        <div className={`border rounded-xl p-4 text-left mb-6 ${info.colorFondo}`}>
          <p className="text-sm font-semibold text-brand-text mb-3">Próximos pasos:</p>
          <ol className="space-y-2">
            {info.pasos.map((paso, i) => (
              <li key={i} className="flex gap-3 text-sm text-brand-muted">
                <span className="w-5 h-5 bg-brand-blue text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  {i + 1}
                </span>
                {paso}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          {/* Botón WhatsApp principal */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand-green hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {WA_SVG}
            {info.mostrarWaTransferencia ? 'Enviar comprobante por WhatsApp' : 'Consultar por WhatsApp'}
          </a>

          {/* Ver mi cuenta (si está logueado) */}
          {user && (
            <Link to="/mi-cuenta" className="btn-secondary py-2.5 text-sm">
              Ver mis pedidos
            </Link>
          )}

          <Link to="/catalogo" className="text-sm text-brand-muted hover:text-brand-text transition-colors py-1">
            Ver catálogo →
          </Link>
          <Link to="/" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
