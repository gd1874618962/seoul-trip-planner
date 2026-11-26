import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173'
const config = {
  url: 'https://cloud-sync.test',
  anonKey: 'publishable-test-key',
}
const rows = new Map()
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

async function openDevice() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript((cloudConfig) => {
    localStorage.setItem('seoul-supabase-config', JSON.stringify(cloudConfig))
    localStorage.setItem('stp-active-trip', 'kuala-lumpur-2027-01')
  }, config)
  await context.route('https://cloud-sync.test/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'GET') {
      if (url.pathname.endsWith('/trips')) {
        const id = url.searchParams.get('id')?.replace(/^eq\./, '')
        const row = rows.get(id)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(row ? [row] : []),
        })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    if (request.method() === 'POST' && url.pathname.endsWith('/trips')) {
      const payload = request.postDataJSON()
      const incoming = Array.isArray(payload) ? payload : [payload]
      incoming.forEach((row) => {
        rows.set(row.id, {
          ...row,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        })
      })
    }
    await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(message.text())
    }
  })
  page.on('dialog', (dialog) => dialog.accept())
  return { context, page, errors }
}

const a = await openDevice()
await a.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await a.page.waitForTimeout(900)
await a.page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await a.page.waitForTimeout(2600)
const pushedOnFirstLoad = rows.get('kuala-lumpur-2027-01')?.data

await a.page.getByText('编辑旅行资料', { exact: true }).click()
await a.page.waitForTimeout(250)
await a.page.locator('label').filter({ hasText: /^地址/ }).first().locator('input').fill('跨设备同步验收地址')
await a.page.getByRole('button', { name: '保存全部修改' }).click()
await a.page.waitForTimeout(2600)

const b = await openDevice()
await b.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await b.page.waitForTimeout(1800)
await b.page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await b.page.waitForTimeout(2200)
const bText = await b.page.locator('body').innerText()

const report = {
  firstLoadCreatedRow: Boolean(pushedOnFirstLoad),
  pushUsesKualaLumpurScopedKeys: Boolean(
    pushedOnFirstLoad &&
      Object.keys(pushedOnFirstLoad).some((key) => key.includes('--kuala-lumpur-2027-01')),
  ),
  secondDevicePulledEdit: bText.includes('跨设备同步验收地址'),
  secondDeviceShowsSynced: bText.includes('已同步'),
  errors: [...a.errors, ...b.errors],
}

console.log(JSON.stringify(report, null, 2))
await a.context.close()
await b.context.close()
await browser.close()
