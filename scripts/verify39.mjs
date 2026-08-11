import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const context1 = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page1 = await context1.newPage()
await page1.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page1.waitForTimeout(900)
await page1.locator('nav button').filter({ hasText: '行程' }).click()
await page1.waitForTimeout(500)
const freshBody = await page1.locator('body').innerText()

const context2 = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context2.addInitScript(() => {
  localStorage.setItem(
    'seoul-timeline-edits-v1',
    JSON.stringify({
      1: [
        { id: 'evt-old-1', time: '18:30', title: 'BIGBANG 20周年展（蚕室）' },
        { id: 'd1-e1', time: '12:00', title: '旧抵达' },
      ],
    }),
  )
})
const page2 = await context2.newPage()
await page2.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page2.waitForTimeout(900)
await page2.locator('nav button').filter({ hasText: '行程' }).click()
await page2.waitForTimeout(500)
const staleBody = await page2.locator('body').innerText()

const report = {
  freshHasMusinsa: freshBody.includes('MUSINSA'),
  freshNoBigbang: !freshBody.includes('BIGBANG 20周年展'),
  staleHasMusinsa: staleBody.includes('MUSINSA'),
  staleNoBigbang: !staleBody.includes('BIGBANG 20周年展'),
}
console.log(JSON.stringify(report, null, 2))
await browser.close()
