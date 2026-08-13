import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const schema = fs.readFileSync(
  'C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/supabase/schema.sql',
  'utf8',
)
const schemaOk = schema.includes('shopping_customers') && schema.includes('shopping_orders')

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
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(300)
await page.locator('input[value="新客户"]').fill('小红')
await page.locator('select').last().selectOption('bb-01')
await page.waitForTimeout(300)

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByText('导出订单', { exact: true }).click(),
])
const file = 'C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/shots/daisy-orders.csv'
await download.saveAs(file)
const csv = fs.readFileSync(file, 'utf8')
const exportOk =
  csv.includes('客户姓名') &&
  csv.includes('小红') &&
  csv.includes('bb-01') &&
  csv.includes('52000')

console.log(JSON.stringify({ schemaOk, exportOk, errors }, null, 2))
await browser.close()
