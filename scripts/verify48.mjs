import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.stack || error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('dialog', (dialog) => dialog.accept())

const report = {}
const bodyHas = (text) => page.waitForFunction(
  (value) => document.body.innerText.includes(value),
  text,
  { timeout: 6000 },
)
const clickTab = async (label) => {
  await page.locator(`nav button[aria-label="${label}"]`).click()
  await page.waitForTimeout(180)
}
const openCity = async (name) => {
  await page.locator('main button').filter({ hasText: name }).first().click()
  await page.waitForTimeout(250)
}
const noOverflow = async () =>
  (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)

report.cityPage = {
  seoul: (await page.locator('body').innerText()).includes('首尔'),
  kuala: (await page.locator('body').innerText()).includes('吉隆坡'),
  addButton: (await page.locator('body').innerText()).includes('新增旅行城市'),
  noOverflow: await noOverflow(),
}

// Seed a Seoul-only local value to prove that KL edits cannot overwrite legacy Seoul storage.
await page.evaluate(() => {
  localStorage.setItem('seoul-trip-edits-v1', JSON.stringify({
    hotels: [{
      night: '8.21',
      name: 'SEOUL TEST HOTEL',
      address: 'SEOUL ORIGINAL ADDRESS',
      locationId: 'loc-seoul-test',
      features: [],
    }],
    flights: { outbound: [], return: [] },
    travelers: [],
  }))
})

await openCity('首尔')
await bodyHas('SEOUL TRIP')
report.seoulPreserved = (await page.locator('body').innerText()).includes('SEOUL TEST HOTEL')

const pages = ['首页', '行程', '地图', '餐厅', '预算', '提醒', '账本']
const pageResults = {}
for (const label of pages) {
  await clickTab(label)
  pageResults[label] = {
    rendered: (await page.locator('main').innerText()).length > 20,
    noOverflow: await noOverflow(),
  }
}
report.seoulPages = pageResults

await clickTab('首页')
await page.getByText('切换城市', { exact: true }).click()
await page.waitForTimeout(200)
await openCity('吉隆坡')
await bodyHas('KUALA LUMPUR')
const klText = await page.locator('body').innerText()
report.kualaLumpurDefaults = {
  flight: klText.includes('MH387'),
  hotel: klText.includes('京华心悦大酒店'),
  concert: klText.includes('BIGBANG演唱会'),
  dates: klText.includes('2027.01.08 - 01.11'),
}

await page.getByText('编辑基础资料（城市/航班/酒店/成员）', { exact: true }).click()
await page.waitForTimeout(250)
const addressField = page.locator('label').filter({ hasText: /^地址/ }).first()
await addressField.locator('input').fill('VERIFY KL HOTEL ADDRESS')
await page.getByText('保存全部修改', { exact: true }).click()
await page.waitForTimeout(350)
report.kualaSaved = (await page.locator('body').innerText()).includes('VERIFY KL HOTEL ADDRESS')

const scopedKeys = await page.evaluate(() => ({
  activeTrip: localStorage.getItem('stp-active-trip'),
  klTrip: localStorage.getItem('seoul-trip-edits-v1--kuala-lumpur-2027-01'),
  seoulTrip: localStorage.getItem('seoul-trip-edits-v1'),
}))
report.storageIsolation = {
  activeTrip: scopedKeys.activeTrip === 'kuala-lumpur-2027-01',
  klHasAddress: scopedKeys.klTrip?.includes('VERIFY KL HOTEL ADDRESS') || false,
  seoulUnchanged: scopedKeys.seoulTrip?.includes('SEOUL TEST HOTEL') || false,
  separateKeys: scopedKeys.klTrip !== scopedKeys.seoulTrip,
}

await page.getByText('切换城市', { exact: true }).click()
await page.waitForTimeout(200)
await openCity('首尔')
await bodyHas('SEOUL TEST HOTEL')
report.switchBackToSeoul = {
  preserved: (await page.locator('body').innerText()).includes('SEOUL TEST HOTEL'),
  klAddressAbsent: !(await page.locator('body').innerText()).includes('VERIFY KL HOTEL ADDRESS'),
}

