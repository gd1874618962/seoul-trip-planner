import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
const report = {}
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
const nav = page.locator('nav button')

// timeline transport + suggested departure + status
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
const bodyText = await page.locator('body').innerText()
report.transportEta = bodyText.includes('约 25 分钟') || bodyText.includes('约 15 分钟')
report.suggestedDeparture = bodyText.includes('建议出发')
report.progressShown = /\d+\/\d+/.test(bodyText)

await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('标记完成', { exact: true }).first().click()
await page.getByText('完成编辑', { exact: true }).click()
await page.waitForTimeout(600)
report.statusSaved = await page.evaluate(() => {
  const raw = localStorage.getItem('seoul-timeline-edits-v1')
  return raw ? raw.includes('"status":"completed"') : false
})
const body2 = await page.locator('body').innerText()
report.progressAfter = body2.includes('1/6') || body2.includes('1/5')

// map displayName / officialAddress / naver link
await nav.filter({ hasText: '地图' }).click()
await page.waitForTimeout(1500)
const firstLink = await page.locator('a[href*="map.naver.com"]').first().getAttribute('href')
report.officialAddressInNav = (firstLink || '').includes('61-10%20Yeonnam-ro') || (firstLink || '').includes('61-10')
report.mapShowsDisplayName = (await page.getByText('Sophie House', { exact: true }).count()) > 0

console.log(JSON.stringify({ ...report, errors }, null, 2))
await browser.close()
