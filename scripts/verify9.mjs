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

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
const nav = page.locator('nav button')

await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑行程', { exact: true }).click()
await page.waitForTimeout(300)
const reflowButton = await page.getByText('顺延时间', { exact: true }).count()

await nav.filter({ hasText: '提醒' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑提醒', { exact: true }).click()
await page.waitForTimeout(300)
const reminderArrows = await page.locator('button[aria-label="上移"]').count()

console.log(JSON.stringify({ reflowButton, reminderArrows, errors }, null, 2))
await browser.close()
