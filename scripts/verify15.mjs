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
await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
await page.waitForTimeout(500)

const cloudSection = (await page.getByText('云同步（Supabase）', { exact: true }).count()) > 0
const urlInput = page.locator('input[placeholder="https://xxxx.supabase.co"]')
const keyInput = page.locator('input[placeholder="eyJhbGciOi..."]')
const inputsExist = (await urlInput.count()) > 0 && (await keyInput.count()) > 0

// local edit still works without cloud config
const addressInput = page.locator('input[placeholder="酒店地址"]').first()
await addressInput.fill('本地回退测试地址')
await page.getByText('保存全部修改', { exact: true }).click()
await page.waitForTimeout(700)
const localSaved = (await page.getByText('本地回退测试地址', { exact: false }).count()) > 0

console.log(JSON.stringify({ cloudSection, inputsExist, localSaved, errors }, null, 2))
await browser.close()
