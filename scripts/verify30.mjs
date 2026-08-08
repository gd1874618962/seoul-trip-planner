import { locationStationMap } from '../src/data/locationStationMap.js'
import { buildTransportPlan } from '../src/utils/transportEngine.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const unit = {
  stationCount: Object.keys(locationStationMap).length >= 10,
  hasExit: Object.values(locationStationMap).every((v) => Boolean(v.station.exit)),
  routeSteps: (() => {
    const plan = buildTransportPlan(
      { locationId: 'loc-1', lat: 37.5564, lng: 126.9247 },
      { locationId: 'loc-5', lat: 37.5447, lng: 127.056 },
    )
    const subway = (plan?.options || []).find((o) => o.type === 'subway')
    return (
      subway?.steps?.[0]?.mode === 'walk' &&
      subway?.steps?.[1]?.mode === 'subway' &&
      subway?.steps?.[subway.steps.length - 1]?.mode === 'walk'
    )
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
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.getByText('今日行程（当天执行视图）', { exact: true }).click()
await page.waitForTimeout(500)
const ui = {
  nextCard: (await page.getByText('下一步', { exact: true }).count()) > 0,
  navCount: await page.locator('nav button').count(),
}
const completeButtons = page.getByText('完成', { exact: true })
if ((await completeButtons.count()) > 0) {
  await completeButtons.first().click()
  await page.waitForTimeout(600)
}
ui.completedSaved = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  return raw ? raw.includes('"status":"completed"') : false
})

console.log(JSON.stringify({ unit, ui, errors }, null, 2))
await browser.close()
