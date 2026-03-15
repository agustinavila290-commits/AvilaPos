import { Link } from 'react-router-dom'

export default function Terminos() {
  return (
    <section className="content">
      <div className="container">
        <h1>Términos de Uso y Licencia (EULA)</h1>
        <p><em>Última actualización: febrero 2026</em></p>

        <h2>Aceptación</h2>
        <p>
          Al utilizar los servicios o el software de Avila Motor Repuesto, aceptás estos términos de uso y la licencia aquí descrita.
        </p>

        <h2>Licencia</h2>
        <p>
          Se concede una licencia de uso no exclusiva para utilizar el software en tu comercio, de acuerdo con la suscripción o acuerdo contratado.
        </p>

        <h2>Obligaciones del usuario</h2>
        <ul>
          <li>Mantener los datos y credenciales de acceso en forma segura.</li>
          <li>Cumplir con las normativas fiscales (AFIP) y de pagos aplicables.</li>
          <li>Utilizar el sistema conforme a la ley y sin fines ilícitos.</li>
        </ul>

        <h2>Limitación de responsabilidad</h2>
        <p>
          El software se proporciona &quot;tal cual&quot;. No nos hacemos responsables por interrupciones del servicio, pérdida de datos o daños indirectos. Los pagos con tarjeta dependen de los servicios de Clover y están sujetos a sus propios términos y condiciones.
        </p>

        <h2>Propiedad intelectual</h2>
        <p>
          Todo el software y su contenido son propiedad del desarrollador o del titular indicado. No está permitida la copia, modificación ni redistribución sin autorización expresa.
        </p>

        <h2>Terminación</h2>
        <p>
          Nos reservamos el derecho de suspender o dar por terminado el acceso al servicio si se incumplen estos términos.
        </p>

        <h2>Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos. Los cambios serán publicados en esta página con la fecha de última actualización.
        </p>

        <p>
          Para consultas: <Link to="/contacto">Contacto</Link>
        </p>
      </div>
    </section>
  )
}
