import { expect, test, type Page } from '@playwright/test'

const cardName = '玉山熊本熊卡'
const activityName = '日本指定商店'

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '我的卡片', exact: true })).toBeVisible()
})

async function addActivity(page: Page, name: string, cap = '500', rate = '6') {
  await page.getByRole('link', { name: '新增活動', exact: true }).click()
  await page.getByLabel('活動名稱').fill(name)
  await page.getByLabel('回饋上限（台幣）').fill(cap)
  await page.getByLabel('加碼百分比（%）').fill(rate)
  await page.getByRole('button', { name: '儲存活動', exact: true }).click()
  await expect(page.getByRole('heading', { name: cardName, exact: true })).toBeVisible()
}

async function setupCard(page: Page) {
  await page.getByRole('link', { name: '新增卡片', exact: true }).click()
  await page.getByLabel('卡片名稱').fill(cardName)
  await page.getByLabel('每月結帳日').selectOption('15')
  await page.getByRole('button', { name: '儲存卡片', exact: true }).click()
  await expect(page.getByRole('heading', { name: cardName, exact: true })).toBeVisible()
  await addActivity(page, activityName)
  await expect(detailAmount(page, activityName)).toContainText('8,333')
}

function detailAmount(page: Page, name = activityName) {
  return page.locator('.activity-panel').filter({ has: page.getByRole('heading', { name, exact: true }) }).locator('.amount')
}

async function openPurchase(page: Page, amount: string, selection?: string) {
  await page.getByRole('link', { name: '新增消費', exact: true }).click()
  await page.getByLabel('消費金額（台幣）', { exact: true }).fill(amount)
  if (selection) await page.getByLabel('適用加碼活動').selectOption({ label: selection })
}

async function savePurchase(page: Page) {
  await page.getByRole('button', { name: '儲存消費', exact: true }).click()
  await expect(page.getByRole('heading', { name: cardName, exact: true })).toBeVisible()
}

test('records a completed purchase and updates detail, home and reopened data', async ({ page }) => {
  await setupCard(page)
  await openPurchase(page, '100')
  await expect(page.getByLabel('消費日期')).toHaveValue('2026-10-29')
  await expect(page.getByLabel('適用加碼活動')).not.toHaveValue('')
  await page.getByLabel('備註').fill('藥妝店')
  await savePurchase(page)
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await expect(page.locator('.purchase-list')).toContainText('藥妝店')
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  const homeCard = page.getByRole('link', { name: `查看 ${cardName}`, exact: true })
  await expect(homeCard.locator('.amount')).toContainText('8,233')
  await page.reload()
  await expect(homeCard.locator('.amount')).toContainText('8,233')
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: '.impeccable/review/desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '.impeccable/review/mobile.png', fullPage: true })
  await homeCard.click()
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await page.screenshot({ path: '.impeccable/review/mobile-detail.png', fullPage: true })
})

test('recalculates edited spending and preserves or deletes records according to confirmation', async ({ page }) => {
  await setupCard(page)
  await openPurchase(page, '100')
  await savePurchase(page)
  await page.getByRole('link', { name: '編輯 2026-10-29 消費', exact: true }).click()
  await page.getByLabel('消費金額（台幣）', { exact: true }).fill('200')
  await page.getByRole('button', { name: '儲存變更', exact: true }).click()
  await expect(detailAmount(page)).toContainText('8,133')
  await expect(page.locator('.purchase-value > strong')).toHaveText('NT$ 200')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '刪除 2026-10-29 消費', exact: true }).click()
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await expect(detailAmount(page)).toContainText('8,133')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除 2026-10-29 消費', exact: true }).click()
  await expect(page.locator('.purchase-list li')).toHaveCount(0)
  await expect(detailAmount(page)).toContainText('8,333')
})

