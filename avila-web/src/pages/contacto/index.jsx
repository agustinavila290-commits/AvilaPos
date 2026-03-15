import { CONTACTO } from '../../data/contacto'

export default function Contacto() {
  return (
    <section className="content">
      <div className="container">
        <h1>Contacto</h1>
        <p>
          Para consultas, soporte técnico o información sobre nuestros productos y servicios, podés comunicarte con nosotros:
        </p>
        <ul>
          <li><strong>Web:</strong> {CONTACTO.web.replace(/^https?:\/\//, '')}</li>
          <li><strong>Email:</strong> {CONTACTO.email}</li>
          <li><strong>Horarios de atención:</strong> {CONTACTO.horarios}</li>
          {CONTACTO.telefono ? (
            <li><strong>Teléfono:</strong> {CONTACTO.telefono}</li>
          ) : null}
        </ul>
        <p>
          Te responderemos a la brevedad.
        </p>
      </div>
    </section>
  )
}
