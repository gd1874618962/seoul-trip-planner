import { tripMeta } from '../src/data/trip.js'
import { getDays } from '../src/data/store.js'

const version = tripMeta.itineraryVersion
const oldOverride = {
  1: [
    { id: 'd1-e1', time: '12:00', title: '旧行程 明洞土豆脊骨汤' },
    { id: 'd1-e3b', time: '18:30', title: 'BIGBANG 20周年展' },
  ],
}
const versionedOverride = {
  ...oldOverride,
  __itineraryVersion: { 1: version },
}

const staleDay1 = getDays(oldOverride).find((d) => d.id === 1)
const currentDay1 = getDays(versionedOverride).find((d) => d.id === 1)
const unit = {
  staleReplaced: staleDay1.entries.some((e) => /MUSINSA/.test(e.title || '')) &&
    !staleDay1.entries.some((e) => /BIGBANG 20/.test(e.title || '')),
  versionedKeepsEdits: currentDay1.entries.some((e) => /旧行程/.test(e.title || '')),
  day2Defaults: getDays({}).find((d) => d.id === 2).entries.some((e) => /PIX/.test(e.title || '')),
}

console.log(JSON.stringify({ unit }, null, 2))
