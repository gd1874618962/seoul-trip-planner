import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1200)

const report = {}
const nav = page.locator('nav button')

// 1. Timeline edit: reorder + rename a restaurant entry
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(400)
report.editControls = await page.locator('button[aria-label="上移"]').count()

const titleInput = page.locator('input[value="午餐 · 明洞土豆脊骨汤"]')
report.restaurantInputFound = (await titleInput.count()) > 0
if (report.restaurantInputFound) {
  await titleInput.fill('午餐 · 明洞土豆汤（改）')
}
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(400)
report.timelineSaved = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  return raw ? raw.includes('明洞土豆汤（改）') : false
})

// 2. Restaurant page sync
await nav.filter({ hasText: '餐厅' }).click()
await page.waitForTimeout(500)
report.restaurantSynced = await page.getByText('明洞土豆汤（改）', { exact: true }).count()

// 3. Home day count sync after delete one entry
await nav.filter({ hasText: '首页' }).click()
await page.waitForTimeout(400)
report.homeLoaded = (await page.locator('h1').count()) > 0

// 4. Reminder edit
await nav.filter({ hasText: '提醒' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑提醒', { exact: true }).click()
await page.waitForTimeout(400)
const groupTitle = page.locator('input[value="退税流程"]')
report.reminderInputFound = (await groupTitle.count()) > 0
if (report.reminderInputFound) {
  await groupTitle.fill('退税流程（改）')
}
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(400)
report.reminderSaved = await page.getByText('退税流程（改）', { exact: true }).count()
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)
await nav.filter({ hasText: '提醒' }).click()
await page.waitForTimeout(400)
report.reminderPersisted = await page.getByText('退税流程（改）', { exact: true }).count()

report.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
