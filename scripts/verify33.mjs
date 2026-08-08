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

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
const nav = page.locator('nav button')

// add ledger expense 100 RMB
await nav.filter({ hasText: '账本' }).click()
await page.waitForTimeout(400)
await page.locator('input[placeholder="店名/商家"]').fill('联动测试')
await page.locator('input[placeholder="人民币金额"]').fill('100')
await page.getByText('记入账本', { exact: true }).click()
await page.waitForTimeout(600)

// home remaining = 7500 - 5695 - 100 = 1705
await nav.filter({ hasText: '首页' }).click()
await page.waitForTimeout(500)
const body = await page.locator('body').innerText()
const home = {
  remaining1705: body.includes('1705'),
  spent5795: body.includes('5795'),
}

// budget page shows ledger total
await nav.filter({ hasText: '预算' }).click()
await page.waitForTimeout(500)
const budgetBody = await page.locator('body').innerText()
const budget = {
  remaining1705: budgetBody.includes('1705'),
  ledgerLine: budgetBody.includes('含账本流水'),
}

console.log(JSON.stringify({ home, budget, errors }, null, 2))
await browser.close()
