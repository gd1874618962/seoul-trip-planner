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
const waitBody = async (text) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), text, { timeout: 6000 })

async function openOwner(label) {
  await page.locator('nav button').filter({ hasText: '首页' }).click()
  await page.waitForTimeout(250)
  await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
  await page.waitForTimeout(250)
  await page.getByText(label, { exact: true }).click()
  await page.waitForTimeout(350)
}

async function addCustomer(name) {
  await page.getByText('添加客户', { exact: true }).click()
  await page.waitForTimeout(250)
  await page.locator('input[value="新客户"]').last().fill(name)
}

async function buyTo3(productId) {
  await page.locator('select').last().selectOption(productId)
  await waitBody('× 1')
  for (let i = 1; i < 3; i++) {
    await page.getByText('+', { exact: true }).last().click()
    await waitBody(`× ${i + 1}`)
  }
}

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(250)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(350)

// A/B: one customer #02 x3, 4th blocked
await addCustomer('小红')
await page.locator('button[aria-label="蓝色"]').last().click()
await buyTo3('bb-02')
await waitBody('已购：3 / 3')
let card = await page.locator('[data-product="bb-02"]').innerText()
report.tA_singleTo3 = card.includes('已售罄') && card.includes('已购：3 / 3')
report.tB_fourthBlocked =
  (await page.getByText('+', { exact: true }).last().isDisabled()) === true

// C: c1 #01 x2 + c2 #01 x1 = 3
await addCustomer('Amy')
await page.locator('select').first().selectOption('bb-01')
await waitBody('× 1')
await page.getByText('+', { exact: true }).first().click()
await waitBody('已购：2 / 3')
// add 1 for Amy via select (new row) -> total 3
await page.locator('select').last().selectOption('bb-01')
await waitBody('已购：3 / 3')
card = await page.locator('[data-product="bb-01"]').innerText()
report.tC_total3 = card.includes('已购：3 / 3') && card.includes('小红') && card.includes('Amy')

// D: Amy #03 x2, 小红 can add only 1
await page.locator('select').last().selectOption('bb-03')
await waitBody('× 1')
await page.getByText('+', { exact: true }).last().click()
await waitBody('已购：2 / 3')
await page.locator('select').first().selectOption('bb-03')
await waitBody('已购：3 / 3')
await page.locator('select').first().selectOption('bb-03')
await page.waitForTimeout(400)
const cardD = await page.locator('[data-product="bb-03"]').innerText()
report.tD_max1 = cardD.includes('已购：3 / 3') && !cardD.includes('已购：4')

// F: remove 1 from Amy's #01 -> 2/3, then readd
const amyCard = page.locator('div').filter({ has: page.locator('input[value="Amy"]') }).last()
await amyCard.getByText('−', { exact: true }).first().click()
await waitBody('已购：2 / 3')
report.tF_restore = (await page.locator('[data-product="bb-01"]').innerText()).includes('已购：2 / 3')
await page.locator('select').last().selectOption('bb-01')
await waitBody('已购：3 / 3')
report.tF_readd = (await page.locator('[data-product="bb-01"]').innerText()).includes('已购：3 / 3')

// G: same customer #05/#06/#07 all to 3
await buyTo3('bb-05')
await buyTo3('bb-06')
await buyTo3('bb-07')
const gTexts = [
  await page.locator('[data-product="bb-05"]').innerText(),
  await page.locator('[data-product="bb-06"]').innerText(),
  await page.locator('[data-product="bb-07"]').innerText(),
]
report.tG_allAllowed = gTexts.every((t) => t.includes('已购：3 / 3'))

// H: different colors unified stock (bb-01 card shows both names)
report.tH_colorUnified = card.includes('已购：3 / 3') && card.includes('小红') && card.includes('Amy')

// I: refresh persistence
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)
await page.getByText('韩国代购（DAISY / 梧桐）', { exact: true }).click()
await page.waitForTimeout(250)
await page.getByText('DAISY 代购', { exact: true }).click()
await page.waitForTimeout(350)
await waitBody('已购：3 / 3')
report.tI_persist = (await page.locator('input[value="小红"]').count()) > 0

// E/J: DAISY #04 3/3, 梧桐 #04 0/3 independent
await page.locator('select').last().selectOption('bb-04')
await waitBody('已购：3 / 3')
await openOwner('梧桐代购')
const wutongCard = await page.locator('[data-product="bb-04"]').innerText()
report.tE_wutongStart = wutongCard.includes('已购：0 / 3') && !wutongCard.includes('已售罄')
await addCustomer('梧桐客户')
await buyTo3('bb-04')
report.tE_wutongBuy3 = (await page.locator('[data-product="bb-04"]').innerText()).includes('已购：3 / 3')
report.tJ_keysIsolated = await page.evaluate(() => {
  const d = localStorage.getItem('seoul-shopping-daisy-v1')
  const w = localStorage.getItem('seoul-shopping-wutong-v1')
  return Boolean(d && w && d !== w)
})

report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
