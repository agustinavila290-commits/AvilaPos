import { useState } from 'react'
import SEO from '../../components/SEO'
import { WA_NUMBER, SITIO } from '../../config'

const HORARIOS = [
  { dia: 'Lunes a Viernes', horario: '8:00 — 12:00 / 15:00 — 20:00' },
  { dia: 'Sábados',         horario: '8:00 — 13:00' },
  { dia: 'Domingos',        horario: 'Cerrado' },
]

const MOTIVOS = [
  'Consulta sobre un producto',
  'Consulta sobre un pedido',
  'Disponibilidad de stock',
  'Envíos y costos',
  'Otro',
]

const WA_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', motivo: MOTIVOS[0], mensaje: '' })
  const [errores, setErrores] = useState({})

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errores[e.target.name]) setErrores(e => ({ ...e, [e.target.name]: null }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!form.mensaje.trim()) errs.mensaje = 'El mensaje es obligatorio'
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const texto = `Hola! Soy ${form.nombre}.\nMotivo: ${form.motivo}\n\n${form.mensaje}`
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const mapsUrl   = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITIO.direccion + ', Argentina')}`
  const mapsEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(SITIO.direccion + ', Argentina')}&t=&z=16&ie=UTF8&iwloc=&output=embed`

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEO
        title="Contacto y ubicación"
        description={`Contactate con ${SITIO.nombre}. Estamos en ${SITIO.direccion}. Respondemos por WhatsApp.`}
      />

      <h1 className="text-2xl font-bold text-brand-text mb-1">Contacto y cómo llegar</h1>
      <p className="text-brand-muted mb-8">
        Estamos en <strong className="text-brand-text">{SITIO.direccion}</strong>, {SITIO.localidad}.
        Respondemos por WhatsApp en el horario de atención.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: mapa + info */}
        <div className="flex flex-col gap-4">
          {/* Mapa */}
          <div className="rounded-xl overflow-hidden border border-brand-border shadow-sm aspect-video">
            <iframe
              title="Ubicación del local"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={mapsEmbed}
            />
          </div>

          {/* Botones de acción rápida */}
          <div className="flex gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-2.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cómo llegar
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-brand-green hover:bg-green-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {WA_SVG} WhatsApp
            </a>
          </div>

          {/* Info del local */}
          <div className="card p-5">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="text-xs text-brand-muted mb-0.5">Dirección</p>
                  <p className="text-sm font-medium text-brand-text">{SITIO.direccion}</p>
                  <p className="text-sm text-brand-muted">{SITIO.localidad}, {SITIO.provincia}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl mt-0.5">💬</span>
                <div>
                  <p className="text-xs text-brand-muted mb-0.5">WhatsApp</p>
                  <a
                    href={`https://wa.me/${WA_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-blue hover:underline"
                  >
                    +{WA_NUMBER}
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl mt-0.5">🕐</span>
                <div>
                  <p className="text-xs text-brand-muted mb-2">Horarios de atención</p>
                  <div className="flex flex-col gap-1">
                    {HORARIOS.map(h => (
                      <div key={h.dia} className="flex justify-between text-sm gap-4">
                        <span className="text-brand-muted">{h.dia}</span>
                        <span className={`font-medium ${h.horario === 'Cerrado' ? 'text-brand-muted' : 'text-brand-text'}`}>
                          {h.horario}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div className="card p-6">
          <h2 className="font-semibold text-brand-text text-lg mb-1">Envianos un mensaje</h2>
          <p className="text-sm text-brand-muted mb-5">Te respondemos por WhatsApp al instante.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text">
                Tu nombre <span className="text-brand-red">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez"
                className={`input ${errores.nombre ? 'border-brand-red' : ''}`}
              />
              {errores.nombre && <p className="text-xs text-brand-red">{errores.nombre}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text">Motivo</label>
              <select name="motivo" value={form.motivo} onChange={handleChange} className="input">
                {MOTIVOS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-text">
                Mensaje <span className="text-brand-red">*</span>
              </label>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                rows={5}
                placeholder="Escribí tu consulta acá..."
                className={`input resize-none ${errores.mensaje ? 'border-brand-red' : ''}`}
              />
              {errores.mensaje && <p className="text-xs text-brand-red">{errores.mensaje}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary py-3 flex items-center justify-center gap-2"
            >
              {WA_SVG} Enviar por WhatsApp
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-brand-border">
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-green hover:underline"
            >
              {WA_SVG} O escribinos directamente a WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
