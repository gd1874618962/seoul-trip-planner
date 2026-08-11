import fs from 'node:fs'

const file = 'C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/sync-state.json'
if (!fs.existsSync(file)) {
  console.log(JSON.stringify({ exists: false }))
} else {
  const state = JSON.parse(fs.readFileSync(file, 'utf8'))
  const edits = state['seoul-timeline-edits-v1'] || {}
  console.log(
    JSON.stringify(
      {
        exists: true,
        keys: Object.keys(state),
        version: edits.__itineraryVersion,
        day1Titles: (edits[1] || []).map((e) => e.title).slice(0, 20),
        day2Titles: (edits[2] || []).map((e) => e.title).slice(0, 20),
      },
      null,
      2,
    ),
  )
}
