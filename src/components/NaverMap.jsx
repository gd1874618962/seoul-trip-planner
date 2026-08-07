import { useEffect, useRef } from 'react'

export function getNaverClientId() {
  try {
    return (
      localStorage.getItem('seoul-naver-client-id') ||
      import.meta.env.VITE_NAVER_MAP_CLIENT_ID ||
      ''
    )
  } catch {
    return ''
  }
}

export default function NaverMap({ items, routes }) {
  const elRef = useRef(null)
  const clientId = getNaverClientId()

  useEffect(() => {
    if (!clientId || !elRef.current) return
    const scriptId = 'naver-maps-sdk'

    const draw = () => {
      if (!window.naver?.maps || !elRef.current) return
      const bounds = new window.naver.maps.LatLngBounds()
      items.forEach((p) => bounds.extend(new window.naver.maps.LatLng(p.lat, p.lng)))
      const map = new window.naver.maps.Map(elRef.current, {
        center: bounds.getCenter(),
        zoom: 11,
      })
      if (items.length > 1) map.fitBounds(bounds)
      items.forEach((p) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(p.lat, p.lng),
          map,
          icon: {
            content: `<div class="trip-marker">${p.markerNo || '★'}</div>`,
            size: new window.naver.maps.Size(26, 30),
            anchor: new window.naver.maps.Point(13, 28),
          },
        })
        window.naver.maps.Event.addListener(marker, 'click', () => {
          window.open(
            `https://map.naver.com/p/search/${encodeURIComponent(p.naver || p.address || p.name)}`,
            '_blank',
          )
        })
      })
      routes.forEach((route) => {
        new window.naver.maps.Polyline({
          map,
          path: route.route.map((p) => new window.naver.maps.LatLng(p.lat, p.lng)),
          strokeColor: route.color,
          strokeWeight: 2,
          strokeOpacity: 0.6,
          strokeStyle: 'dash',
        })
      })
    }

    if (document.getElementById(scriptId)) {
      if (window.naver?.maps) draw()
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`
    script.async = true
    script.onload = draw
    document.body.appendChild(script)
  }, [clientId, items, routes])

  return <div ref={elRef} className="h-[380px] w-full rounded-lg bg-[#E9F1F5]" />
}
