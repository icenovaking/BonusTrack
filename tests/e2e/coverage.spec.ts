import { expect, test, type Page } from '@playwright/test'

test.use({ timezoneId: 'Asia/Taipei' })

const cardName = '額度驗證卡'
const japanName = '日本指定商店'
const webName = '網購加碼'

function backup(spentOn = '2026-10-29', withSecondActivity = false) {
  return {
    schemaVersion: 1,
    exportedAt: '2026-10-29T04:00:00.000Z',
    cards: [{ id: 'coverage-card', name: cardName, cycleMode: 'billing-day', closingDay: 15, archived: false }],
    activities: [
      { id: 'coverage-japan', cardId: 'coverage-card', name: japanName, rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false },
      ...(withSecondActivity ? [{ id: 'coverage-web', cardId: 'coverage-card', name: webName, rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: false }] : []),
    ],
    transactions: [{ id: 'coverage-purchase', cardId: 'coverage-card', activityId: 'coverage-japan', spentOn, amountMinor: 10000, note: '必須保留的歷史紀錄', overridePeriodEnd: null }],
  }
}

async function restore(page: Page, data = backup()) {
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'coverage.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByRole('status').filter({ hasText: '備份已還原' })).toBeVisible()
}

function activityPanel(page: Page, name = japanName) {
  return page.locator('.activity-panel').filter({ has: page.getByRole('heading', { name, exact: true }) })
}

test('advancing into a new billing period restores the full allowance while keeping the previous period history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-15T12:00:00+08:00') })
  await restore(page, backup('2026-11-15'))
  await page.goto('/')
  const homeCard = page.getByRole('link', { name: `查看 ${cardName}`, exact: true })
  await expect(homeCard.locator('.amount')).toContainText('8,233')
  await expect(homeCard.locator('.period-caption')).toHaveText('2026/10/16 – 2026/11/15')

  await page.clock.setSystemTime(new Date('2026-11-16T12:00:00+08:00'))
  await page.clock.runFor(30001)
  await expect(homeCard.locator('.amount')).toContainText('8,333')
  await expect(homeCard.locator('.period-caption')).toHaveText('2026/11/16 – 2026/12/15')
  await homeCard.click()
  await expect(page.getByLabel('查看期別')).toHaveValue('2026-12-15')
  await expect(page.locator('.purchase-list li')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '這一期還沒有消費', exact: true })).toBeVisible()
  await page.getByLabel('查看期別').selectOption('2026-11-15')
  await expect(activityPanel(page).locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await expect(page.locator('.purchase-list')).toContainText('2026/11/15')
  await expect(page.locator('.purchase-list')).toContainText('必須保留的歷史紀錄')
  await page.goto('/#/cards/coverage-card?period=2026-11-15')
  await page.reload()
  await expect(activityPanel(page).locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
})

