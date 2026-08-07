import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const contextA = await browser.newContext({ viewport: { width: 390, height: 844 } })
const pageA = await contextA.newPage()
const contextB = await browser.newContext({ viewport: { width: 390, height: 844 } })
const pageB = await contextB.newPage()

await pageA.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' })
await pageB.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' })
await pageA.waitForTimeout(700)
await pageB.waitForTimeout(700)

// B stays open on budget page
await pageB.locator('nav button').filter({ hasText: '预算' }).click()
await pageB.waitForTimeout(400)

// A changes food budget 500 -> 600 via UI
await pageA.locator('nav button').filter({ hasText: '预算' }).click()
await pageA.waitForTimeout(400)
await pageA.getByText('编辑预算', { exact: true }).click()
await pageA.waitForTimeout(300)
await pageA.locator('input[value="500"]').fill('600')
await pageA.getByText('完成编辑', { exact: true }).click()

// wait for poll (5s interval)
await pageB.waitForTimeout(6500)
const visible = await pageB.getByText('600', { exact: false }).count()
console.log(JSON.stringify({ pollSync: visible > 0 }, null, 2))
await browser.close()
