import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

// Fix íconos por defecto de Leaflet en bundlers (Vite)
// Usa los assets por defecto embebidos en leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
})

// Centro por defecto: Avila motos Repuestos (San Isidro, Catamarca)
const DEFAULT_CENTER = [-28.433, -65.717]

export default function MapaPuntosRetiro({ puntos, seleccionadoId, onSelect }) {
  // Si no hay puntos, no mostramos mapa
  if (!puntos || puntos.length === 0) {
    return null
  }

  const firstWithCoords =
    puntos.find((p) => typeof p.lat === 'number' && typeof p.lng === 'number') || null

  const center = firstWithCoords ? [firstWithCoords.lat, firstWithCoords.lng] : DEFAULT_CENTER

  // Asegurar que el mapa ocupa un alto razonable
  useEffect(() => {
    // Nada por ahora; hook presente por si necesitamos side effects luego
  }, [])

  return (
    <div style={{ height: '260px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {puntos.map((p) => {
          if (typeof p.lat !== 'number' || typeof p.lng !== 'number') {
            return null
          }
          const isSelected = String(seleccionadoId) === String(p.id)
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              eventHandlers={{
                click: () => onSelect && onSelect(String(p.id)),
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>{p.nombre}</strong>
                  {p.direccion_texto && (
                    <div style={{ marginTop: '0.25rem' }}>{p.direccion_texto}</div>
                  )}
                  {p.horarios && (
                    <div style={{ marginTop: '0.25rem', color: '#555' }}>Horarios: {p.horarios}</div>
                  )}
                  {p.telefono && (
                    <div style={{ marginTop: '0.25rem', color: '#555' }}>Tel: {p.telefono}</div>
                  )}
                  {isSelected && (
                    <div style={{ marginTop: '0.25rem', color: '#0a8f08' }}>Seleccionado</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

