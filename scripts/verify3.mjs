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

await page.goto('file:///C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/dist/index.html', {
  waitUntil: 'load',
  timeout: 60000,
})
await page.waitForTimeout(1800)

const report = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim() || '',
  buttons: document.querySelectorAll('nav button').length,
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  brokenImages: [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute('src')),
}))

const nav = page.locator('nav button')
for (const label of ['行程', '地图', '餐厅', '预算', '提醒']) {
  await nav.filter({ hasText: label }).click()
  await page.waitForTimeout(label === '地图' ? 2000 : 500)
}
report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
