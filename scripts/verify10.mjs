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
await page.locator('nav button').filter({ hasText: '提醒' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑提醒', { exact: true }).click()
await page.waitForTimeout(300)

const groupArrows = await page.locator('button[aria-label="整组上移"]').count()
await page.locator('button[aria-label="整组下移"]').first().click()
await page.waitForTimeout(600)

const apiOrder = await page.evaluate(async () => {
  const res = await fetch('/api/state')
  const data = await res.json()
  return data['seoul-reminder-edits-v1']?.__order || []
})
const firstCardTitle = await page.locator('section input').first().inputValue()

console.log(JSON.stringify({ groupArrows, apiOrder, firstCardTitle, errors }, null, 2))
await browser.close()
