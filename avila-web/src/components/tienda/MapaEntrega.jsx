import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'
import 'leaflet/dist/leaflet.css'

// Reutilizamos la configuración de íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
})

// Centro por defecto: Avila motos Repuestos (San Isidro, Catamarca)
const DEFAULT_CENTER = [-28.433, -65.717]

export default function MapaEntrega({ lat, lng, onChange }) {
  const center = useMemo(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lat, lng]
    }
    return DEFAULT_CENTER
  }, [lat, lng])

  const handleClick = (e) => {
    if (!onChange) return
    const { lat: newLat, lng: newLng } = e.latlng
    onChange({ lat: newLat, lng: newLng })
  }

  return (
    <div style={{ height: '260px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          // Habilitar click para elegir punto de entrega
          map.on('click', handleClick)
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {typeof lat === 'number' && typeof lng === 'number' && (
          <Marker
            position={[lat, lng]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const newPos = e.target.getLatLng()
                if (onChange) {
                  onChange({ lat: newPos.lat, lng: newPos.lng })
                }
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}

