import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
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
  { timeout: 7000 },
)
const noOverflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 0)

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(700)
await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await page.waitForTimeout(350)

await bodyHas('Hotel Royal Signature')
const homeText = await page.locator('main').innerText()
report.home = {
  threeTravelers: homeText.includes('3人'),
  outboundFlight: homeText.includes('MH387'),
  thirdArrival: homeText.includes('10:10'),
  returnTime: homeText.includes('19:35'),
  hotelAddress: homeText.includes('55100 Kuala Lumpur'),
  concert: homeText.includes('BIGBANG演唱会'),
}

await page.locator('nav button[aria-label="餐厅"]').click()
await page.waitForTimeout(250)
const restaurantText = await page.locator('main').innerText()
report.keyRestaurants = {
  page: restaurantText.includes('重点餐厅'),
  count: ['肥肥蟹', 'De.Wan 1958', '大府邸', 'Grub by ahong&friends', '兴记肉骨茶', 'Talk Crab']
    .every((name) => restaurantText.includes(name)),
  branchWarning: restaurantText.includes('优先确认分店'),
  noOverflow: await noOverflow(),
}

await page.locator('nav button[aria-label="地图"]').click()
await page.waitForTimeout(700)
await bodyHas('地点图谱')
report.placeMap = {
  title: (await page.locator('main').innerText()).includes('先看位置，再定路线'),
  mappedPinsAtLeastTen: (await page.locator('.trip-marker').count()) >= 10,
  pendingNotice: (await page.locator('main').innerText()).includes('暂不放置推测坐标'),
  noOverflow: await noOverflow(),
}

await page.getByText('重点正餐', { exact: true }).first().click()
await page.waitForTimeout(250)
const keyFilterText = await page.locator('main').innerText()
report.keyFilter = {
  feiFei: keyFilterText.includes('肥肥蟹'),
  deWan: keyFilterText.includes('De.Wan 1958'),
  talkCrab: keyFilterText.includes('Talk Crab'),
  branchLabels: (keyFilterText.match(/分店 \/ 地址待确认/g) || []).length >= 3,
  noOverflow: await noOverflow(),
}

await page.getByText('全部', { exact: true }).first().click()
await page.waitForTimeout(250)
await page.getByText('甲洞 / Kepong', { exact: true }).first().click()
await page.waitForTimeout(250)
const kepongText = await page.locator('main').innerText()
report.areaFilter = {
  hingKee: kepongText.includes('兴记肉骨茶'),
  talkCrab: kepongText.includes('Talk Crab'),
  aMei: kepongText.includes('阿妹河婆擂茶'),
}

await page.getByText('全部区域', { exact: true }).click()
await page.getByText('全部', { exact: true }).first().click()
await page.waitForTimeout(200)
const pavilionCard = page
  .getByRole('heading', { name: 'Pavilion Elite', exact: true })
  .locator('xpath=ancestor::article')
await pavilionCard.locator('button').first().click()
await page.waitForTimeout(650)
report.mapLink = {
  selectedMarker: (await page.locator('.trip-marker-selected').count()) === 1,
  addressVisible: (await pavilionCard.innerText()).includes('Pavilion Connection'),
}

await pavilionCard.getByText('收藏', { exact: true }).click()
await page.waitForTimeout(250)
const favorites = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('seoul-place-favorites-v1--kuala-lumpur-2027-01') || '{}').ids || [],
)
report.favorite = {
  saved: favorites.includes('kl-pavilion-elite'),
  buttonChanged: (await pavilionCard.innerText()).includes('已收藏'),
}

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)
await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await page.waitForTimeout(250)
await page.locator('nav button[aria-label="地图"]').click()
await page.waitForTimeout(600)
const reloadedPavilionCard = page
  .getByRole('heading', { name: 'Pavilion Elite', exact: true })
  .locator('xpath=ancestor::article')
await reloadedPavilionCard.locator('button').first().click()
await page.waitForTimeout(250)
report.favorite.afterReload = (await reloadedPavilionCard.innerText()).includes('已收藏')

await page.locator('nav button[aria-label="行程"]').click()
await page.waitForTimeout(250)
const day1Text = await page.locator('main').innerText()
await page.getByRole('button').filter({ hasText: 'DAY 2' }).first().click()
await page.waitForTimeout(250)
const day2Text = await page.locator('main').innerText()
await page.getByRole('button').filter({ hasText: 'DAY 4' }).first().click()
await page.waitForTimeout(250)
const day4Text = await page.locator('main').innerText()
report.timeline = {
  arrival: day1Text.includes('第三位同行者抵达'),
  afternoon: day1Text.includes('武吉免登 / Pavilion 周边自由游览'),
  concert: day2Text.includes('BIGBANG 演唱会入场'),
  airportMeal: day4Text.includes('海脚人 KLIA2 T2 店'),
}

const pageResults = {}
for (const label of ['首页', '行程', '地图', '餐厅', '预算', '提醒', '账本']) {
  await page.locator(`nav button[aria-label="${label}"]`).click()
  await page.waitForTimeout(180)
  pageResults[label] = {
    rendered: (await page.locator('main').innerText()).length > 20,
    noOverflow: await noOverflow(),
  }
}
report.allPages = pageResults

await page.getByRole('button', { name: '切换旅行', exact: true }).click()
await page.waitForTimeout(200)
await page.locator('main button').filter({ hasText: '首尔' }).first().click()
await page.waitForTimeout(250)
await page.locator('nav button[aria-label="地图"]').click()
await page.waitForTimeout(400)
report.seoulRegression = {
  originalMap: (await page.locator('main').innerText()).includes('地图点位'),
  noOverflow: await noOverflow(),
}

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await desktop.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await desktop.waitForTimeout(400)
await desktop.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await desktop.waitForTimeout(300)
await desktop.locator('nav button[aria-label="地图"]').click()
await desktop.waitForTimeout(600)
report.desktop = {
  noOverflow: await desktop.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  placeIndex: (await desktop.locator('main').innerText()).includes('地点图谱'),
}

report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
