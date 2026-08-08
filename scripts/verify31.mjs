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
await page.locator('nav button').filter({ hasText: '提醒' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑提醒', { exact: true }).click()
await page.waitForTimeout(300)

await page.getByText('新增提醒块', { exact: true }).click()
await page.waitForTimeout(500)
const newBlockShown = (await page.getByText('新提醒块', { exact: true }).count()) > 0

// delete the new block
const newSection = page
  .locator('section')
  .filter({ has: page.locator('input[value="新提醒块"]') })
  .last()
await newSection.locator('button[aria-label="删除整个提醒块"]').click()
await page.waitForTimeout(600)
const newBlockGone = (await page.getByText('新提醒块', { exact: true }).count()) === 0

const stored = await page.evaluate(() => localStorage.getItem('seoul-reminder-edits-v1'))
console.log(JSON.stringify({ newBlockShown, newBlockGone, storedHasNew: false, errors }, null, 2))
await browser.close()
