import { Link } from 'react-router-dom'

export default function Privacidad() {
  return (
    <section className="content">
      <div className="container">
        <h1>Política de Privacidad</h1>
        <p><em>Última actualización: febrero 2026</em></p>

        <h2>Responsable</h2>
        <p>
          Avila Motor Repuesto. Para consultas sobre datos personales podés contactarnos desde la página de <Link to="/contacto">Contacto</Link>.
        </p>

        <h2>Datos que recopilamos</h2>
        <ul>
          <li>Datos de cuenta (usuario, contraseña cifrada) cuando utilizás nuestros sistemas de gestión.</li>
          <li>Datos de clientes (nombre, documento, teléfono, dirección) que ingresás en el sistema.</li>
          <li>Datos de ventas, productos e inventario asociados al uso del servicio.</li>
          <li>Datos de pagos con tarjeta procesados vía Clover, según la política de Clover y estándares de la industria.</li>
        </ul>

        <h2>Uso de los datos</h2>
        <p>
          Utilizamos los datos para brindar el servicio de punto de venta, inventario, facturación y cobro con tarjeta. No vendemos ni compartimos tus datos con terceros con fines comerciales, salvo cuando sea necesario para prestar el servicio (por ejemplo Clover para pagos, AFIP para facturación cuando corresponda).
        </p>

        <h2>Seguridad</h2>
        <p>
          Los datos se almacenan de forma segura. Las contraseñas se guardan cifradas. Los pagos con tarjeta se procesan mediante Clover, cumpliendo estándares de la industria.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Podés solicitar acceso, rectificación o eliminación de tus datos personales contactándonos a través de la página de <Link to="/contacto">Contacto</Link>.
        </p>

        <h2>Cambios</h2>
        <p>
          Podemos actualizar esta política. Los cambios se publicarán en esta misma página con la fecha de última actualización.
        </p>

        <p>
          <Link to="/contacto">Contacto</Link>
        </p>
      </div>
    </section>
  )
}
