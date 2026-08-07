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
await page.waitForTimeout(2500)
await page.screenshot({ path: `${shots}/home.png` })

const nav = page.locator('nav button')
const go = async (label, file, wait = 600) => {
  await nav.filter({ hasText: label }).click()
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${shots}/${file}`, fullPage: true })
}

await go('行程', 'timeline.png', 700)
await go('地图', 'map.png', 2500)
await go('餐厅', 'restaurants.png', 900)
await go('预算', 'budget.png', 700)
await go('提醒', 'reminders.png', 700)

await browser.close()
console.log('screenshots done')
