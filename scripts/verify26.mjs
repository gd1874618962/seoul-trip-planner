import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

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

const report = {}
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
const nav = page.locator('nav button')

// timeline: generate transport on second entry
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
report.generateButtons = await page.getByText('生成交通攻略', { exact: true }).count()
await page.getByText('生成交通攻略', { exact: true }).nth(1).click()
await page.waitForTimeout(800)
report.transportCard = (await page.getByText('交通攻略', { exact: false }).count()) > 0
report.transportSaved = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  return raw ? raw.includes('"transport"') && raw.includes('"estimated"') : false
})

// map: transport route polyline
await nav.filter({ hasText: '地图' }).click()
await page.waitForTimeout(2000)
const polylineCount = await page.locator('path.leaflet-interactive').count()
report.mapPolylineCount = polylineCount
report.mapPoints = await page.locator('.leaflet-marker-icon').count()

// old data: day3 without transport opens fine
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(400)
await page.locator('button').filter({ hasText: 'DAY 3' }).click()
await page.waitForTimeout(400)
report.day3Ok = (await page.getByText('BIGBANG 演唱会日', { exact: false }).count()) > 0

// delete entry no crash
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)
await page.locator('button[aria-label="删除"]').last().click()
await page.waitForTimeout(500)
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(400)
report.deleteOk = (await page.locator('nav button').count()) === 7

console.log(JSON.stringify({ ...report, errors }, null, 2))
await browser.close()
