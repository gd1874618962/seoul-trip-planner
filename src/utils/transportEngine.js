import { seoulStations, seoulTransitRoutes } from '../data/seoulTransit.js'
import { locationStationMap } from '../data/locationStationMap.js'

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

function buildStaticSubway(origin, destination) {
  const a = seoulStations[origin?.locationId]
  const b = seoulStations[destination?.locationId]
  if (!a || !b) return null
  if (a.name === b.name) return { sameStation: true }
  const originStation = locationStationMap[origin?.locationId]
  const destinationStation = locationStationMap[destination?.locationId]
  const preWalk = originStation
    ? {
        mode: 'walk',
        description: `步行${originStation.walkingMinutes}分钟到${originStation.station.name} ${originStation.station.exit}`,
      }
    : { mode: 'walk', description: '步行至附近地铁站' }
  const postWalk = destinationStation
    ? {
        mode: 'walk',
        description: `步行${destinationStation.walkingMinutes}分钟到达（${destinationStation.station.name} ${destinationStation.station.exit}）`,
      }
    : { mode: 'walk', description: '步行至目的地' }
  const direct =
    seoulTransitRoutes[`${origin.locationId}|${destination.locationId}`] ||
    seoulTransitRoutes[`${destination.locationId}|${origin.locationId}`]
  if (!direct) return null
  const steps = direct.transferAt
    ? [
        preWalk,
        { mode: 'subway', line: direct.firstLine || direct.line, from: direct.from, to: direct.transferAt },
        { mode: 'walk', description: `换乘 ${direct.secondLine}` },
        { mode: 'subway', line: direct.secondLine, from: direct.transferAt, to: direct.to },
        postWalk,
      ]
    : [
        preWalk,
        { mode: 'subway', line: direct.line, from: direct.from, to: direct.to },
        postWalk,
      ]
  return {
    type: 'subway',
    duration: direct.duration,
    costKRW: direct.costKRW,
    steps,
  }
}

export function buildTransportPlan(origin, destination) {
  if (!origin || !destination || origin.lat == null || destination.lat == null) return null
  const staticSubway = buildStaticSubway(origin, destination)
  if (staticSubway?.sameStation) {
    return {
      status: 'static',
      options: [
        {
          type: 'walking',
          duration: '约 15 分钟',
          distanceM: 1200,
          costKRW: '免费',
          steps: [{ mode: 'walk', description: '同一片区，步行前往即可' }],
        },
      ],
    }
  }
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

  if (staticSubway) {
    options.push(staticSubway)
  } else {
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
  }

  const taxiMinutes = Math.max(10, Math.round(distanceM / 500) + 8)
  const taxiCost = Math.round((distanceM / 1000) * 800 + 3800)
  options.push({
    type: 'taxi',
    duration: `约 ${taxiMinutes} 分钟`,
    costKRW: `约 ${taxiCost.toLocaleString()} KRW`,
    steps: [],
  })

  return { status: staticSubway ? 'static' : 'estimated', options }
}
