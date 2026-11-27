import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import { kualaLumpurTrip } from '../src/data/kualaLumpur.js'

const baseUrl = 'http://127.0.0.1:5173'
const outputDir = path.resolve('shots', 'kualaLumpur-2027')
const storageKey = 'seoul-timeline-edits-v1--kuala-lumpur-2027-01'
fs.mkdirSync(outputDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const report = {
  desktop: {},
  mobile: {},
  screenshots: [],
  errors: [],
}

function wirePage(page) {
  page.on('pageerror', (error) => report.errors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())
  return page.route('**/api/state', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: route.request().method() === 'GET' ? '{}' : '{"ok":true}',
    }),
  )
}

async function openPlanner(page, clearStorage = false) {
  await wirePage(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 })
  if (clearStorage) {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 })
  }
  await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
  await page.waitForTimeout(350)
  await page.locator('nav button[aria-label="行程"]').click()
  await page.getByRole('heading', { name: '吉隆坡旅行计划' }).waitFor()
  await page.waitForTimeout(1200)
}

async function dayTitles(page, dayId) {
  return page.evaluate(
    (id) =>
      Array.from(document.querySelectorAll(`[data-drop-day="${id}"] [data-entry-id]`)).map(
        (row) => row.querySelector('p.type-small')?.textContent?.trim() || '',
      ),
    dayId,
  )
}

async function dragByPointer(page, source, target, targetOffset = { x: 60, y: 16 }) {
  await source.scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Drag source or target is not visible')
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(180)
  await page.mouse.move(
    targetBox.x + targetOffset.x,
    targetBox.y + targetOffset.y,
    { steps: 15 },
  )
  await page.waitForTimeout(180)
  await page.mouse.up()
  await page.waitForTimeout(650)
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
await openPlanner(desktop, true)

const expectedLocated = kualaLumpurTrip.points.filter(
  (point) => point.lat != null && point.lng != null,
).length
const expectedUnlocated = kualaLumpurTrip.points.length - expectedLocated
const desktopText = await desktop.locator('main').innerText()
const missingNames = kualaLumpurTrip.points
  .filter(
    (point) =>
      !desktopText.includes(point.displayName || point.name) &&
      !desktopText.includes(point.name),
  )
  .map((point) => point.displayName || point.name)

report.desktop = {
  placeCount: kualaLumpurTrip.points.length,
  expectedLocated,
  expectedUnlocated,
  missingNames,
  countSummary:
    desktopText.includes(`${kualaLumpurTrip.points.length} 个地点`) &&
    desktopText.includes(`${expectedLocated} 个已定位`),
  noHorizontalOverflow: await desktop.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth <= 0,
  ),
  mapMarkers: await desktop.locator('.leaflet-marker-icon').count(),
  loadedTiles: await desktop.locator('img.leaflet-tile-loaded').count(),
}

await desktop
  .waitForFunction(() => document.querySelectorAll('img.leaflet-tile-loaded').length > 0, null, {
    timeout: 15000,
  })
  .catch(() => {})
report.desktop.loadedTiles = await desktop.locator('img.leaflet-tile-loaded').count()

await desktop.screenshot({
  path: path.join(outputDir, 'desktop-itinerary-full.png'),
  fullPage: true,
})
report.screenshots.push('desktop-itinerary-full.png')

await desktop.locator('.leaflet-marker-icon').first().click({ force: true })
await desktop.waitForTimeout(500)
const detailText = await desktop.locator('main').innerText()
report.desktop.markerOpensDetail =
  detailText.includes('所属日期') &&
  (await desktop.locator('.trip-marker-selected').count()) === 1
await desktop.screenshot({
  path: path.join(outputDir, 'desktop-map-list-linkage.png'),
})
report.screenshots.push('desktop-map-list-linkage.png')

await desktop.locator('[data-entry-id="kl-d1-e07"] button').last().click()
await desktop.waitForTimeout(600)
report.desktop.listFocusesMap =
  (await desktop.locator('.trip-marker-selected').count()) === 1 &&
  (await desktop.locator('main').innerText()).includes('双子塔 Petronas Twin Towers')

const reorderSource = desktop.getByRole('button', { name: /拖动 LOVNS Coffee/ })
const reorderTarget = desktop.locator('[data-entry-id="kl-d1-e04"]')
await dragByPointer(desktop, reorderSource, reorderTarget)
const reorderedTitles = await dayTitles(desktop, 1)
report.desktop.sameDayReorder =
  reorderedTitles.indexOf('LOVNS Coffee') >= 0 &&
  reorderedTitles.indexOf('LOVNS Coffee') < reorderedTitles.indexOf('肥肥蟹 Fei Fei Crab')
report.desktop.savedAfterReorder =
  (await desktop.locator('[data-testid="planner-notice"]').innerText()).includes('已调整为')
await desktop.locator('[data-testid="planner-notice"]').scrollIntoViewIfNeeded()
await desktop.screenshot({
  path: path.join(outputDir, 'desktop-after-drag.png'),
})
report.screenshots.push('desktop-after-drag.png')

await desktop.reload({ waitUntil: 'networkidle' })
await desktop.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await desktop.locator('nav button[aria-label="行程"]').click()
await desktop.waitForTimeout(700)
const reloadedTitles = await dayTitles(desktop, 1)
report.desktop.reorderPersistsAfterReload =
  reloadedTitles.indexOf('LOVNS Coffee') < reloadedTitles.indexOf('肥肥蟹 Fei Fei Crab')

const crossDayPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
await openPlanner(crossDayPage, true)
const crossDaySource = crossDayPage.getByRole('button', { name: /拖动 LOVNS Coffee/ })
await crossDaySource.scrollIntoViewIfNeeded()
await crossDayPage.waitForTimeout(300)
const crossDaySourceBox = await crossDaySource.boundingBox()
await crossDayPage.mouse.move(
  crossDaySourceBox.x + crossDaySourceBox.width / 2,
  crossDaySourceBox.y + crossDaySourceBox.height / 2,
)
await crossDayPage.mouse.down()
await crossDayPage.waitForTimeout(150)
for (let index = 0; index < 55; index += 1) {
  await crossDayPage.mouse.move(900, crossDayPage.viewportSize().height - 25)
  await crossDayPage.waitForTimeout(20)
}
const day2Target = crossDayPage
  .locator('[data-drop-day="2"] [data-entry-id]')
  .filter({ hasText: '兴记肉骨茶' })
const day2TargetBox = await day2Target.boundingBox()
await crossDayPage.mouse.move(day2TargetBox.x + 50, day2TargetBox.y + 12, { steps: 12 })
await crossDayPage.waitForTimeout(150)
await crossDayPage.mouse.up()
await crossDayPage.waitForTimeout(700)
const crossDayState = await crossDayPage.evaluate((key) => {
  const state = JSON.parse(localStorage.getItem(key) || '{}')
  return {
    day1: (state['1'] || []).filter((entry) => !entry.__hidden).map((entry) => entry.title),
    day2: (state['2'] || []).filter((entry) => !entry.__hidden).map((entry) => entry.title),
  }
}, storageKey)
report.desktop.crossDayMove =
  crossDayState.day1.includes('LOVNS Coffee') === false &&
  crossDayState.day2.includes('LOVNS Coffee')

await crossDayPage.reload({ waitUntil: 'networkidle' })
await crossDayPage.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await crossDayPage.locator('nav button[aria-label="行程"]').click()
await crossDayPage.waitForTimeout(700)
report.desktop.crossDayPersistsAfterReload = (await dayTitles(crossDayPage, 2)).includes('LOVNS Coffee')

const pendingPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
await openPlanner(pendingPage, true)
await pendingPage.evaluate(() => window.scrollTo(0, 4500))
await pendingPage.waitForTimeout(300)
const pendingSource = pendingPage.getByRole('button', { name: /拖动 品一鲜/ })
const pendingTarget = pendingPage
  .locator('[data-drop-day="4"] [data-entry-id]')
  .filter({ hasText: '17:00 前' })
await dragByPointer(pendingPage, pendingSource, pendingTarget)
const pendingState = await pendingPage.evaluate((key) => {
  const state = JSON.parse(localStorage.getItem(key) || '{}')
  return (state['4'] || []).filter((entry) => !entry.__hidden).map((entry) => entry.title)
}, storageKey)
report.desktop.pendingToDay =
  pendingState.includes('品一鲜 Morrus Seafood') &&
  (await pendingPage.locator('[data-testid="planner-notice"]').innerText()).includes('已加入')
await pendingPage.locator('[data-testid="planner-notice"]').scrollIntoViewIfNeeded()
await pendingPage.screenshot({
  path: path.join(outputDir, 'desktop-pending-added.png'),
})
report.screenshots.push('desktop-pending-added.png')

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
})
await openPlanner(mobile, true)
report.mobile.noHorizontalOverflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth <= 0,
)
report.mobile.titleVisible = (await mobile.locator('main').innerText()).includes('吉隆坡旅行计划')
report.mobile.mapVisible = (await mobile.locator('.leaflet-container').count()) === 1
await mobile.screenshot({
  path: path.join(outputDir, 'mobile-overview.png'),
})
report.screenshots.push('mobile-overview.png')
await mobile.screenshot({
  path: path.join(outputDir, 'mobile-itinerary-full.png'),
  fullPage: true,
})
report.screenshots.push('mobile-itinerary-full.png')
await mobile.locator('[data-drop-day="1"]').scrollIntoViewIfNeeded()
await mobile.waitForTimeout(300)
await mobile.screenshot({
  path: path.join(outputDir, 'mobile-itinerary.png'),
})
report.screenshots.push('mobile-itinerary.png')

report.desktop.noPageErrors = report.errors.length === 0
console.log(JSON.stringify(report, null, 2))
await browser.close()

if (
  report.errors.length ||
  !report.desktop.countSummary ||
  !report.desktop.noHorizontalOverflow ||
  !report.desktop.markerOpensDetail ||
  !report.desktop.listFocusesMap ||
  !report.desktop.sameDayReorder ||
  !report.desktop.savedAfterReorder ||
  !report.desktop.reorderPersistsAfterReload ||
  !report.desktop.crossDayMove ||
  !report.desktop.crossDayPersistsAfterReload ||
  !report.desktop.pendingToDay ||
  !report.mobile.noHorizontalOverflow ||
  !report.mobile.titleVisible ||
  !report.mobile.mapVisible
) {
  process.exitCode = 1
}

