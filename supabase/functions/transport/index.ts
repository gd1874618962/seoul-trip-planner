// Seoul Trip Planner - transport Edge Function
// Provider: google (Directions API) or naver (Directions 15).
// Secrets: GOOGLE_MAPS_API_KEY / NAVER_CLIENT_ID / NAVER_CLIENT_SECRET

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ status: 'error', options: [] }, { status: 405 })
  }

  const clientId = Deno.env.get('NAVER_CLIENT_ID') || ''
  const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET') || ''
  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || ''
  let body
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const origin = body.origin || {}
  const destination = body.destination || {}
  if (origin.lat == null || destination.lat == null) {
    return Response.json({ status: 'error', options: [] })
  }

  const provider = body.provider || 'google'
  if (provider === 'google' && googleKey) {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}&mode=transit&language=ko&key=${googleKey}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === 'OK' && data.routes?.length) {
        const leg = data.routes[0].legs?.[0] || {}
        const steps = (leg.steps || []).map((step) => {
          if (step.travel_mode === 'TRANSIT') {
            const detail = step.transit_details || {}
            return {
              mode: 'subway',
              line: detail.line?.short_name || detail.line?.name || '地铁',
              from: detail.departure_stop?.name || '',
              to: detail.arrival_stop?.name || '',
            }
          }
          const text = String(step.html_instructions || '').replace(/<[^>]+>/g, '')
          return { mode: 'walk', description: text || '步行' }
        })
        return Response.json({
          status: 'generated',
          options: [
            {
              type: 'subway',
              duration: leg.duration?.text || '',
              costKRW: leg.fare?.text ? `约 ${leg.fare.text}` : '',
              steps,
            },
          ],
        })
      }
    } catch {
      return Response.json({ status: 'error', options: [] })
    }
  }

  if (provider === 'naver' && clientId && clientSecret) {
    const start = `${origin.lng},${origin.lat}`
    const goal = `${destination.lng},${destination.lat}`
    const url =
      `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/transit?start=${start}&goal=${goal}&lang=ko`

    try {
      const res = await fetch(url, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
      })
      if (!res.ok) {
        return Response.json({ status: 'error', options: [] })
      }
      const data = await res.json()
      const route = data?.route?.trafast || []
      if (!route.length) {
        return Response.json({ status: 'error', options: [] })
      }
      const summary = route[0].summary || {}
      const durationMin = Math.max(1, Math.round((summary.duration || 0) / 60000))
      const fare = summary.fare || {}
      const steps = []
      const sections = route[0].sections || []
      sections.forEach((section) => {
        const mode = section.travelMode || 'walking'
        if (mode === 'transit') {
          const guide = section.guide || {}
          steps.push({
            mode: 'subway',
            line: guide.railName || guide.busName || '地铁',
            from: guide.originName || '',
            to: guide.destinationName || '',
          })
        } else {
          steps.push({
            mode: 'walk',
            description: section.distance ? `步行约 ${Math.round(section.distance)} 米` : '步行换乘',
          })
        }
      })
      return Response.json({
        status: 'generated',
        options: [
          {
            type: 'subway',
            duration: `约 ${durationMin} 分钟`,
            costKRW: fare.regular ? `约 ${fare.regular.toLocaleString()} KRW` : '',
            steps,
          },
        ],
      })
    } catch {
      return Response.json({ status: 'error', options: [] })
    }
  }

  return Response.json({ status: 'error', options: [] })
})
