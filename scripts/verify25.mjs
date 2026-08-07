import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const shots = 'C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/shots'
fs.mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1500)

const nav = page.locator('nav button')
const shot = async (name, wait = 700) => {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${shots}/${name}`, fullPage: true })
}

await shot('home.png', 500)
await nav.filter({ hasText: '行程' }).click()
await shot('timeline.png')
await nav.filter({ hasText: '地图' }).click()
await shot('map.png', 2500)
await nav.filter({ hasText: '餐厅' }).click()
await shot('restaurants.png', 900)
await nav.filter({ hasText: '账本' }).click()
await shot('ledger.png', 700)

// edit trip page (from home)
await nav.filter({ hasText: '首页' }).click()
await page.waitForTimeout(400)
await page.getByText('编辑基础资料（航班/酒店/成员）', { exact: true }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${shots}/edit-trip.png`, fullPage: true })

console.log('screenshots done')
await browser.close()
