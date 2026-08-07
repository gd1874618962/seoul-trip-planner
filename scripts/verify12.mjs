import fs from 'node:fs'
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

const exportButton = page.getByText('导出数据', { exact: true })
const importButton = await page.getByText('导入数据', { exact: true }).count()
const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()])
const file = 'C:/Users/PC/Documents/丽笙酒店/seoul-trip-planner/shots/export.json'
await download.saveAs(file)
const content = fs.readFileSync(file, 'utf8')

console.log(
  JSON.stringify(
    {
      importButton,
      exportOk: content.includes('"version": 1') && content.includes('seoul-budget-v1'),
      errors,
    },
    null,
    2,
  ),
)
await browser.close()
