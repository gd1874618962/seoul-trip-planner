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
const navCount = await page.locator('nav button').count()
await page.locator('nav button').filter({ hasText: '账本' }).click()
await page.waitForTimeout(500)

await page.locator('input[type="number"]').fill('88')
await page.locator('input[placeholder="比如：弘大烤肉两人份"]').fill('测试午餐')
await page.getByText('记入账本', { exact: true }).click()
await page.waitForTimeout(600)

const entryVisible = (await page.getByText('测试午餐', { exact: true }).count()) > 0
const amountVisible = (await page.getByText('88', { exact: true }).count()) > 0
const apiState = await page.evaluate(async () => {
  const res = await fetch('/api/state')
  const data = await res.json()
  return data['seoul-ledger-v1'] || null
})

console.log(
  JSON.stringify(
    {
      navCount,
      entryVisible,
      amountVisible,
      ledgerEntries: apiState ? apiState.entries.length : 0,
      errors,
    },
    null,
    2,
  ),
)
await browser.close()
