import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.route('**/commons.wikimedia.org/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      query: {
        pages: {
          1: {
            imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.com/img1.jpg' }],
          },
          2: {
            imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.com/img2.jpg' }],
          },
        },
      },
    }),
  })
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('dialog', (dialog) => dialog.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '餐厅' }).click()
await page.waitForTimeout(500)
await page.getByText('搜索真实图片', { exact: true }).first().click()
await page.waitForTimeout(1500)

const firstCardImgs = await page.locator('article').first().locator('img').count()
const saved = await page.evaluate(() => localStorage.getItem('seoul-restaurant-edits-v1'))
const ui = {
  firstCardImgs,
  photosSaved: Boolean(saved && saved.includes('example.com/img1.jpg') && saved.includes('example.com/img2.jpg')),
}
console.log(JSON.stringify({ ui, errors }, null, 2))
await browser.close()
