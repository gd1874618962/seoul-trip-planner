import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const contextA = await browser.newContext({ viewport: { width: 390, height: 844 } })
const pageA = await contextA.newPage()
const contextB = await browser.newContext({ viewport: { width: 390, height: 844 } })
const pageB = await contextB.newPage()

const report = { budgetSync: false, timelineSync: false, errors: [] }
pageA.on('pageerror', (err) => report.errors.push(`A: ${err.message}`))
pageB.on('pageerror', (err) => report.errors.push(`B: ${err.message}`))

await pageA.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await pageA.waitForTimeout(800)
const navA = pageA.locator('nav button')

// A edits budget food amount 900 -> 500
await navA.filter({ hasText: '预算' }).click()
await pageA.waitForTimeout(400)
await pageA.getByText('编辑预算', { exact: true }).click()
await pageA.waitForTimeout(300)
await pageA.locator('input[value="900"]').fill('500')
await pageA.getByText('完成编辑', { exact: true }).click()
await pageA.waitForTimeout(900)

// B opens fresh, should see 500
await pageB.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await pageB.waitForTimeout(800)
await pageB.locator('nav button').filter({ hasText: '预算' }).click()
await pageB.waitForTimeout(400)
report.budgetSync = (await pageB.getByText('500', { exact: false }).count()) > 0

// A edits a timeline restaurant title
await navA.filter({ hasText: '行程' }).click()
await pageA.waitForTimeout(400)
await pageA.getByText('编辑行程', { exact: true }).click()
await pageA.waitForTimeout(300)
const titleInput = pageA.locator('input[value="午餐 · 明洞土豆脊骨汤"]')
if ((await titleInput.count()) > 0) {
  await titleInput.fill('午餐 · 明洞土豆汤（同步）')
}
await pageA.getByText('完成编辑', { exact: true }).click()
await pageA.waitForTimeout(900)

// B reloads and checks restaurant page
await pageB.reload({ waitUntil: 'domcontentloaded' })
await pageB.waitForTimeout(800)
await pageB.locator('nav button').filter({ hasText: '餐厅' }).click()
await pageB.waitForTimeout(400)
report.timelineSync = (await pageB.getByText('明洞土豆汤（同步）', { exact: true }).count()) > 0

// verify API state contents
report.api = await pageA.evaluate(async () => {
  const res = await fetch('/api/state')
  return await res.json()
})

console.log(JSON.stringify(report, null, 2))
await browser.close()
