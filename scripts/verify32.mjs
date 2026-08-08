import { days, points } from '../src/data/trip.js'
import { getDays } from '../src/data/store.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const unit = {
  defaultHasBigbang: days[0].entries.some((e) => /BIGBANG/.test(e.title || '')),
  pointsCount: points.length >= 17,
  mergeKeepsNewDefault: (() => {
    const fakeOverrides = {
      1: [{ id: 'd1-e1', time: '12:00', title: 'old user entry' }],
    }
    const day1 = getDays(fakeOverrides).find((d) => d.id === 1)
    return day1.entries.some((e) => e.id === 'd1-e3b')
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
const ui = {
  bigbangVisible: (await page.getByText('BIGBANG 20周年展', { exact: false }).count()) > 0,
}

console.log(JSON.stringify({ unit, ui, errors }, null, 2))
await browser.close()
