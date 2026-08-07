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
await page.waitForTimeout(2000)

const nav = page.locator('nav button')
const labels = ['首页', '行程', '地图', '餐厅', '预算', '提醒']
const report = { errors: [], overflow: [], brokenImages: [], nav: [], map: null }

for (const label of labels) {
  if (label !== '首页') {
    await nav.filter({ hasText: label }).click()
    await page.waitForTimeout(label === '地图' ? 2400 : 600)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (overflow > 0) report.overflow.push(`${label}: +${overflow}px`)
  const broken = await page.evaluate(() =>
    [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
  )
  if (broken.length) report.brokenImages.push(`${label}: ${broken.join(',')}`)
  if (label === '地图') {
    report.map = await page.evaluate(() => {
      const box = document.querySelector('.leaflet-container')?.getBoundingClientRect()
      return {
        w: Math.round(box?.width || 0),
        h: Math.round(box?.height || 0),
        markers: document.querySelectorAll('.leaflet-marker-icon').length,
      }
    })
  }
}

report.nav = await page.locator('nav button').count()
report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
