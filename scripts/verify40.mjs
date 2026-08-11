import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.addInitScript(() => {
  localStorage.setItem(
    'seoul-timeline-edits-v1',
    JSON.stringify({
      1: [{ id: 'evt-old-1', time: '18:30', title: 'BIGBANG 20周年展（蚕室）' }],
      2: [{ id: 'evt-old-2', time: '10:00', title: '旧 DAY2' }],
      3: [{ id: 'd3-e1', time: '上午', title: '睡眠优先' }],
    }),
  )
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const state = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  const edits = raw ? JSON.parse(raw) : {}
  return {
    day1Len: (edits[1] || []).length,
    day2Len: (edits[2] || []).length,
    day3Len: (edits[3] || []).length,
    version: edits.__itineraryVersion,
    migrationKey: localStorage.getItem('seoul-itinerary-migration'),
  }
})

await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
const body = await page.locator('body').innerText()
const report = {
  day1Cleared: state.day1Len === 0,
  day2Cleared: state.day2Len === 0,
  day3Kept: state.day3Len > 0,
  migrationDone: Boolean(state.migrationKey),
  musinsaVisible: body.includes('MUSINSA'),
  explicitDurationShown: body.includes('55分钟'),
  bodySnippet: body.slice(0, 400),
  errors,
}
console.log(JSON.stringify(report, null, 2))
await browser.close()
