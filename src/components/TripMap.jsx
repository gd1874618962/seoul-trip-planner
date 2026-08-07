import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getDays } from '../data/store'
import NaverMap, { getNaverClientId } from './NaverMap'

export const dayColors = {
  1: '#4B7B9C',
  2: '#7E9B85',
  3: '#D97B5F',
  4: '#2E4A5C',
}

function makeIcon(num, day) {
  return L.divIcon({
    className: 'trip-marker-wrap',
    html: `<div class="trip-marker" style="--marker-color:${dayColors[day]}">${num}</div>`,
    iconSize: [26, 30],
    iconAnchor: [13, 28],
    popupAnchor: [0, -26],
  })
}

function FitBounds({ items }) {
  const map = useMap()
  useEffect(() => {
    if (!items.length) return
    map.fitBounds(items.map((p) => [p.lat, p.lng]), { padding: [44, 44], maxZoom: 14 })
  }, [items, map])
  return null
}

export default function TripMap({ items }) {
  const routeByDay = {}
  getDays().forEach((day) => {
    const refs = []
    day.entries.forEach((entry) => {
      if (entry.locationId) refs.push(entry.locationId)
      else if (Array.isArray(entry.pointIds)) entry.pointIds.forEach((id) => refs.push(`loc-${id}`))
    })
    routeByDay[day.id] = refs
  })
  const byDay = Object.entries(routeByDay)
    .map(([day, refs]) => ({
      day: Number(day),
      route: refs
        .map(
          (ref) =>
            items.find((p) => p.locationId === ref) ||
            items.find((p) => p.id === ref || p.id === Number(ref)),
        )
        .filter((p, i, arr) => p && (i === 0 || arr[i - 1]?.locationId !== p.locationId)),
    }))
    .filter((group) => group.route.length > 1)

  if (getNaverClientId()) {
    return (
      <NaverMap
        items={items}
        routes={byDay.map((group) => ({ ...group, color: dayColors[group.day] }))}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line shadow-card">
      <MapContainer
        center={[37.5665, 126.978]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-[380px] w-full"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds items={items} />
        {byDay.map(({ day, route }) => (
          <Polyline
            key={day}
            positions={route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: dayColors[day], weight: 2, opacity: 0.55, dashArray: '1 6' }}
          />
        ))}
        {items.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makeIcon(p.markerNo || (typeof p.id === 'number' ? p.id : '★'), p.day)}
          >
            <Popup>
              <div className="min-w-[160px] text-[13px]">
                <p className="font-bold text-ink">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-slate">{p.address}</p>
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(p.naver)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-md bg-blue px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  在 Naver 地图打开
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
