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
const nav = page.locator('nav button')

// open editor
await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
await page.waitForTimeout(500)
const hotelAddressInputs = page.locator('input[placeholder="酒店地址"]')
await hotelAddressInputs.nth(0).fill('测试新地址 123 号')
await hotelAddressInputs.nth(1).fill('测试新地址 123 号')
await page.getByText('保存全部修改', { exact: true }).click()
await page.waitForTimeout(700)

// home sync
const homeSync = (await page.getByText('测试新地址 123 号', { exact: false }).count()) > 0

// map sync
await nav.filter({ hasText: '地图' }).click()
await page.waitForTimeout(1500)
const mapSync = (await page.getByText('测试新地址 123 号', { exact: false }).count()) > 0

// timeline sync
await nav.filter({ hasText: '行程' }).click()
await page.waitForTimeout(600)
const timelineSync = (await page.getByText('测试新地址 123 号', { exact: false }).count()) > 0

// reminders sync
await nav.filter({ hasText: '提醒' }).click()
await page.waitForTimeout(600)
const remindersSync = (await page.getByText('测试新地址 123 号', { exact: false }).count()) > 0

console.log(JSON.stringify({ homeSync, mapSync, timelineSync, remindersSync, errors }, null, 2))
await browser.close()
