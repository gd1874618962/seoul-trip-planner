import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.route('**/nominatim.openstreetmap.org/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        place_id: 999,
        lat: '37.5512',
        lon: '126.9882',
        display_name: 'N Seoul Tower, 龙山, 首尔, 韩国',
      },
    ]),
  })
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)

const searchBox = page.locator('input[placeholder="输入地点搜索（在线地图）"]').first()
await searchBox.fill('首尔塔')
await page.getByText('搜索', { exact: true }).first().click()
await page.waitForTimeout(800)
const resultButton = page.getByText('N Seoul Tower, 龙山, 首尔, 韩国', { exact: true }).first()
const resultCount = await resultButton.count()
if (resultCount) await resultButton.click()
await page.waitForTimeout(600)

const state = await page.evaluate(() => ({
  raw: localStorage.getItem('seoul-timeline-edits-v1'),
}))
const addressValue = await page.locator('input[placeholder="输入地点搜索（在线地图）"]').first().inputValue()
console.log(JSON.stringify({ resultCount, addressValue, raw: state.raw, errors }, null, 2))
await browser.close()