test('requires an explicit choice for multiple activities and leaves unrelated allowances unchanged', async ({ page }) => {
  await setupCard(page)
  await addActivity(page, '網購', '300', '3')
  await openPurchase(page, '100')
  await expect(page.getByLabel('適用加碼活動')).toHaveValue('')
  await page.getByRole('button', { name: '儲存消費', exact: true }).click()
  await expect(page.getByRole('heading', { name: '新增消費', exact: true })).toBeVisible()
  await page.getByLabel('適用加碼活動').selectOption({ label: '日本指定商店 · +6%' })
  await savePurchase(page)
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(detailAmount(page, '網購')).toContainText('10,000')
  await openPurchase(page, '50', '不適用加碼')
  await savePurchase(page)
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(detailAmount(page, '網購')).toContainText('10,000')
  await expect(page.locator('.purchase-list')).toContainText('不適用加碼')
  await openPurchase(page, '500', '網購 · +3%')
  await savePurchase(page)
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(detailAmount(page, '網購')).toContainText('9,500')
  await expect(page.locator('.purchase-list li')).toHaveCount(3)
})

test('moves a purchase to the next period and restores automatic assignment without changing its date', async ({ page }) => {
  await setupCard(page)
  const cardUrl = page.url().split('?')[0]!
  await openPurchase(page, '100')
  await page.getByText('調整所屬期別', { exact: true }).click()
  await page.getByRole('combobox', { name: '所屬期別', exact: true }).selectOption('1')
  await savePurchase(page)
  await expect(page.getByLabel('查看期別')).toHaveValue('2026-12-15')
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(page.locator('.purchase-list')).toContainText('手動歸期')
  await expect(page.locator('.purchase-list')).toContainText('2026/10/29')
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  const homeCard = page.getByRole('link', { name: `查看 ${cardName}`, exact: true })
  await expect(homeCard.locator('.amount')).toContainText('8,333')
  await homeCard.click()
  await page.getByLabel('查看期別').selectOption('2026-12-15')
  await page.getByRole('link', { name: '編輯 2026-10-29 消費', exact: true }).click()
  await page.getByText('調整所屬期別', { exact: true }).click()
  await page.getByRole('combobox', { name: '所屬期別', exact: true }).selectOption('0')
  await page.getByRole('button', { name: '儲存變更', exact: true }).click()
  await expect(page.getByLabel('查看期別')).toHaveValue('2026-11-15')
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(page.locator('.purchase-list')).not.toContainText('手動歸期')
  await expect(page.locator('.purchase-list')).toContainText('2026/10/29')
  await page.goto(`${cardUrl}?period=2026-12-15`)
  await expect(detailAmount(page)).toContainText('8,333')
  await expect(page.locator('.purchase-list li')).toHaveCount(0)
})

test('keeps the full overspending record and shows a textual card-switch reminder', async ({ page }) => {
  await setupCard(page)
  await openPurchase(page, '9000.50')
  await savePurchase(page)
  await expect(detailAmount(page)).toHaveText('NT$ 0')
  await expect(page.getByText('本期加碼已用完，下一筆建議換卡。', { exact: true })).toBeVisible()
  await expect(page.locator('.purchase-value > strong')).toHaveText('NT$ 9,000.5')
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  await expect(page.getByRole('link', { name: `查看 ${cardName}`, exact: true }).locator('.amount')).toHaveText('NT$ 0')
  await expect(page.getByText('已用完，建議換卡', { exact: true })).toBeVisible()
})

test('preserves input on a storage failure and saves exactly one purchase when retried', async ({ page }) => {
  await setupCard(page)
  await openPurchase(page, '100')
  await page.getByLabel('備註').fill('重試後保留')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    let failOnce = true
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === 'transactions' && failOnce) {
        failOnce = false
        throw new DOMException('測試儲存空間不足', 'QuotaExceededError')
      }
      return key === undefined ? original.call(this, value) : original.call(this, value, key)
    }
  })
  await page.getByRole('button', { name: '儲存消費', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('儲存失敗')
  await expect(page.getByLabel('消費金額（台幣）', { exact: true })).toHaveValue('100')
  await expect(page.getByLabel('備註')).toHaveValue('重試後保留')
  await savePurchase(page)
  await expect(detailAmount(page)).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await expect(page.locator('.purchase-list')).toContainText('重試後保留')
})
