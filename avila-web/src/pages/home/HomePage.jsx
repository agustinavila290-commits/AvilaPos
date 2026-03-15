import { Link } from 'react-router-dom'

const categorias = [
  { slug: 'motor', label: 'Motor', icon: '⚙️' },
  { slug: 'frenos', label: 'Frenos', icon: '🛑' },
  { slug: 'transmision', label: 'Transmisión', icon: '⛓️' },
  { slug: 'electrico', label: 'Eléctrico', icon: '💡' },
  { slug: 'filtros', label: 'Filtros y aceites', icon: '🛢️' },
  { slug: 'accesorios', label: 'Accesorios', icon: '🔧' },
]

const destacados = [
  {
    nombre: 'Kit de servicio completo',
    categoria: 'Filtros y aceites',
    precio: '$ 19.900',
    imagen:
      'https://images.unsplash.com/photo-1617487888406-cc57c3201275?auto=format&fit=crop&w=600&q=80',
  },
  {
    nombre: 'Juego de pastillas de freno',
    categoria: 'Frenos',
    precio: '$ 8.500',
    imagen:
      'https://images.unsplash.com/photo-1514481538271-cf9f99627ab3?auto=format&fit=crop&w=600&q=80',
  },
  {
    nombre: 'Cadena y corona reforzadas',
    categoria: 'Transmisión',
    precio: '$ 25.900',
    imagen:
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=600&q=80',
  },
  {
    nombre: 'Kit de luces LED',
    categoria: 'Eléctrico',
    precio: '$ 15.700',
    imagen:
      'https://images.unsplash.com/photo-1530043764816-4fffea3bc4dc?auto=format&fit=crop&w=600&q=80',
  },
]

const seccionesProducto = [
  {
    id: 'repuestos-destacados',
    titulo: 'Repuestos destacados',
    subtitulo: 'Los repuestos que más salen en el mostrador',
    imagen:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'iluminacion',
    titulo: 'Ópticas y luces',
    subtitulo: 'Que te vean bien en la ruta y la ciudad',
    imagen:
      'https://images.unsplash.com/photo-1517940310602-75ae46d48865?auto=format&fit=crop&w=900&q=80',
  },
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80'

export default function HomePage() {
  return (
    <>
      {/* HERO PRINCIPAL */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <img src={HERO_IMAGE} alt="Moto en showroom" loading="lazy" />
          <div className="home-hero-bg-overlay" />
        </div>
        <div className="container home-hero-inner">
          <div className="home-hero-content">
            <p className="home-hero-kicker">Moto repuestos y accesorios</p>
            <h1 className="home-hero-title">
              Todo para tu moto
              <span className="home-hero-title-highlight"> en un solo lugar</span>
            </h1>
            <p className="home-hero-text">
              Repuestos y accesorios de primeras marcas. Asesoramiento experto y stock pensado para que tu moto
              esté siempre lista.
            </p>
            <div className="home-hero-actions">
              <Link to="/catalogo" className="btn btn-primary">
                Ver catálogo completo
              </Link>
              <Link to="/contacto" className="btn btn-outline">
                Hablar con un asesor
              </Link>
            </div>
            <div className="home-hero-badges">
              <span>✔ Envíos a todo el país</span>
              <span>✔ Retiro en sucursal</span>
              <span>✔ Planes de pago</span>
            </div>
          </div>
          <div className="home-hero-banner">
            <div className="home-hero-banner-tag">Servicio</div>
            <p className="home-hero-banner-kicker">Plan Avila Taller</p>
            <p className="home-hero-banner-title">Tus repuestos, siempre a tiempo</p>
            <p className="home-hero-banner-text">
              Armamos el pedido completo de repuestos para tu trabajo en el taller o mantenimiento de tu moto.
            </p>
            <span className="home-hero-banner-link">Consultar por WhatsApp →</span>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS / ICONOS */}
      <section className="home-section home-categories">
        <div className="container">
          <div className="home-section-header">
            <h2>Categorías principales</h2>
            <p>Encontrá rápido lo que necesitás para tu moto.</p>
          </div>
          <div className="home-categories-grid">
            {categorias.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalogo?categoria=${cat.slug}`}
                className="home-category-card"
              >
                <div className="home-category-icon" aria-hidden="true">
                  {cat.icon}
                </div>
                <span className="home-category-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CARRUSEL SIMPLE DE PROMOS (scroll horizontal) */}
      <section className="home-section home-promos">
        <div className="container">
          <div className="home-section-header">
            <h2>Aprovechá nuestras promociones</h2>
          </div>
          <div className="home-promos-strip" aria-label="Promociones destacadas">
            {destacados.map((item, idx) => (
              <article key={idx} className="home-promo-card">
                <div className="home-promo-image">
                  <img src={item.imagen} alt={item.nombre} loading="lazy" />
                </div>
                <div className="home-promo-body">
                  <p className="home-promo-category">{item.categoria}</p>
                  <h3 className="home-promo-name">{item.nombre}</h3>
                  <p className="home-promo-price">{item.precio}</p>
                  <button type="button" className="btn btn-primary home-promo-btn">
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIONES DE PRODUCTO + BANNERS */}
      {seccionesProducto.map((sec) => (
        <section key={sec.id} className="home-section home-products">
          <div className="container">
            <div className="home-section-header home-section-header-row">
              <div>
                <h2>{sec.titulo}</h2>
                <p>{sec.subtitulo}</p>
              </div>
              <Link to={`/catalogo?seccion=${sec.id}`} className="home-section-link">
                Ver todo →
              </Link>
            </div>

            <div className="home-products-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <article key={idx} className="home-product-card">
                  <div className="home-product-image">
                    <img src={sec.imagen} alt={sec.titulo} loading="lazy" />
                  </div>
                  <div className="home-product-body">
                    <p className="home-product-category">Ejemplo</p>
                    <h3 className="home-product-name">Producto de muestra Avila #{idx + 1}</h3>
                    <p className="home-product-price">$ 00.000</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* BANNER INTERMEDIO */}
      <section className="home-banner-wide">
        <div className="container home-banner-wide-inner">
          <div>
            <p className="home-banner-wide-kicker">Servicio Avila</p>
            <h2>El plan ideal para vos y tu moto</h2>
            <p>
              Mantenimiento, repuestos originales y asesoramiento personalizado para que disfrutes cada kilómetro
              con total tranquilidad.
            </p>
          </div>
          <Link to="/contacto" className="btn btn-primary">
            Consultar ahora
          </Link>
        </div>
      </section>

      {/* SECCIÓN FINAL / SHOWROOM */}
      <section className="home-section home-showroom">
        <div className="container home-showroom-inner">
          <div className="home-showroom-media">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"
              alt="Showroom de motos"
              loading="lazy"
            />
          </div>
          <div className="home-showroom-content">
            <h2>Visitá nuestro local</h2>
            <p>
              Vení a ver el stock de repuestos y accesorios. Te ayudamos a conseguir la pieza justa para tu moto.
            </p>
            <ul>
              <li>Asesoramiento especializado en repuestos de motos</li>
              <li>Amplia variedad de repuestos y accesorios</li>
              <li>Podés traer la muestra de la pieza para comparar</li>
            </ul>
            <Link to="/contacto" className="btn btn-outline">
              Ver cómo llegar
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
