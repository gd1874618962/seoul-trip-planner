import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})

await page.goto('file:///C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/dist/index.html', {
  waitUntil: 'load',
  timeout: 60000,
})
await page.waitForTimeout(1200)
const nav = page.locator('nav button')
const labels = ['行程', '地图', '餐厅', '预算', '提醒', '账本']
const perTab = {}
for (const label of labels) {
  try {
    await nav.filter({ hasText: label }).click({ timeout: 8000 })
    await page.waitForTimeout(600)
    perTab[label] = 'ok'
  } catch (e) {
    perTab[label] = `fail: ${e.message.split('\n')[0]}`
  }
}
console.log(JSON.stringify({ perTab, errors }, null, 2))
await browser.close()
