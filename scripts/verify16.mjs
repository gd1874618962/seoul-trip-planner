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

// A: no cloud config -> offline mode + local edit works
{
  const { context, page, errors } = await openPage()
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1200)
  report.noConfigOffline = (await page.getByText('离线模式', { exact: true }).count()) > 0
  await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('input[placeholder="酒店地址"]').first().fill('本地缓存测试地址')
  await page.getByText('保存全部修改', { exact: true }).click()
  await page.waitForTimeout(500)
  report.localSaved = await page.evaluate(() => {
    const raw = localStorage.getItem('seoul-trip-edits-v1')
    return raw ? raw.includes('本地缓存测试地址') : false
  })
  report.noConfigErrors = errors
  await context.close()
}

// B: wrong cloud config -> app still usable, error shown
{
  const { context, page, errors } = await openPage(() => {
    localStorage.setItem(
      'seoul-supabase-config',
      JSON.stringify({ url: 'http://127.0.0.1:9', anonKey: 'bad-key' }),
    )
  })
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3500)
  report.badConfigAppUsable = (await page.locator('h1').count()) > 0
  report.badConfigErrorShown =
    (await page.getByText('云同步失败，当前使用本地缓存', { exact: false }).count()) > 0
  await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('input[placeholder="酒店地址"]').first().fill('坏配置下仍可编辑')
  await page.getByText('保存全部修改', { exact: true }).click()
  await page.waitForTimeout(500)
  report.badConfigLocalEdit = await page.evaluate(() => {
    const raw = localStorage.getItem('seoul-trip-edits-v1')
    return raw ? raw.includes('坏配置下仍可编辑') : false
  })
  report.badConfigErrors = errors
  await context.close()
}

// C+D: mocked cloud success -> pull applies + push sets success
{
  const future = new Date(Date.now() + 3600_000).toISOString()
  const cloudData = {
    'seoul-trip-edits-v1': {
      meta: { title: 'CLOUD 云同步标题', tripId: 'seoul-2026' },
    },
  }
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
        body: JSON.stringify([
          { id: 'seoul-2026', updated_at: future, created_at: future, data: cloudData },
        ]),
      })
    } else if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    } else {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    }
  })
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  report.cloudPullApplied = await page.evaluate(() => {
    const raw = localStorage.getItem('seoul-trip-edits-v1')
    return raw ? raw.includes('CLOUD 云同步标题') : false
  })
  report.cloudStatusSuccess = (await page.getByText('已同步', { exact: true }).count()) > 0
  // push path
  await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('input[placeholder="酒店地址"]').first().fill('云推送测试地址')
  await page.getByText('保存全部修改', { exact: true }).click()
  await page.waitForTimeout(2500)
  report.cloudPushStatus = (await page.getByText('已同步', { exact: true }).count()) > 0
  report.cloudErrors = errors
  await context.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()
