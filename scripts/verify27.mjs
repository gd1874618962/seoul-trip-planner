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
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
const buttons = await page.getByText('生成交通攻略', { exact: true }).count()
await page.getByText('生成交通攻略', { exact: true }).nth(1).click()
await page.waitForTimeout(1000)
const navCount = await page.locator('nav button').count().catch(() => 0)
const bodyHasTransport = (await page.locator('body').innerText().catch(() => '')).includes('交通攻略')
console.log(JSON.stringify({ buttons, navCount, bodyHasTransport, errors }, null, 2))
await browser.close()