test('archiving an activity removes it from active choices but retains editable and deletable history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  await restore(page, backup('2026-10-29', true))
  await page.goto('/#/cards/coverage-card')
  const panel = activityPanel(page)
  await panel.getByText('管理活動', { exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  await panel.getByRole('button', { name: '封存', exact: true }).click()
  await expect(panel.locator('.rate')).toHaveText('已封存')
  await expect(panel.locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list')).toContainText('必須保留的歷史紀錄')

  await page.getByRole('link', { name: '新增消費', exact: true }).click()
  await expect(page.getByRole('option', { name: /日本指定商店/ })).toHaveCount(0)
  await expect(page.getByRole('option', { name: '網購加碼 · +3%', exact: true })).toHaveCount(1)
  await page.getByRole('link', { name: '返回卡片', exact: true }).click()
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  const homeCard = page.getByRole('link', { name: `查看 ${cardName}`, exact: true })
  await expect(homeCard).toContainText(webName)
  await expect(homeCard).not.toContainText(japanName)
  await homeCard.click()
  await page.getByRole('link', { name: '編輯 2026-10-29 消費', exact: true }).click()
  await expect(page.getByRole('option', { name: '日本指定商店 · +6%（已封存）', exact: true })).toHaveCount(1)
  await page.getByLabel('消費金額（台幣）', { exact: true }).fill('200')
  await expect(page.getByRole('button', { name: '儲存變更', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '儲存變更', exact: true }).click()
  await expect(activityPanel(page).locator('.amount')).toContainText('8,133')
  await expect(page.locator('.purchase-value > strong')).toHaveText('NT$ 200')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除 2026-10-29 消費', exact: true }).click()
  await expect(page.locator('.purchase-list li')).toHaveCount(0)
  await expect(activityPanel(page).locator('.amount')).toContainText('8,333')
  await expect(activityPanel(page, webName).locator('.amount')).toContainText('10,000')
})

test('archived cards leave the active list and remain accessible with their purchase history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  await restore(page)
  await page.goto('/#/cards/coverage-card')
  await page.getByRole('link', { name: '卡片設定', exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '封存卡片', exact: true }).click()
  await expect(page.locator('.detail-heading .lead')).toHaveText('已封存')
  await expect(page.getByRole('link', { name: '新增消費', exact: true })).toHaveCount(0)
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  await expect(page.getByRole('link', { name: `查看 ${cardName}`, exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '查看已封存卡片', exact: true }).click()
  await page.getByRole('link', { name: `查看 ${cardName}`, exact: true }).click()
  await expect(activityPanel(page).locator('.amount')).toContainText('8,233')
  await expect(page.locator('.purchase-list')).toContainText('必須保留的歷史紀錄')
  await page.getByRole('link', { name: '編輯 2026-10-29 消費', exact: true }).click()
  await page.getByLabel('備註').fill('封存卡片的歷史仍可更正')
  await expect(page.getByRole('button', { name: '儲存變更', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '儲存變更', exact: true }).click()
  await expect(page.locator('.purchase-list')).toContainText('封存卡片的歷史仍可更正')
  await expect(activityPanel(page).locator('.amount')).toContainText('8,233')
  await expect(page.getByRole('link', { name: '新增消費', exact: true })).toHaveCount(0)
})

test('first-card and no-activity empty states expose working creation actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
  await expect(page.locator('.credit-card')).toHaveCount(0)
  await page.getByRole('link', { name: '新增卡片', exact: true }).click()
  await expect(page.getByRole('heading', { name: '新增卡片', exact: true })).toBeVisible()
  await page.getByLabel('卡片名稱').fill('從空狀態建立的卡片')
  await page.getByRole('button', { name: '儲存卡片', exact: true }).click()
  await expect(page.getByRole('heading', { name: '從空狀態建立的卡片', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '先加入一個加碼活動', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '新增加碼活動', exact: true }).click()
  await expect(page.getByRole('heading', { name: '新增加碼活動', exact: true })).toBeVisible()
  await page.getByLabel('活動名稱').fill('從空狀態建立的活動')
  await page.getByLabel('回饋上限（台幣）').fill('500')
  await page.getByLabel('加碼百分比（%）').fill('6')
  await page.getByRole('button', { name: '儲存活動', exact: true }).click()
  await expect(activityPanel(page, '從空狀態建立的活動').locator('.amount')).toContainText('8,333')
  await expect(page.getByRole('heading', { name: '先加入一個加碼活動', exact: true })).toHaveCount(0)
})

test('a failed initial database read shows recovery guidance and retry restores existing records without clearing them', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  await restore(page)
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.getAll
    let failed = false
    IDBObjectStore.prototype.getAll = function (...args: Parameters<IDBObjectStore['getAll']>) {
      if (this.name === 'cards' && !failed) {
        failed = true
        throw new DOMException('測試首次讀取失敗', 'UnknownError')
      }
      return original.apply(this, args)
    }
  })
  await page.reload()
  const alert = page.getByRole('alert')
  await expect(alert.getByRole('heading', { name: '暫時無法讀取資料', exact: true })).toBeVisible()
  await expect(alert).toContainText('無法讀取本機資料')
  await expect(alert).toContainText('資料只存在這個瀏覽器，請勿清除網站資料。')
  await expect(alert.getByRole('button', { name: '重新讀取', exact: true })).toBeEnabled()
  await expect(page.locator('.credit-card')).toHaveCount(0)
  await alert.getByRole('button', { name: '重新讀取', exact: true }).click()
  await expect(page.getByRole('heading', { name: '資料與備份', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '暫時無法讀取資料', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: '我的卡片', exact: true }).click()
  await expect(page.getByRole('link', { name: `查看 ${cardName}`, exact: true }).locator('.amount')).toContainText('8,233')
  await page.getByRole('link', { name: `查看 ${cardName}`, exact: true }).click()
  await expect(page.locator('.purchase-list li')).toHaveCount(1)
  await expect(page.locator('.purchase-list')).toContainText('必須保留的歷史紀錄')
  await expect(page.locator('.purchase-value > strong')).toHaveText('NT$ 100')
})
