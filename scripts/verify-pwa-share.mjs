import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173'
const shotsDir = path.resolve('shots', 'pwa-share')
fs.mkdirSync(shotsDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    errors.push(`console: ${message.text()}`)
  }
})
page.on('dialog', (dialog) => dialog.accept())

const mainText = () => page.locator('main').innerText()
const noOverflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth <= 0)
const clickTab = async (label) => {
  await page.locator(`nav button[aria-label="${label}"]`).click()
  await page.waitForTimeout(250)
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(900)

const report = {}
const manifest = await page.evaluate(async () => {
  const href = document.querySelector('link[rel="manifest"]')?.href
  if (!href) return null
  const response = await fetch(href)
  return response.ok ? response.json() : null
})
const serviceWorker = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return { supported: false }
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), 6000)),
  ])
  return {
    supported: true,
    controlled: Boolean(navigator.serviceWorker.controller),
    scope: registration?.scope || '',
  }
})
report.pwa = {
  title: await page.title(),
  manifestName: manifest?.name || '',
  manifestDisplay: manifest?.display || '',
  iconCount: manifest?.icons?.length || 0,
  appleCapable:
    (await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content')) ===
    'yes',
  statusBar:
    (await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content')) ||
    '',
  serviceWorker,
}
await page.screenshot({ path: path.join(shotsDir, '01-cities.png'), fullPage: true })

await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await page.waitForTimeout(350)
await clickTab('地图')
await page.waitForTimeout(1000)

const mapReport = await page.evaluate(() => {
  const nav = document.querySelector('.bottom-nav')
  const content = document.querySelector('.app-content')
  const navStyle = nav ? getComputedStyle(nav) : null
  const contentStyle = content ? getComputedStyle(content) : null
  const routeColors = new Set(
    [...document.querySelectorAll('.leaflet-overlay-pane svg path')]
      .map((node) => node.getAttribute('stroke'))
      .filter(Boolean),
  )
  return {
    routeColorCount: routeColors.size,
    routeColors: [...routeColors],
    routeArrowCount: document.querySelectorAll('.trip-route-arrow').length,
    navBackground: navStyle?.backgroundColor || '',
    navPosition: navStyle?.position || '',
    navHeight: nav?.getBoundingClientRect().height || 0,
    contentPaddingBottom: Number.parseFloat(contentStyle?.paddingBottom || '0'),
  }
})
report.map = {
  ...mapReport,
  hasRouteMode: (await mainText()).includes('按日路线'),
  hasLegend: (await mainText()).includes('箭头表示行进方向'),
  noOverflow: await noOverflow(),
}
await page.screenshot({ path: path.join(shotsDir, '02-map-routes.png'), fullPage: true })

await page.getByRole('button', { name: '切换旅行', exact: true }).click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: '创建新的旅行计划' }).click()
await page.waitForTimeout(200)
await page.getByLabel('计划名称').fill('京都秋日散步')
await page.getByLabel('城市（中文）').fill('京都')
await page.getByLabel('城市（英文）').fill('Kyoto')
await page.getByLabel('国家（中文）').fill('日本')
await page.getByLabel('国家（英文）').fill('Japan')
await page.getByLabel('开始日期').fill('2027-10-02')
await page.getByLabel('结束日期').fill('2027-10-04')
await page.getByLabel('旅行主题').fill('寺院 · 咖啡 · 散步')
await page.locator('[role="dialog"] button').filter({ hasText: '首尔' }).first().click()
await page.getByRole('button', { name: '创建并打开' }).click()
await page.waitForTimeout(600)
report.customTrip = {
  opened: (await mainText()).includes('京都'),
  stored: await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem('stp-custom-trips-v1') || '[]')
    return records.some((record) => record.dataset?.tripMeta?.cityCn === '京都')
  }),
  noOverflow: await noOverflow(),
}
await page.screenshot({ path: path.join(shotsDir, '03-custom-trip.png'), fullPage: true })

await page.getByRole('button', { name: '切换旅行', exact: true }).click()
await page.waitForTimeout(200)
const customCardCount = await page.locator('main article').filter({ hasText: '京都' }).count()
report.customTrip.catalogCard = customCardCount > 0
await page.locator('main button').filter({ hasText: '京都' }).first().click()
await page.waitForTimeout(250)

