import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getDays, getTripMeta } from '../data/store'
import NaverMap, { getNaverClientId } from './NaverMap'

export const dayColors = {
  1: '#B6573F',
  2: '#2F716D',
  3: '#A57A24',
  4: '#6C5685',
  5: '#5E7A3D',
  6: '#A34E70',
  7: '#5E6C91',
}

const fallbackDayColors = Object.values(dayColors)

export function getDayColor(day) {
  const number = Number(day)
  if (!Number.isFinite(number)) return dayColors[1]
  return dayColors[number] || fallbackDayColors[(Math.max(1, number) - 1) % fallbackDayColors.length]
}

function makeIcon(num, color, highlighted = false, selected = false) {
  const markerColor = color || '#536E6F'
  return L.divIcon({
    className: 'trip-marker-wrap',
    html: `<div class="trip-marker${highlighted ? ' trip-marker-key' : ''}${selected ? ' trip-marker-selected' : ''}" style="--marker-color:${markerColor}">${num}</div>`,
    iconSize: selected ? [34, 38] : [26, 30],
    iconAnchor: selected ? [17, 34] : [13, 28],
    popupAnchor: [0, -30],
  })
}

function makeArrowIcon(color, angle) {
  return L.divIcon({
    className: 'trip-route-arrow-wrap',
    html: `<div class="trip-route-arrow" style="--route-color:${color};--route-angle:${angle}deg"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export function buildDayRoutes(items, days = getDays()) {
  return days
    .map((day) => {
      const refs = []
      day.entries.forEach((entry) => {
        if (entry.locationId) refs.push(entry.locationId)
        else if (Array.isArray(entry.pointIds)) entry.pointIds.forEach((id) => refs.push(`loc-${id}`))
      })
      const route = refs
        .map(
          (ref) =>
            items.find((point) => point.locationId === ref) ||
            items.find((point) => point.id === ref || point.id === Number(ref)),
        )
        .filter(
          (point, index, all) =>
            point && (index === 0 || all[index - 1]?.locationId !== point.locationId),
        )
      return { day: Number(day.id), label: day.label, date: day.date, route }
    })
    .filter((group) => group.route.length > 1)
}

function routeAngle(a, b) {
  const dx = Number(b.lng) - Number(a.lng)
  const dy = Number(a.lat) - Number(b.lat)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

function RouteArrows({ route, color }) {
  return route.slice(1).map((destination, index) => {
    const origin = route[index]
    if (
      origin.lat == null ||
      origin.lng == null ||
      destination.lat == null ||
      destination.lng == null
    ) {
      return null
    }
    return (
      <Marker
        key={`arrow-${destination.locationId || destination.id}-${index}`}
        position={[
          (Number(origin.lat) + Number(destination.lat)) / 2,
          (Number(origin.lng) + Number(destination.lng)) / 2,
        ]}
        icon={makeArrowIcon(color, routeAngle(origin, destination))}
        interactive={false}
        keyboard={false}
      />
    )
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
  days: daysProp,
  tripMeta: tripMetaProp,
}) {
  const tripMeta = tripMetaProp || getTripMeta()
  const tripDays = daysProp || getDays()
  const byDay = buildDayRoutes(items, tripDays)

  if (showRoutes && getNaverClientId() && tripMeta.tripId === 'seoul-2026') {
    return (
      <NaverMap
        items={items}
        routes={byDay.map((group) => ({ ...group, color: getDayColor(group.day) }))}
      />
    )
  }

  return (
    <div className="journal-media border border-line bg-surface">
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
        {showRoutes && byDay.map(({ day, route }) => (
          <Polyline
            key={day}
            positions={route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: getDayColor(day), weight: 3, opacity: 0.82 }}
          />
        ))}
        {showRoutes && byDay.map(({ day, route }) => (
          <RouteArrows key={`arrows-${day}`} route={route} color={getDayColor(day)} />
        ))}
        {items.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makeIcon(
              p.markerNo || (typeof p.id === 'number' ? p.id : '★'),
              p.markerColor || getDayColor(p.day),
              p.keyRestaurant,
              p.locationId === focusId,
            )}
            eventHandlers={{ click: () => onSelectPoint?.(p.locationId) }}
          >
            <Popup>
              <div className="min-w-[160px] type-small">
                <p className="font-semibold text-ink">{p.displayName || p.name}</p>
                <p className="mt-0.5 type-small text-muted">{p.officialAddress || p.address}</p>
                <a
                  href={
                    tripMeta.tripId === 'seoul-2026'
                      ? `https://map.naver.com/p/search/${encodeURIComponent(p.officialAddress || p.naver)}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.officialAddress || p.address || p.name)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="journal-button journal-button--primary mt-2"
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
