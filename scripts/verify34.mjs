import { points } from '../src/data/trip.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const unit = {
  allHaveDisplayName: points.every((p) => Boolean(p.displayName)),
  allHaveOfficialAddress: points.every((p) => Boolean(p.officialAddress)),
}

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

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.locator('nav button').filter({ hasText: '地图' }).click()
await page.waitForTimeout(1500)
const ui = {
  bigbangDisplay: (await page.getByText('BIGBANG 20周年展（蚕室）', { exact: true }).count()) > 0,
  sophieDisplay: (await page.getByText('Sophie House 民宿', { exact: true }).count()) > 0,
}

console.log(JSON.stringify({ unit, ui, errors }, null, 2))
await browser.close()
