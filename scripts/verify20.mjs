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
const nav = page.locator('nav button')

// restaurant carousel + photo editor
await nav.filter({ hasText: '餐厅' }).click()
await page.waitForTimeout(500)
const carouselCount = await page.locator('.snap-x').count()
await page.getByText('编辑照片/菜单', { exact: true }).click()
await page.waitForTimeout(300)
const firstPhotoBox = page.locator('textarea').first()
await firstPhotoBox.fill('https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg')
await page.waitForTimeout(400)
const firstCardPhotos = await page.locator('article').first().locator('img').count()

// timeline location search -> map marker
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)
const searchBox = page.locator('input[placeholder="输入地点搜索（在线地图）"]')
const searchExists = (await searchBox.count()) > 0
await searchBox.first().fill('首尔塔')
await page.getByText('搜索', { exact: true }).first().click()
await page.waitForTimeout(800)
const picked = (await page.getByText('N Seoul Tower, 龙山, 首尔, 韩国', { exact: false }).count()) > 0
await page.getByText('N Seoul Tower, 龙山, 首尔, 韩国', { exact: false }).first().click()
await page.waitForTimeout(400)
const addressUpdated = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  return raw ? raw.includes('N Seoul Tower') : false
})
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(300)
await nav.filter({ hasText: '地图' }).click()
await page.waitForTimeout(2000)
const markers = await page.locator('.leaflet-marker-icon').count()

console.log(
  JSON.stringify(
    { carouselCount, firstCardPhotos, searchExists, picked, addressUpdated, markers, errors },
    null,
    2,
  ),
)
await browser.close()
