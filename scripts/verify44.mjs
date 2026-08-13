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

// 23/24 travel pages still fine
report.t23_nav7 = (await page.locator('nav button').count()) === 7
await page.locator('nav button').filter({ hasText: '行程' }).click()
await page.waitForTimeout(500)
report.t24_travelData = (await page.getByText('抵达仁川国际机场 T1', { exact: false }).count()) > 0

// enter daisy
await page.locator('nav button').filter({ hasText: '首页' }).click()
await page.waitForTimeout(300)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)
report.t1_daisyOpens = (await page.getByText('DAISY 代购', { exact: true }).count()) > 0

// customer + name + color + color count
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(300)
report.t4_addCustomer = (await page.locator('input[value="新客户"]').count()) > 0
await page.locator('input[value="新客户"]').fill('小红')
report.t5_rename = (await page.locator('input[value="小红"]').count()) > 0
await page.locator('button[aria-label="蓝色"]').click()
await page.waitForTimeout(200)
report.t6_color = (await page.locator('button[aria-label="蓝色"]').evaluate((el) => el.classList.contains('scale-110'))) === true
report.t7_colors = (await page.locator('button[title]').count()) >= 15

// add product + quantity steps
await page.locator('select').last().selectOption('bb-01')
await page.waitForTimeout(300)
const plus = page.getByText('+', { exact: true }).first()
await plus.click()
await plus.click()
await page.waitForTimeout(300)
report.t8_qty3 = (await page.getByText('3', { exact: true }).count()) > 0
await plus.click()
await page.waitForTimeout(200)
report.t9_no4 = !(await page.locator('body').innerText()).includes('× 4')
await page.getByText('−', { exact: true }).first().click()
await page.waitForTimeout(300)
report.t10_decrease = (await page.getByText('× 2', { exact: false }).count()) > 0

// totals + conversion
let body = await page.locator('body').innerText()
report.t11_krwTotal = body.includes('₩104,000')
report.t12_rmbTotal = body.includes('¥496.08')

// rate change
await page.locator('input[type="number"]').first().fill('4.80')
await page.waitForTimeout(400)
body = await page.locator('body').innerText()
report.t13_rateUpdate = body.includes('¥499.20')

// search + category
await page.locator('input[placeholder="搜索商品..."]').fill('帽子')
await page.waitForTimeout(400)
body = await page.locator('body').innerText()
report.t15_search = body.includes('贴布棒球帽') && !body.includes('20周年纪念版官方应援棒')
await page.locator('input[placeholder="搜索商品..."]').fill('')
await page.waitForTimeout(300)
await page.getByRole('button', { name: '应援棒', exact: true }).click()
await page.waitForTimeout(300)
body = await page.locator('body').innerText()
report.t16_category = body.includes('20周年纪念版官方应援棒') && !body.includes('贴布棒球帽')

// refresh persistence
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)
body = await page.locator('body').innerText()
report.t17_persist = (await page.locator('input[value="小红"]').count()) > 0 && body.includes('¥499.20')

// lan sync state
report.t18_sync = await page.evaluate(async () => {
  const res = await fetch('/api/state')
  const data = await res.json()
  return Boolean(data['seoul-shopping-daisy-v1']?.customers?.length)
})

// wutong isolation
await page.locator('nav button').filter({ hasText: '首页' }).click()
await page.waitForTimeout(300)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('梧桐代购', { exact: true }).click()
await page.waitForTimeout(400)
report.t19_isolation = (await page.locator('input[value="小红"]').count()) === 0

// overflow + broken images
report.t20_overflow = (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0
report.t21_noBroken = await page.evaluate(() => [...document.images].every((img) => img.naturalWidth > 0))
report.t22_noErrors = errors.length === 0

// delete customer
await page.locator('nav button').filter({ hasText: '首页' }).click()
await page.waitForTimeout(300)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(400)
await page.locator('button[aria-label="删除客户"]').click()
await page.waitForTimeout(400)
report.t14_deleteCustomer = (await page.locator('input[value="小红"]').count()) === 0

console.log(JSON.stringify(report, null, 2))
await browser.close()
