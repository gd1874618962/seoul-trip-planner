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

const report = {}
await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)

// home -> hub -> daisy
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(400)
report.hub = (await page.getByText('DAISY 代购', { exact: true }).count()) > 0
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(500)

// add customer + rename + color
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(300)
const nameInput = page.locator('input[value="新客户"]')
report.customerAdded = (await nameInput.count()) > 0
await nameInput.fill('小红')
await page.locator('button[aria-label="蓝色"]').click()
await page.waitForTimeout(300)

// add product bb-01, qty to 2
await page.locator('select').last().selectOption('bb-01')
await page.waitForTimeout(300)
report.orderAdded = (await page.getByText('20周年纪念版官方应援棒', { exact: false }).count()) > 0
await page.getByText('+', { exact: true }).last().click()
await page.waitForTimeout(300)

const daisyBody = await page.locator('body').innerText()
report.daisyTotal = daisyBody.includes('₩104,000') && daisyBody.includes('¥496.08')
report.colorCount = await page.locator('button[title]').count()

// isolation: wutong has no customers
await page.locator('nav button').filter({ hasText: '首页' }).click()
await page.waitForTimeout(300)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('梧桐代购', { exact: true }).click()
await page.waitForTimeout(400)
const wutongBody = await page.locator('body').innerText()
report.wutongEmpty = !wutongBody.includes('小红')

// back to daisy, reload persistence
await page.locator('nav button').filter({ hasText: '首页' }).click()
await page.waitForTimeout(300)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)
const reloadBody = await page.locator('body').innerText()
report.persisted = reloadBody.includes('小红') && reloadBody.includes('₩104,000')

report.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
