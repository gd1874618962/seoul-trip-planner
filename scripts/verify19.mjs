import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const CONFIG = {
  url: 'https://xzocohvaocymlhkrrnhk.supabase.co',
  anonKey: 'sb_publishable_NMSjPwACEqcrn9ETRoaD9A_nb1pobIa',
}
const PROXY = 'http://127.0.0.1:7890'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

async function openDevice() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    proxy: { server: PROXY, bypass: 'localhost,127.0.0.1' },
  })
  await context.addInitScript((config) => {
    localStorage.setItem('seoul-supabase-config', JSON.stringify(config))
  }, CONFIG)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('dialog', (dialog) => dialog.accept())
  return { context, page, errors }
}

const report = {}

// Device A: edit hotel address
const a = await openDevice()
await a.page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await a.page.waitForTimeout(2500)
report.aOffline = (await a.page.getByText('离线模式', { exact: true }).count()) > 0
await a.page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
await a.page.waitForTimeout(500)
await a.page.locator('input[placeholder="酒店地址"]').first().fill('真实同步测试地址 888')
await a.page.getByText('保存全部修改', { exact: true }).click()
await a.page.waitForTimeout(3500)
report.aSaved = await a.page.evaluate(() => {
  const raw = localStorage.getItem('seoul-trip-edits-v1')
  return raw ? raw.includes('真实同步测试地址 888') : false
})
await a.page.locator('nav button').filter({ hasText: '首页' }).click()
await a.page.waitForTimeout(400)
report.aStatus = (await a.page.getByText('已同步', { exact: true }).count()) > 0
await a.context.close()

// Device B: fresh device pulls
const b = await openDevice()
await b.page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await b.page.waitForTimeout(3500)
report.bSynced = (await b.page.getByText('真实同步测试地址 888', { exact: false }).count()) > 0
report.bStatus = (await b.page.getByText('已同步', { exact: true }).count()) > 0

// Cleanup: reset hotel address on device A
await a.context.close()
const a2 = await openDevice()
await a2.page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await a2.page.waitForTimeout(2500)
await a2.page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
await a2.page.waitForTimeout(500)
await a2.page.getByText('恢复默认', { exact: true }).click()
await a2.page.waitForTimeout(3500)
report.cleanupDone = true
await a2.context.close()

report.errors = [...a.errors, ...b.errors]
console.log(JSON.stringify(report, null, 2))
await browser.close()
