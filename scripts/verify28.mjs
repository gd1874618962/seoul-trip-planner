import { generateTransportRoute, getTransportCacheSize } from '../src/services/transportService.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const origin = { locationId: 'loc-1', name: '弘大', lat: 37.5564, lng: 126.9247 }
const destination = { locationId: 'loc-2', name: '明洞', lat: 37.5608, lng: 126.9845 }

const estimated = await generateTransportRoute(origin, destination, { provider: 'estimated' })
const naverFallback = await generateTransportRoute(origin, destination, { provider: 'naver' })
const googleFallback = await generateTransportRoute(origin, destination, { provider: 'google' })
const cached = await generateTransportRoute(origin, destination, { provider: 'estimated' })

const unit = {
  estimatedOptions: Array.isArray(estimated?.options) && estimated.options.length >= 2,
  estimatedProvider: estimated?.provider === 'estimated',
  naverFallbackProvider: naverFallback?.provider === 'estimated',
  googleFallbackProvider: googleFallback?.provider === 'estimated',
  cacheHit: cached === estimated,
  cacheSize: getTransportCacheSize(),
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
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
await page.getByText('生成交通攻略', { exact: true }).nth(1).click()
await page.waitForTimeout(800)
const ui = {
  cardShown: (await page.getByText('交通攻略', { exact: false }).count()) > 0,
  providerSaved: await page.evaluate(() => {
    const raw = localStorage.getItem('seoul-timeline-edits-v1')
    return raw ? raw.includes('"provider":"estimated"') : false
  }),
}

console.log(JSON.stringify({ unit, ui, errors }, null, 2))
await browser.close()
