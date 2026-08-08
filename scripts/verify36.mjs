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
await page.locator('nav button').filter({ hasText: '账本' }).click()
await page.waitForTimeout(500)

const ocrButton = (await page.getByText('上传小票识别（OCR）', { exact: true }).count()) > 0

const addExpense = async (merchant, amount, payerIndex) => {
  await page.locator('input[placeholder="店名/商家"]').fill(merchant)
  await page.locator('input[placeholder="人民币金额"]').fill(String(amount))
  await page.locator('select').nth(1).selectOption({ index: payerIndex })
  await page.getByText('记入账本', { exact: true }).click()
  await page.waitForTimeout(500)
}

await addExpense('餐1', 100, 1)
await addExpense('餐2', 60, 2)

const body = await page.locator('body').innerText()
const aa = {
  settlementLine: body.includes('需付'),
  oweLabel: body.includes('应付'),
  receiveLabel: body.includes('应收'),
}

console.log(JSON.stringify({ ocrButton, aa, errors }, null, 2))
await browser.close()
