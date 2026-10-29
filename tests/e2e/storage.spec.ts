import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const dataset = {
  schemaVersion: 1, exportedAt: '2026-10-29T04:00:00.000Z',
  cards: [{ id: 'card', name: '玉山熊本熊卡', cycleMode: 'billing-day', closingDay: 15, archived: false }],
  activities: [{ id: 'japan', cardId: 'card', name: '日本指定商店', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false }],
  transactions: [{ id: 'purchase', cardId: 'card', activityId: 'japan', amountMinor: 10000, spentOn: '2026-10-29', note: '旅途第一筆', overridePeriodEnd: null }],
}
async function selectBackup(page: Page, content = JSON.stringify(dataset)) {
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(content) })
}
async function importData(page: Page) {
  await selectBackup(page)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByRole('status').filter({ hasText: '備份已還原' })).toBeVisible()
}
test.beforeEach(async ({ page }) => { await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') }) })

test('backup export restores complete data, repeated import replaces and invalid import preserves records', async ({ page }) => {
  await importData(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '匯出 JSON 備份' }).click()
  const download = await downloadPromise
  const restored = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(restored.cards).toEqual(dataset.cards)
  expect(restored.activities).toEqual(dataset.activities.map(activity => ({ ...activity, note: '' })))
  expect(restored.transactions).toEqual(dataset.transactions)
  await importData(page)
  await selectBackup(page, '{invalid')
  await expect(page.getByRole('alert')).toContainText('無法讀取 JSON')
  await page.goto('/#/cards/card')
  await expect(page.locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
})

test('cancelled backup replacement leaves the existing cards and amounts unchanged', async ({ page }) => {
  await importData(page)
  const empty = { schemaVersion: 1, exportedAt: dataset.exportedAt, cards: [], activities: [], transactions: [] }
  await selectBackup(page, JSON.stringify(empty))
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await page.goto('/#/cards/card')
  await expect(page.locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
})

test('storage write failure keeps purchase input, old allowance and permits retry without duplicates', async ({ page }) => {
  await importData(page)
  await page.goto('/#/cards/card/purchases/new')
  await page.getByRole('textbox', { name: '消費金額（台幣）', exact: true }).fill('100')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'transactions') { IDBObjectStore.prototype.put = original; throw new DOMException('測試儲存失敗', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await page.getByRole('button', { name: '儲存消費' }).click()
  await expect(page.getByRole('alert')).toContainText('儲存失敗')
  await expect(page.getByRole('textbox', { name: '消費金額（台幣）', exact: true })).toHaveValue('100')
  await page.getByRole('button', { name: '儲存消費' }).click()
  await expect(page.locator('.amount')).toContainText('8,133')
  await expect(page.locator('.purchase-list li')).toHaveCount(2)
})

test('cached application reopens offline at a card route and persists local changes and backups', async ({ page, context }) => {
  await importData(page)
  await expect(page.getByText('已可離線使用', { exact: true })).toBeVisible()
  await page.goto('/#/cards/card')
  await expect(page.locator('.amount')).toContainText('8,233')
  await context.setOffline(true)
  await page.close()
  const offlinePage = await context.newPage()
  await offlinePage.goto('/#/cards/card')
  await expect(offlinePage.locator('.amount')).toContainText('8,233')
  await offlinePage.getByRole('link', { name: '新增消費', exact: true }).click()
  await offlinePage.getByRole('textbox', { name: '消費金額（台幣）', exact: true }).fill('100')
  await offlinePage.getByRole('button', { name: '儲存消費' }).click()
  await expect(offlinePage.locator('.amount')).toContainText('8,133')
  await offlinePage.reload()
  await expect(offlinePage.locator('.amount')).toContainText('8,133')
  await offlinePage.goto('/#/settings')
  const downloadPromise = offlinePage.waitForEvent('download')
  await offlinePage.getByRole('button', { name: '匯出 JSON 備份' }).click()
  const download = await downloadPromise
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(backup.transactions).toHaveLength(2)
  await offlinePage.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'offline.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) })
  offlinePage.once('dialog', dialog => dialog.accept())
  await offlinePage.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(offlinePage.getByRole('status').filter({ hasText: '備份已還原' })).toBeVisible()
  await context.setOffline(false)
})

test('failed initial service-worker registration never advertises offline readiness', async ({ page }) => {
  await page.addInitScript(() => { ServiceWorkerContainer.prototype.register = async () => { throw new Error('Simulated registration failure') } })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '我的卡片' })).toBeVisible()
  await expect(page.getByText('離線準備未完成，請連線重試', { exact: true })).toBeVisible()
  await expect(page.getByText('已可離線使用', { exact: true })).toHaveCount(0)
})
