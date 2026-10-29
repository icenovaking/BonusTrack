import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { Backup } from '../../src/domain/models'

const cardId = 'identity-card'
const activityName = '日本指定商店'

async function importActivities(page: Page, ids: string[]) {
  const backup: Backup = {
    schemaVersion: 1,
    exportedAt: '2026-10-29T04:00:00Z',
    cards: [{ id: cardId, name: '活動識別測試卡', cycleMode: 'billing-day', closingDay: 15, archived: false }],
    activities: ids.map((id, index) => ({
      id, cardId, name: index === 0 ? activityName : '網購加碼', note: '',
      rewardCapMinor: index === 0 ? 50000 : 30000,
      bonusRateBasisPoints: index === 0 ? 600 : 300,
      archived: false,
    })),
    transactions: [],
  }
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({
    name: 'activity-ids.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  })
  await expect(page.getByRole('heading', { name: '備份已通過驗證' })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  await page.goto(`/#/cards/${cardId}`)
}

function allowance(page: Page, name = activityName) {
  return page.locator('.activity-panel').filter({ has: page.getByRole('heading', { name, exact: true }) }).locator('.amount')
}

async function recordPurchase(page: Page, amount: string, label: string, note: string) {
  await page.getByRole('link', { name: '新增消費', exact: true }).click()
  await page.getByLabel('消費金額（台幣）', { exact: true }).fill(amount)
  await page.getByLabel('適用加碼活動').selectOption({ label })
  await page.getByLabel('備註').fill(note)
  await page.getByRole('button', { name: '儲存消費', exact: true }).click()
  await expect(page.getByRole('heading', { name: '活動識別測試卡', exact: true })).toBeVisible()
}

async function exportedBackup(page: Page): Promise<Backup> {
  await page.goto('/#/settings')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '匯出 JSON 備份' }).click()
  const download = await pending
  return JSON.parse(await readFile((await download.path())!, 'utf8')) as Backup
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
})

test('keeps an imported activity named none assigned when adding and editing a purchase', async ({ page }) => {
  await importActivities(page, ['none'])
  await recordPurchase(page, '100', `${activityName} · +6%`, 'selected-none')
  await expect(allowance(page)).toHaveText('NT$ 8,233')
  await expect(page.locator('.purchase-info > strong')).toHaveText(activityName)
  let backup = await exportedBackup(page)
  expect(backup.transactions).toHaveLength(1)
  expect(backup.transactions[0]).toMatchObject({ activityId: 'none', amountMinor: 10000, note: 'selected-none' })

  await page.goto(`/#/cards/${cardId}`)
  await page.getByRole('link', { name: '編輯 2026-10-29 消費', exact: true }).click()
  await expect(page.getByLabel('適用加碼活動').locator('option:checked')).toHaveText(`${activityName} · +6%`)
  await page.getByLabel('消費金額（台幣）', { exact: true }).fill('200')
  await page.getByRole('button', { name: '儲存變更', exact: true }).click()
  await expect(allowance(page)).toHaveText('NT$ 8,133')
  backup = await exportedBackup(page)
  expect(backup.transactions).toHaveLength(1)
  expect(backup.transactions[0]).toMatchObject({ activityId: 'none', amountMinor: 20000, note: 'selected-none' })
})

test('keeps none, regular and explicitly unassigned purchases distinct across multiple activities', async ({ page }) => {
  await importActivities(page, ['none', 'regular'])
  await recordPurchase(page, '100', `${activityName} · +6%`, 'special-id')
  await recordPurchase(page, '50', '不適用加碼', 'unassigned')
  await recordPurchase(page, '300', '網購加碼 · +3%', 'regular-id')
  await expect(allowance(page)).toHaveText('NT$ 8,233')
  await expect(allowance(page, '網購加碼')).toHaveText('NT$ 9,700')
  const backup = await exportedBackup(page)
  expect(backup.transactions).toHaveLength(3)
  expect(backup.transactions.find(purchase => purchase.note === 'special-id')).toMatchObject({ activityId: 'none', amountMinor: 10000 })
  expect(backup.transactions.find(purchase => purchase.note === 'unassigned')).toMatchObject({ activityId: null, amountMinor: 5000 })
  expect(backup.transactions.find(purchase => purchase.note === 'regular-id')).toMatchObject({ activityId: 'regular', amountMinor: 30000 })
})

for (const id of ['null', 'undefined', 'unassigned']) {
  test(`keeps valid imported activity ID ${id} distinct from the unassigned choice`, async ({ page }) => {
    await importActivities(page, [id])
    await recordPurchase(page, '100', `${activityName} · +6%`, 'selected-activity')
    await recordPurchase(page, '50', '不適用加碼', 'unassigned')
    await expect(allowance(page)).toHaveText('NT$ 8,233')
    const backup = await exportedBackup(page)
    expect(backup.transactions).toHaveLength(2)
    expect(backup.transactions.find(purchase => purchase.note === 'selected-activity')).toMatchObject({ activityId: id, amountMinor: 10000 })
    expect(backup.transactions.find(purchase => purchase.note === 'unassigned')).toMatchObject({ activityId: null, amountMinor: 5000 })
  })
}
