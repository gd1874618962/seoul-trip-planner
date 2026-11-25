import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getDays, getTripMeta } from '../data/store'
import NaverMap, { getNaverClientId } from './NaverMap'

export const dayColors = {
  1: '#4B7B9C',
  2: '#7E9B85',
  3: '#D97B5F',
  4: '#2E4A5C',
}

function makeIcon(num, color, highlighted = false, selected = false) {
  const markerColor = color || '#4B7B9C'
  return L.divIcon({
    className: 'trip-marker-wrap',
    html: `<div class="trip-marker${highlighted ? ' trip-marker-key' : ''}${selected ? ' trip-marker-selected' : ''}" style="--marker-color:${markerColor}">${num}</div>`,
    iconSize: selected ? [34, 38] : [26, 30],
    iconAnchor: selected ? [17, 34] : [13, 28],
    popupAnchor: [0, -30],
  })
}

function FitBounds({ items }) {
  const map = useMap()
  const itemKey = items.map((item) => item.locationId).join('|')
  useEffect(() => {
    if (!items.length) return
    map.fitBounds(items.map((p) => [p.lat, p.lng]), { padding: [44, 44], maxZoom: 14 })
  }, [itemKey, map])
  return null
}

function FocusPoint({ items, focusId }) {
  const map = useMap()
  const focusItem = items.find((entry) => entry.locationId === focusId)
  const lat = focusItem?.lat
  const lng = focusItem?.lng
  useEffect(() => {
    if (!focusId || lat == null || lng == null) return
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.65 })
  }, [focusId, lat, lng, map])
  return null
}

export default function TripMap({
  items,
  focusId = '',
  showRoutes = true,
  onSelectPoint,
  heightClass = 'h-[380px]',
}) {
  const tripMeta = getTripMeta()
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

  const transportRoutes = []
  getDays().forEach((day) => {
    day.entries.forEach((entry) => {
      const t = entry.transport
      if (t?.origin?.lat != null && t?.destination?.lat != null) {
        transportRoutes.push([t.origin, t.destination])
      }
    })
  })

  if (showRoutes && getNaverClientId() && tripMeta.tripId === 'seoul-2026') {
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
        center={[tripMeta.mapCenter?.lat || 37.5665, tripMeta.mapCenter?.lng || 126.978]}
        zoom={11}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        scrollWheelZoom={false}
        className={`${heightClass} w-full`}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds items={items} />
        <FocusPoint items={items} focusId={focusId} />
        {showRoutes && transportRoutes.map(([a, b], i) => (
          <Polyline
            key={`transport-${i}`}
            positions={[
              [a.lat, a.lng],
              [b.lat, b.lng],
            ]}
            pathOptions={{ color: '#D97B5F', weight: 2, opacity: 0.75, dashArray: '2 6' }}
          />
        ))}
        {showRoutes && byDay.map(({ day, route }) => (
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
            icon={makeIcon(
              p.markerNo || (typeof p.id === 'number' ? p.id : '★'),
              p.markerColor || dayColors[p.day],
              p.keyRestaurant,
              p.locationId === focusId,
            )}
            eventHandlers={{ click: () => onSelectPoint?.(p.locationId) }}
          >
            <Popup>
              <div className="min-w-[160px] text-[13px]">
                <p className="font-bold text-ink">{p.displayName || p.name}</p>
                <p className="mt-0.5 text-[11px] text-slate">{p.officialAddress || p.address}</p>
                <a
                  href={
                    tripMeta.tripId === 'seoul-2026'
                      ? `https://map.naver.com/p/search/${encodeURIComponent(p.officialAddress || p.naver)}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.officialAddress || p.address || p.name)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-md bg-blue px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  在地图打开
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
