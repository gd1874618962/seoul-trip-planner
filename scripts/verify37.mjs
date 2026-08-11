import { days, points } from '../src/data/trip.js'
import { getDays } from '../src/data/store.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const day1 = days[0]
const day2 = days[1]
const day1Titles = day1.entries.map((e) => e.title || '')
const day2Titles = day2.entries.map((e) => e.title || '')

const unit = {
  fourDays: days.length === 4,
  day1HasMusinsa: day1Titles.some((t) => /MUSINSA/.test(t)),
  day1HasPhotoObject: day1Titles.some((t) => /Photo Object/.test(t)),
  removedItems: !day1Titles.some((t) => /MUUT|Neo Teria|BIGBANG 20/.test(t)),
  day2HasPix: day2Titles.some((t) => /PIX/.test(t)),
  day2NoDaiso: !day2Titles.some((t) => /DAISO/.test(t)),
  transportFields: day1.entries.some(
    (e) => e.transportType && e.line && typeof e.costKRW === 'number' && typeof e.costCNY === 'number',
  ),
  pointsExcludeRemoved: !points.some((p) => p.locationId === 'loc-7' || p.locationId === 'loc-17'),
  pointsIncludeNew: ['loc-18', 'loc-19', 'loc-20', 'loc-21', 'loc-22'].every((id) =>
    points.some((p) => p.locationId === id),
  ),
  mergeFiltersOld: (() => {
    const fake = {
      1: [
        { id: 'd1-e3b', time: '18:30', title: 'BIGBANG 20周年展' },
        { id: 'd1-e4', time: '备用', title: 'MUUT 汉南店' },
      ],
    }
    return !getDays(fake)[0].entries.some((e) => /MUUT|BIGBANG 20/.test(e.title || ''))
  })(),
}

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
const timeline = {
  musinsaVisible: (await page.getByText('MUSINSA', { exact: false }).count()) > 0,
}
await page.locator('nav button').filter({ hasText: '地图' }).click()
await page.waitForTimeout(1500)
const body = await page.locator('body').innerText()
const mapPage = {
  noMuut: !body.includes('MUUT'),
  noBigbangExpo: !body.includes('BIGBANG 20周年展'),
}

console.log(JSON.stringify({ unit, timeline, mapPage, errors }, null, 2))
await browser.close()
