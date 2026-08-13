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
const waitBody = async (text) => {
  await page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    text,
    { timeout: 6000 },
  )
}

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)

// customer 1 (小红, blue) buys bb-01 up to 3
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(300)
await page.locator('input[value="新客户"]').first().fill('小红')
await page.locator('button[aria-label="蓝色"]').first().click()
await page.locator('select').last().selectOption('bb-01')
await waitBody('× 1')
await page.getByText('+', { exact: true }).first().click()
await waitBody('× 2')
await page.getByText('+', { exact: true }).first().click()
await waitBody('× 3')
await waitBody('已订 3/3')

let card = await page.locator('[data-product="bb-01"]').innerText()
report.c1_full = card.includes('✕') && card.includes('已订 3/3')
report.c1_buyer = card.includes('小红') && card.includes('×3')

// customer 2 tries to add bb-01 -> blocked
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(300)
await page.locator('input[value="新客户"]').last().fill('Amy')
await page.locator('select').last().selectOption('bb-01')
await page.waitForTimeout(500)
card = await page.locator('[data-product="bb-01"]').innerText()
report.c2_blocked = card.includes('已订 3/3') && !card.includes('Amy')

// customer 1 decreases -> freed, customer 2 adds 1
await page.getByText('−', { exact: true }).first().click()
await waitBody('已订 2/3')
card = await page.locator('[data-product="bb-01"]').innerText()
report.freed = card.includes('已订 2/3') && !card.includes('✕')
await page.locator('select').last().selectOption('bb-01')
await waitBody('已订 3/3')
card = await page.locator('[data-product="bb-01"]').innerText()
report.finalFull = card.includes('已订 3/3')
report.finalBuyers = card.includes('小红') && card.includes('Amy')
report.errors = errors

console.log(JSON.stringify(report, null, 2))
await browser.close()
