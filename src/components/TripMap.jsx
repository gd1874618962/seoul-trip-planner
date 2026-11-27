import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
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

function makeIcon(num, color, highlighted = false, selected = false, clustered = false) {
  const markerColor = color || '#536E6F'
  return L.divIcon({
    className: 'trip-marker-wrap',
    html: `<div class="trip-marker${highlighted ? ' trip-marker-key' : ''}${selected ? ' trip-marker-selected' : ''}${clustered ? ' trip-marker-cluster' : ''}" style="--marker-color:${markerColor}">${num}</div>`,
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
  const mappedItems = items.filter((item) => item.lat != null && item.lng != null)
  const itemKey = mappedItems.map((item) => item.locationId).join('|')
  useEffect(() => {
    if (!mappedItems.length) return
    map.fitBounds(mappedItems.map((p) => [p.lat, p.lng]), { padding: [44, 44], maxZoom: 14 })
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

function groupMapItems(items, clusterByPosition, zoom) {
  if (!clusterByPosition) return items.map((item) => ({ ...item, points: [item] }))
  const threshold = zoom >= 16 ? 0 : zoom >= 14 ? 0.002 : zoom >= 13 ? 0.004 : zoom >= 12 ? 0.008 : 0.018
  if (!threshold) return items.map((item) => ({ ...item, points: [item] }))
  const groups = []
  items.forEach((item) => {
    let group = groups.find(
      (candidate) =>
        Math.abs(Number(candidate.lat) - Number(item.lat)) <= threshold &&
        Math.abs(Number(candidate.lng) - Number(item.lng)) <= threshold,
    )
    if (!group) {
      group = { ...item, points: [] }
      groups.push(group)
    }
    group.points.push(item)
    group.lat = group.points.reduce((sum, point) => sum + Number(point.lat), 0) / group.points.length
    group.lng = group.points.reduce((sum, point) => sum + Number(point.lng), 0) / group.points.length
  })
  return groups
}

function TrackZoom({ onZoom }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom())
    },
  })
  useEffect(() => {
    onZoom(map.getZoom())
  }, [map, onZoom])
  return null
}

function statusLabel(point) {
  if (point.status === 'scheduled') return '已安排'
  if (point.status === 'unverified' || point.verificationPending) return '待核实'
  return '备选'
}

export default function TripMap({
  items,
  focusId = '',
  showRoutes = true,
  onSelectPoint,
  heightClass = 'h-[380px]',
  days: daysProp,
  tripMeta: tripMetaProp,
  clusterByPosition = false,
}) {
  const tripMeta = tripMetaProp || getTripMeta()
  const tripDays = daysProp || getDays()
  const [zoom, setZoom] = useState(11)
  const byDay = buildDayRoutes(items, tripDays)
  const mapItems = groupMapItems(
    items.filter((item) => item.lat != null && item.lng != null),
    clusterByPosition,
    zoom,
  )

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
        <TrackZoom onZoom={setZoom} />
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
        {mapItems.map((p) => {
          const selected = p.points.some((point) => point.locationId === focusId)
          const isCluster = p.points.length > 1
          return (
            <Marker
              key={`${p.locationId || p.id}-${p.points.length}-${Number(p.lat).toFixed(6)}`}
              position={[p.lat, p.lng]}
              icon={makeIcon(
                isCluster ? p.points.length : p.markerNo || (typeof p.id === 'number' ? p.id : '•'),
                p.markerColor || getDayColor(p.day),
                p.keyRestaurant && !isCluster,
                selected,
                isCluster,
              )}
              eventHandlers={{ click: () => onSelectPoint?.(p.locationId) }}
            >
              <Popup>
                <div className="min-w-[190px] max-w-[260px] type-small">
                  {isCluster ? (
                    <>
                      <p className="font-semibold text-ink">地图聚合的 {p.points.length} 个地点</p>
                      <div className="mt-2 space-y-1.5">
                        {p.points.map((point) => (
                          <button
                            key={point.locationId || point.id}
                            type="button"
                            onClick={() => onSelectPoint?.(point.locationId)}
                            className="block w-full border-b border-line pb-1 text-left"
                          >
                            <span className="font-medium text-ink">{point.displayName || point.name}</span>
                            <span className="ml-1 text-muted">{point.groupLabel || point.category}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{p.displayName || p.name}</p>
                        <span className="shrink-0 text-muted">
                          {tripMeta.tripId === 'kuala-lumpur-2027-01'
                            ? statusLabel(p)
                            : p.day
                              ? `DAY ${p.day}`
                              : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-muted">{p.category}</p>
                      <p className="mt-1 text-muted">{p.officialAddress || p.address}</p>
                      {tripMeta.tripId === 'kuala-lumpur-2027-01' && p.date && (
                        <p className="mt-1 font-medium text-ink">
                          {p.date} · 第 {p.order || '—'} 站
                        </p>
                      )}
                      {p.notes && <p className="mt-1 text-muted">{p.notes}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPoint?.(p.locationId)}
                          className="journal-button journal-button--secondary"
                        >
                          查看详情
                        </button>
                        <a
                          href={
                            tripMeta.tripId === 'seoul-2026'
                              ? `https://map.naver.com/p/search/${encodeURIComponent(p.officialAddress || p.naver)}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.officialAddress || p.address || p.name)}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="journal-button journal-button--primary"
                        >
                          打开地图
                        </a>
                      </div>
                    </>
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
