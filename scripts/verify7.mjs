import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '预算' }).click()
await page.waitForTimeout(500)
const text = await page.locator('body').innerText()
console.log(
  JSON.stringify(
    {
      hasRemaining: text.includes('≈ 1805'),
      hasBuffer: text.includes('计划外余量 5 RMB'),
    },
    null,
    2,
  ),
)
await browser.close()
