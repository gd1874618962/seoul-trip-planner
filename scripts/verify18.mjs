import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const report = {}

async function openPage(initScript) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  if (initScript) await context.addInitScript(initScript)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('dialog', (dialog) => dialog.accept())
  return { context, page, errors }
}

async function addExpense(page, merchant, krw) {
  await page.locator('nav button').filter({ hasText: '账本' }).click()
  await page.waitForTimeout(500)
  await page.locator('input[placeholder="店名/商家"]').fill(merchant)
  await page.locator('input[placeholder="韩元金额"]').fill(String(krw))
  const payerSelect = page.locator('select').nth(1)
  await payerSelect.selectOption({ index: 1 })
  await page.getByText('记入账本', { exact: true }).click()
  await page.waitForTimeout(600)
}

// A: UI + localStorage + AA + stats
{
  const { context, page, errors } = await openPage()
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(900)
  await page.locator('nav button').filter({ hasText: '账本' }).click()
  await page.waitForTimeout(400)
  await page.locator('input[type="number"]').first().fill('200')
  await page.locator('input[placeholder="店名/商家"]').fill('测试烤肉店')
  await page.locator('input[placeholder="韩元金额"]').fill('40000')
  const rmbAuto = await page.locator('input[placeholder="人民币金额"]').inputValue()
  await page.locator('select').nth(1).selectOption({ index: 1 })
  await page.getByText('记入账本', { exact: true }).click()
  await page.waitForTimeout(600)
  report.rmbAuto = rmbAuto
  report.entryVisible = (await page.getByText('测试烤肉店', { exact: false }).count()) > 0
  report.krwVisible = (await page.getByText('40000 KRW', { exact: false }).count()) > 0
  report.aaSection = (await page.getByText('应承担', { exact: true }).count()) > 0
  report.categoryStats = (await page.getByText('餐饮', { exact: true }).count()) > 0
  report.localSaved = await page.evaluate(() => {
    const raw = localStorage.getItem('seoul-ledger-v1')
    return raw ? raw.includes('测试烤肉店') && raw.includes('tripId') : false
  })
  report.uiErrors = errors
  await context.close()
}

// B: cloud push mapping for expenses
{
  const captured = []
  const future = new Date(Date.now() + 3600_000).toISOString()
  const { context, page, errors } = await openPage(() => {
    localStorage.setItem(
      'seoul-supabase-config',
      JSON.stringify({ url: 'http://127.0.0.1:5173', anonKey: 'test-key' }),
    )
  })
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    if (method === 'GET' && url.pathname.endsWith('/trips')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'seoul-2026', updated_at: future, created_at: future, data: {} }]),
      })
    } else if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    } else {
      if (url.pathname.endsWith('/expenses')) captured.push(route.request().postData())
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    }
  })
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1200)
  await addExpense(page, '云端测试店', 10000)
  await page.waitForTimeout(2500)
  const matched = captured.some(
    (body) => body && body.includes('云端测试店') && body.includes('amount_krw') && body.includes('seoul-2026'),
  )
  report.cloudExpenseMapped = matched
  await page.locator('nav button').filter({ hasText: '首页' }).click()
  await page.waitForTimeout(400)
  report.cloudStatusSuccess = (await page.getByText('已同步', { exact: true }).count()) > 0
  report.cloudErrors = errors
  await context.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()
