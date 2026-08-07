import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.addInitScript(() => {
  localStorage.setItem(
    'seoul-supabase-config',
    JSON.stringify({ url: 'http://127.0.0.1:5173', anonKey: 'test-key' }),
  )
})
const page = await context.newPage()
const errors = []
const requests = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
page.on('request', (req) => {
  if (req.url().includes('/rest/v1/')) requests.push(`${req.method()} ${req.url()}`)
})
const future = new Date(Date.now() + 3600_000).toISOString()
const cloudData = {
  'seoul-trip-edits-v1': {
    meta: { title: 'CLOUD 云同步标题', tripId: 'seoul-2026' },
  },
}
await page.route('**/rest/v1/**', async (route) => {
  const url = new URL(route.request().url())
  const method = route.request().method()
  if (method === 'GET' && url.pathname.endsWith('/trips')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'seoul-2026', updated_at: future, created_at: future, data: cloudData },
      ]),
    })
  } else if (method === 'GET') {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  } else {
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  }
})
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2000)
const result = await page.evaluate(() => {
  return {
    keys: Object.keys(localStorage),
    tripEdits: localStorage.getItem('seoul-trip-edits-v1'),
    cloudMeta: localStorage.getItem('seoul-cloud-meta'),
    config: localStorage.getItem('seoul-supabase-config'),
  }
})
const h1 = await page.locator('h1').first().innerText()
const manualFetch = await page.evaluate(async () => {
  const res = await fetch(
    'http://127.0.0.1:5173/rest/v1/trips?id=eq.seoul-2026&select=*',
    { headers: { apikey: 'x', Authorization: 'Bearer x' } },
  )
  return { status: res.status, body: await res.text() }
})
console.log(JSON.stringify({ result, h1, requests, manualFetch, errors }, null, 2))
await browser.close()