await page.getByRole('button', { name: '分享这份旅行' }).click()
await page.waitForTimeout(1200)
const shareUrl = await page.locator('[role="dialog"] textarea').inputValue()
report.share = {
  hasHash: shareUrl.includes('#share='),
  sizeKb: Math.ceil(shareUrl.length / 1024),
  hasPrivacyNotice: (await page.locator('[role="dialog"]').innerText()).includes('公开访问'),
}
await page.screenshot({ path: path.join(shotsDir, '04-share-sheet.png'), fullPage: true })
report.share.customSizeKb = report.share.sizeKb

await page.getByRole('button', { name: '关闭分享窗口' }).click()
await page.getByRole('button', { name: '切换旅行', exact: true }).click()
await page.waitForTimeout(200)
await page.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await page.waitForTimeout(250)
await page.getByRole('button', { name: '分享这份旅行' }).click()
await page.waitForTimeout(1200)
const kualaLumpurShareUrl = await page.locator('[role="dialog"] textarea').inputValue()
report.share.kualaLumpurSizeKb = Math.ceil(kualaLumpurShareUrl.length / 1024)
await page.getByRole('button', { name: '关闭分享窗口' }).click()

const shared = await context.newPage()
const sharedErrors = []
shared.on('pageerror', (error) => sharedErrors.push(error.message))
shared.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    sharedErrors.push(message.text())
  }
})
await shared.goto(kualaLumpurShareUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await shared.waitForTimeout(1200)
const sharedBody = await shared.locator('body').innerText()
report.sharedView = {
  opened: sharedBody.includes('BIGBANG') && sharedBody.includes('吉隆坡'),
  otherPlanHidden: !sharedBody.includes('首尔'),
  readOnlyNotice: sharedBody.includes('只读链接快照') && sharedBody.includes('任何拿到链接的人都能查看'),
  noBudgetTab: !(await shared.locator('nav button[aria-label="预算"]').count()),
  noLedgerTab: !(await shared.locator('nav button[aria-label="账本"]').count()),
  noEditButton: !(await shared.getByText('编辑旅行资料', { exact: true }).count()),
  noOverflow: await shared.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth <= 0,
  ),
  errors: sharedErrors,
}
await shared.locator('nav button').filter({ hasText: '地图' }).click()
await shared.waitForTimeout(700)
report.sharedView.mapLoaded = (await shared.locator('.leaflet-container').count()) > 0
await shared.screenshot({ path: path.join(shotsDir, '05-shared-map.png'), fullPage: true })
await shared.close()

await context.setOffline(true)
let offlineReloaded = false
try {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(500)
  offlineReloaded = (await page.locator('#root').innerText()).length > 20
} catch {
  offlineReloaded = false
}
await context.setOffline(false)
report.offline = { reloaded: offlineReloaded }

const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 } })
const desktopErrors = []
desktop.on('pageerror', (error) => desktopErrors.push(error.message))
desktop.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    desktopErrors.push(message.text())
  }
})
await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await desktop.waitForTimeout(500)
await desktop.locator('main button').filter({ hasText: '吉隆坡' }).first().click()
await desktop.waitForTimeout(250)
await desktop.locator('nav button[aria-label="地图"]').click()
await desktop.waitForTimeout(900)
report.desktop = {
  noOverflow: await desktop.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth <= 0,
  ),
  mapVisible: (await desktop.locator('.leaflet-container').count()) > 0,
  errors: desktopErrors,
}
await desktop.screenshot({ path: path.join(shotsDir, '06-desktop-map.png'), fullPage: true })
await desktop.close()

const compact = await browser.newPage({
  viewport: { width: 320, height: 740 },
  isMobile: true,
  hasTouch: true,
})
const compactErrors = []
compact.on('pageerror', (error) => compactErrors.push(error.message))
compact.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    compactErrors.push(message.text())
  }
})
await compact.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await compact.waitForTimeout(500)
await compact.getByRole('button', { name: '创建新的旅行计划' }).click()
await compact.waitForTimeout(200)
const compactCreateOpen = (await compact.locator('[role="dialog"]').count()) > 0
const compactCreateNoOverflow = await compact.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth <= 0,
)
await compact.getByRole('button', { name: '关闭创建旅行窗口' }).click()
await compact.goto(shareUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
await compact.waitForTimeout(1600)
const compactSharedText = await compact.locator('body').innerText()
report.compact = {
  createOpen: compactCreateOpen,
  createNoOverflow: compactCreateNoOverflow,
  sharedNoOverflow: await compact.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth <= 0,
  ),
  sharedReadOnly: compactSharedText.includes('只读链接快照'),
  errors: compactErrors,
}
await compact.close()

report.errors = errors
console.log(JSON.stringify(report, null, 2))
await browser.close()
