export function haversineMeters(a, b) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

export function buildTransportPlan(origin, destination) {
  if (!origin || !destination || origin.lat == null || destination.lat == null) return null
  const distanceM = haversineMeters(origin, destination)
  const distanceKm = (distanceM / 1000).toFixed(1)
  const options = []

  const walkMinutes = Math.max(5, Math.round(distanceM / 80))
  if (distanceM <= 5000) {
    options.push({
      type: 'walking',
      duration: `约 ${walkMinutes} 分钟`,
      distanceM,
      costKRW: '免费',
      steps: [{ mode: 'walk', description: `步行 ${distanceKm} km 至目的地` }],
    })
  }

  const subwayMinutes = Math.max(15, Math.round(distanceM / 420) + 10)
  options.push({
    type: 'subway',
    duration: `约 ${subwayMinutes} 分钟`,
    costKRW: '约 1,450 KRW',
    steps: [
      { mode: 'walk', description: '步行至附近地铁站' },
      { mode: 'subway', line: '地铁', from: '附近地铁站', to: '目的地附近地铁站' },
      { mode: 'walk', description: '步行至目的地' },
    ],
  })

  const taxiMinutes = Math.max(10, Math.round(distanceM / 500) + 8)
  const taxiCost = Math.round((distanceM / 1000) * 800 + 3800)
  options.push({
    type: 'taxi',
    duration: `约 ${taxiMinutes} 分钟`,
    costKRW: `约 ${taxiCost.toLocaleString()} KRW`,
    steps: [],
  })

  return { status: 'estimated', options }
}
