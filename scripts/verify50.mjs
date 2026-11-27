import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const baseUrl = 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
page.on('dialog', (dialog) => dialog.accept())
await page.route('**/api/state', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: route.request().method() === 'GET' ? '{}' : '{"ok":true}',
  }),
)

const bodyText = () => page.locator('body').innerText()
const mainText = () => page.locator('main').innerText()
const noOverflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 0)
const expectText = (text, values) =>
  Object.fromEntries(values.map((value) => [value, text.includes(value)]))

await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(700)
await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await page.waitForTimeout(500)

const report = {}
const home = await mainText()
report.home = expectText(home, [
  '四天三晚，完整执行版',
  '3 人',
  'Hotel Royal Signature',
  'MH387',
  '上海浦东机场 T2',
  '02:15',
  '08:00',
  '10:10',
  '19:35',
  'BIGBANG 演唱会',
  'TM Stadium Nasional',
  '14:00',
  '22:00',
  '网红麦当劳薯条斑马线',
  '双子塔',
  '独立广场',
  'Muduera 冰箱贴',
])
report.home.noOverflow = await noOverflow()

await page.locator('nav button[aria-label="行程"]').click()
await page.waitForTimeout(250)
const timeline = {}

const day1 = await mainText()
timeline.day1 = expectText(day1, [
  '08:00',
  'MH387',
  '10:10',
  '10:30',
  '直接开始市区行程，不回酒店',
  '肥肥蟹',
  'Pavilion Elite',
  '麦当劳',
  'LOVNS Coffee',
  '双子塔',
  'Suria KLCC',
  '华阳茶室',
  'De.Wan 1958',
  '21:00',
])

await page.getByRole('button').filter({ hasText: 'DAY 2' }).first().click()
await page.waitForTimeout(200)
const day2 = await mainText()
timeline.day2 = expectText(day2, [
  '酒店早餐',
  '兴记肉骨茶',
  'Hing Kee Bak Kut Teh',
  '甲洞',
  '14:00',
  'BIGBANG 演唱会',
  '22:00',
  'Grab 返回酒店',
  '不专门绕路',
])

await page.getByRole('button').filter({ hasText: 'DAY 3' }).first().click()
await page.waitForTimeout(200)
const day3 = await mainText()
timeline.day3 = expectText(day3, [
  '11:00',
  'Grub by Ahong & Friends',
  'PJ Section 17',
  '十五碑炸香蕉',
  '独立广场',
  '苏丹阿都沙末大厦',
  '中央市场',
  '茨厂街',
  'Muduera 冰箱贴',
  'Bakehouse by KLCG',
  'LOKL Coffee Co',
  'NSK Grocer Quill City Mall',
  'Mamam Place',
  'Talk Crab',
  '22:00',
])
timeline.day3.noOverflow = await noOverflow()

await page.getByRole('button').filter({ hasText: 'DAY 4' }).first().click()
await page.waitForTimeout(200)
const day4 = await mainText()
timeline.day4 = expectText(day4, [
  '11:00',
  '退房',
  '行李寄存在酒店',
  '大府邸',
  'Pavilion Damansara Heights',
  '% Arabica',
  '15:00 - 16:00',
  '17:00 前',
  '海脚人',
  'KLIA2 T2',
  '19:35',
])
timeline.pendingVisible = (await mainText()).includes('待安排地点')
timeline.mapLinked = (await page.locator('.leaflet-marker-icon').count()) > 0
report.timeline = timeline

await page.locator('nav button[aria-label="餐厅"]').click()
await page.waitForTimeout(250)
const food = await mainText()
report.food = expectText(food, [
  '已安排进路线的正餐',
  '肥肥蟹',
  'De.Wan 1958',
  '兴记肉骨茶',
  'Grub by Ahong & Friends',
  'Talk Crab',
  '大府邸',
  '海脚人',
  '品一鲜',
  'Morrus Seafood',
  '名人轩',
  '十五碑炸香蕉',
  'Mamam Place 榴莲蕊',
  'NSK 现开鲜榴莲',
  '华阳茶室及南洋糕点',
  'LOVNS Coffee',
  'Bakehouse by KLCG',
  'LOKL Coffee Co',
  '% Arabica',
  '未排日期 · 待落实',
])
report.food.noOverflow = await noOverflow()

await page.locator('nav button[aria-label="地图"]').click()
await page.waitForTimeout(700)
const map = await mainText()
report.map = expectText(map, [
  '地点图谱',
  '网红麦当劳薯条斑马线',
  '双子塔',
  '独立广场',
  'Muduera 冰箱贴',
  '暂不放置推测坐标',
  '分店 / 地址待确认',
])
report.map.noOverflow = await noOverflow()
await page.getByRole('button', { name: '待核实', exact: true }).click()
await page.waitForTimeout(200)
report.map.pendingFilter = (await mainText()).includes('地点待确认')

await page.locator('nav button[aria-label="提醒"]').click()
await page.waitForTimeout(250)
const reminders = await mainText()
report.reminders = expectText(reminders, [
  '抵达与机场集合',
  'MH387',
  '02:15',
  '10:10',
  '14:00',
  '22:00',
  '约 11:00 退房',
  '17:00 前抵达',
  '19:35',
  '品一鲜 Morrus Seafood',
  '名人轩',
])
report.reminders.noOverflow = await noOverflow()

await page.getByRole('button', { name: '切换旅行', exact: true }).click()
await page.waitForTimeout(200)
await page.locator('main button').filter({ hasText: '首尔' }).first().click()
await page.waitForTimeout(300)
report.seoulRegression = {
  homeRendered: (await mainText()).includes('首尔'),
  noOverflow: await noOverflow(),
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const desktopErrors = []
desktop.on('pageerror', (error) => desktopErrors.push(error.stack || error.message))
desktop.on('dialog', (dialog) => dialog.accept())
await desktop.route('**/api/state', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: route.request().method() === 'GET' ? '{}' : '{"ok":true}',
  }),
)
await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await desktop.waitForTimeout(500)
await desktop.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await desktop.waitForTimeout(350)
await desktop.locator('nav button[aria-label="餐厅"]').click()
await desktop.waitForTimeout(250)
const desktopFood = await desktop.locator('main').innerText()
await desktop.locator('nav button[aria-label="地图"]').click()
await desktop.waitForTimeout(600)
report.desktop = {
  foodCovered: desktopFood.includes('已安排进路线的正餐') && desktopFood.includes('Bakehouse by KLCG'),
  mapRendered: (await desktop.locator('main').innerText()).includes('地点图谱'),
  noOverflow: await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  errors: desktopErrors,
}

const compact = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true })
const compactErrors = []
compact.on('pageerror', (error) => compactErrors.push(error.stack || error.message))
compact.on('dialog', (dialog) => dialog.accept())
await compact.route('**/api/state', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: route.request().method() === 'GET' ? '{}' : '{"ok":true}',
  }),
)
await compact.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await compact.waitForTimeout(500)
await compact.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await compact.waitForTimeout(250)
const compactPages = {}
for (const label of ['首页', '行程', '地图', '餐厅', '提醒']) {
  await compact.locator(`nav button[aria-label="${label}"]`).click()
  await compact.waitForTimeout(180)
  compactPages[label] = await compact.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth <= 0,
  )
}
report.compact = { pages: compactPages, errors: compactErrors }

report.pageErrors = pageErrors
console.log(JSON.stringify(report, null, 2))
await browser.close()
