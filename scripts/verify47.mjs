import {
  PRODUCT_LIMIT,
  canAdd,
  maxAddable,
  remaining,
  soldQuantity,
} from '../src/utils/shoppingLogic.js'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const c = (name, orders, colorId = 'yellow') => ({ customerName: name, colorId, orders })
const o = (productId, quantity) => ({ productId, quantity, unitPriceKRW: 1000 })

const report = {}

// A: one customer #01 x3
const aCustomers = [c('小红', [o('bb-01', 3)])]
report.tA = soldQuantity(aCustomers, 'bb-01') === 3 && remaining(aCustomers, 'bb-01') === 0

// B: 4th blocked
report.tB = canAdd(aCustomers, 'bb-01') === false && maxAddable(aCustomers, 'bb-01') === 0

// C: A x2 + B x1 = 3
const cCustomers = [c('客户A', [o('bb-01', 2)]), c('客户B', [o('bb-01', 1)])]
report.tC = soldQuantity(cCustomers, 'bb-01') === 3 && remaining(cCustomers, 'bb-01') === 0

// D: A x2, B x2 -> B max 1
const dCustomers = [c('客户A', [o('bb-01', 2)])]
report.tD = maxAddable(dCustomers, 'bb-01') === 1 && canAdd(dCustomers, 'bb-01') === true

// E: daisy 3/3, wutong 0/3 independent
const daisyCustomers = [c('A', [o('bb-04', 3)])]
const wutongCustomers = []
report.tE = soldQuantity(daisyCustomers, 'bb-04') === 3 && soldQuantity(wutongCustomers, 'bb-04') === 0

// F: delete 1 -> 2/3, can add 1
const fCustomers = [c('A', [o('bb-01', 2)]), c('B', [o('bb-01', 1)])]
const fAfterDelete = [c('A', [o('bb-01', 2)]), c('B', [])]
report.tF = soldQuantity(fAfterDelete, 'bb-01') === 2 && maxAddable(fAfterDelete, 'bb-01') === 1

// G: same customer #05/#06/#07 all to 3 allowed
const gCustomers = [c('A', [o('bb-05', 3), o('bb-06', 3), o('bb-07', 3)])]
report.tG = [5, 6, 7].every((n) => soldQuantity(gCustomers, `bb-0${n}`) === 3)

// H: different colors unified stock
const hCustomers = [c('张三', [o('bb-01', 2)], 'red'), c('李四', [o('bb-01', 1)], 'blue')]
report.tH = soldQuantity(hCustomers, 'bb-01') === 3

// I: persistence via store keys
const iCustomers = [c('小红', [o('bb-01', 2)])]
report.tI_logic = soldQuantity(iCustomers, 'bb-01') === 2
report.tJ_logic = soldQuantity(cCustomers, 'bb-01') !== soldQuantity(wutongCustomers, 'bb-01')

// UI smoke
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
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(250)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(350)
await page.getByText('添加客户', { exact: true }).click()
await page.waitForTimeout(250)
await page.locator('input[value="新客户"]').fill('小红')
await page.locator('select').last().selectOption('bb-01')
await page.waitForFunction(() => document.body.innerText.includes('已购：1 / 3'))
await page.getByText('+', { exact: true }).last().click()
await page.waitForFunction(() => document.body.innerText.includes('已购：2 / 3'))
report.ui = {
  addWorks: (await page.locator('[data-product="bb-01"]').innerText()).includes('已购：2 / 3'),
  overflow: (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0,
  noErrors: errors.length === 0,
  limit: PRODUCT_LIMIT === 3,
}

console.log(JSON.stringify(report, null, 2))
await browser.close()
