import { buildTransportPlan } from '../src/utils/transportEngine.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const hongdae = { locationId: 'loc-1', lat: 37.5564, lng: 126.9247 }
const seongsu = { locationId: 'loc-5', lat: 37.5447, lng: 127.056 }
const myeongdong = { locationId: 'loc-2', lat: 37.5608, lng: 126.9845 }
const hannam = { locationId: 'loc-7', lat: 37.5336, lng: 127.0004 }

const staticPlan = buildTransportPlan(hongdae, seongsu)
const subway = (staticPlan?.options || []).find((o) => o.type === 'subway')
const fallbackPlan = buildTransportPlan(hannam, myeongdong)
const sameStationPlan = buildTransportPlan(hongdae, { ...hongdae, locationId: 'loc-3' })

const unit = {
  staticLine: subway?.line === '2号线',
  staticFromTo: subway?.from === '홍대입구' && subway?.to === '성수',
  fallbackHasOptions: Array.isArray(fallbackPlan?.options) && fallbackPlan.options.length >= 2,
  sameStationWalk: (sameStationPlan?.options || []).every((o) => o.type === 'walking'),
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
const todayButton = await page.getByText('今日行程（当天执行视图）', { exact: true }).count()
await page.getByText('今日行程（当天执行视图）', { exact: true }).click()
await page.waitForTimeout(500)
const ui = {
  todayButton,
  todayPage: (await page.getByText('今日行程', { exact: true }).count()) > 0,
  entriesShown: (await page.locator('section h3').count()) > 0,
}

console.log(JSON.stringify({ unit, ui, errors }, null, 2))
await browser.close()
