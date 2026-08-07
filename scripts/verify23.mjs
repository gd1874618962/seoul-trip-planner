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
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)
await page.locator('input[placeholder="输入地点搜索（在线地图）"]').first().fill('首尔塔')
await page.getByText('搜索', { exact: true }).first().click()
await page.waitForTimeout(800)
await page.getByText('N Seoul Tower, 龙山, 首尔, 韩国', { exact: true }).first().click()
await page.waitForTimeout(700)
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(300)

await page.locator('nav button').filter({ hasText: '地图' }).click()
await page.waitForTimeout(2000)
const markerLabels = await page.evaluate(() =>
  [...document.querySelectorAll('.trip-marker')].map((el) => el.textContent.trim()),
)
const customVisible = (await page.getByText('N Seoul Tower', { exact: false }).count()) > 0
const sequential = markerLabels.length > 0 && markerLabels.every((v) => /^\d+$/.test(v))
const hasOne = markerLabels.includes('1')
const hasLast = markerLabels.includes(String(markerLabels.length))

console.log(JSON.stringify({ markerLabels, customVisible, sequential, hasOne, hasLast, errors }, null, 2))
await browser.close()