await page.getByText('切换城市', { exact: true }).click()
await page.waitForTimeout(200)
await openCity('吉隆坡')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)
await openCity('吉隆坡')
await page.waitForTimeout(300)
report.refreshPersistence = (await page.locator('body').innerText()).includes('VERIFY KL HOTEL ADDRESS')

const kualaLumpurPages = {}
for (const label of pages) {
  await clickTab(label)
  kualaLumpurPages[label] = {
    rendered: (await page.locator('main').innerText()).length > 20,
    noOverflow: await noOverflow(),
  }
}
report.kualaLumpurPages = kualaLumpurPages

await clickTab('首页')
await page.getByText('今日行程（当天执行视图）', { exact: true }).click()
await page.waitForTimeout(250)
report.todayUsesActiveTrip =
  (await page.locator('body').innerText()).includes('今日行程')
  && (await page.locator('body').innerText()).includes('10:10')
report.finalNoOverflow = await noOverflow()
report.errors = errors

const desktop = await context.newPage()
await desktop.setViewportSize({ width: 1280, height: 900 })
await desktop.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await desktop.waitForTimeout(600)
report.desktop = {
  noOverflow: await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  cityCardsVisible: (await desktop.locator('body').innerText()).includes('首尔')
    && (await desktop.locator('body').innerText()).includes('吉隆坡'),
}

const cloudContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
await cloudContext.addInitScript(() => {
  localStorage.setItem('stp-active-trip', 'seoul-2026')
  localStorage.setItem('seoul-itinerary-migration', 'v20260811b')
  localStorage.setItem('seoul-supabase-config', JSON.stringify({
    url: 'https://verify.supabase.co',
    anonKey: 'verify-key',
  }))
})
const cloudPage = await cloudContext.newPage()
const cloudErrors = []
const tripWrites = []
const childWrites = []
cloudPage.on('pageerror', (error) => cloudErrors.push(error.message))
cloudPage.on('console', (message) => {
  if (message.type() === 'error') cloudErrors.push(message.text())
})
cloudPage.on('dialog', (dialog) => dialog.accept())
await cloudPage.route('https://verify.supabase.co/rest/v1/**', async (route) => {
  const request = route.request()
  if (request.method() === 'POST') {
    const url = new URL(request.url())
    const payload = request.postDataJSON()
    const rows = Array.isArray(payload) ? payload : [payload]
    if (url.pathname.endsWith('/trips')) tripWrites.push(...rows)
    else childWrites.push(...rows.map((row) => ({ table: url.pathname, ...row })))
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
})
await cloudPage.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await cloudPage.waitForTimeout(350)
await cloudPage.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await cloudPage.waitForTimeout(350)
await cloudPage.getByText('编辑基础资料（城市/航班/酒店/成员）', { exact: true }).click()
await cloudPage.waitForTimeout(250)
await cloudPage.locator('label').filter({ hasText: /^地址/ }).first().locator('input').fill('CLOUD ISOLATION ADDRESS')
await cloudPage.getByText('保存全部修改', { exact: true }).click()
await cloudPage.waitForTimeout(120)
await cloudPage.getByText('切换城市', { exact: true }).click()
await cloudPage.waitForTimeout(120)
await cloudPage.locator('main button').filter({ hasText: '首尔' }).first().click()
await cloudPage.waitForTimeout(2200)
report.cloudSyncIsolation = {
  tripRowUsesKualaTripId: tripWrites.some((row) => row.id === 'kuala-lumpur-2027-01'),
  tripDataUsesScopedKeys: tripWrites.some((row) =>
    Object.keys(row.data || {}).some((key) => key.includes('--kuala-lumpur-2027-01')),
  ),
  childRowsUseKualaTripId: childWrites.length > 0
    && childWrites.every((row) => row.trip_id === 'kuala-lumpur-2027-01'),
  noSeoulCloudWrite: !tripWrites.some((row) => row.id === 'seoul-2026')
    && !childWrites.some((row) => row.trip_id === 'seoul-2026'),
  tripWriteIds: [...new Set(tripWrites.map((row) => row.id))],
  childWriteTrips: [...new Set(childWrites.map((row) => row.trip_id))],
  errors: cloudErrors,
}
await cloudContext.close()

console.log(JSON.stringify(report, null, 2))
await browser.close()
