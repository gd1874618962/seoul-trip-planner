import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('dialog', (d) => d.accept())

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)

const input = page.locator('input[placeholder="搜索商品..."]')
const before = {
  count: await input.count(),
  hasCap: (await page.locator('body').innerText()).includes('贴布棒球帽'),
}
await input.fill('帽子')
await page.waitForTimeout(500)
const afterFill = {
  value: await input.inputValue(),
  hasCap: (await page.locator('body').innerText()).includes('贴布棒球帽'),
  hasTote: (await page.locator('body').innerText()).includes('托特包'),
}
await input.fill('')
await page.waitForTimeout(300)
await input.pressSequentially('棒球帽')
await page.waitForTimeout(500)
const afterType = {
  value: await input.inputValue(),
  hasCap: (await page.locator('body').innerText()).includes('贴布棒球帽'),
  hasTote: (await page.locator('body').innerText()).includes('托特包'),
}
console.log(JSON.stringify({ before, afterFill, afterType }, null, 2))
await browser.close()
