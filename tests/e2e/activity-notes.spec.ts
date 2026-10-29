import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const note = '需先登錄\n限實體刷卡'
const backup = () => ({
  schemaVersion: 1, exportedAt: '2026-10-29T04:00:00Z',
  cards: [{ id: 'notes-card', name: '備註測試卡', cycleMode: 'calendar-month', closingDay: null, archived: false }],
  activities: [
    { id: 'japan', cardId: 'notes-card', name: '日本指定商店', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false, note },
    { id: 'web', cardId: 'notes-card', name: '網購', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: false, note: '' },
    { id: 'archived', cardId: 'notes-card', name: '舊活動', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: true, note: '歷史提醒' },
  ],
  transactions: [{ id: 'spent', cardId: 'notes-card', activityId: 'japan', spentOn: '2026-10-29', amountMinor: 10000, note: '消費備註', overridePeriodEnd: null }],
})
const expectedActivities = () => backup().activities.sort((a, b) => a.id.localeCompare(b.id))
async function selectBackup(page: Page, data: unknown) {
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
}
async function restore(page: Page, data: unknown = backup()) {
  await selectBackup(page, data)
  await expect(page.getByRole('heading', { name: '備份已通過驗證' })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByRole('status').filter({ hasText: '備份已還原' })).toBeVisible()
}
async function home(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('link', { name: '查看 備註測試卡', exact: true })).toBeVisible()
}
async function edit(page: Page, id = 'japan') {
  await page.goto(`/#/cards/notes-card/activities/${id}/edit`)
  await expect(page.getByRole('heading', { name: '編輯加碼活動' })).toBeVisible()
}
async function save(page: Page) {
  await page.getByRole('button', { name: '儲存活動', exact: true }).click()
  await expect(page.getByRole('heading', { name: '備註測試卡', exact: true })).toBeVisible()
}
const japanRow = (page: Page) => page.locator('.allowance-row').filter({ has: page.getByText('日本指定商店', { exact: true }) })
async function exportData(page: Page) {
  await page.goto('/#/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '匯出 JSON 備份' }).click()
  return JSON.parse(await readFile((await (await download).path())!, 'utf8'))
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
})

test('creates an independent multiline activity note and shows it on home after reopening', async ({ page }) => {
  await restore(page)
  await page.goto('/#/cards/notes-card/activities/new')
  await page.getByLabel('活動名稱').fill('交通')
  await page.getByLabel('備註（選填）', { exact: true }).fill('需先登錄，限實體刷卡\n月底截止')
  await page.getByLabel('回饋上限（台幣）').fill('100')
  await page.getByLabel('加碼百分比（%）').fill('2')
  await save(page)
  await home(page)
  const traffic = page.locator('.allowance-row').filter({ has: page.getByText('交通', { exact: true }) })
  await expect(traffic.locator('.activity-note')).toHaveText('需先登錄，限實體刷卡\n月底截止')
  await expect(japanRow(page).locator('.activity-note')).toHaveText(note)
  await expect(page.locator('.allowance-row').filter({ has: page.getByText('網購', { exact: true }) }).locator('.activity-note')).toHaveCount(0)
  await expect(page.locator('.activity-note')).toHaveCount(2)
  await page.reload()
  await expect(traffic.locator('.activity-note')).toHaveText('需先登錄，限實體刷卡\n月底截止')
  await expect(page.getByRole('link', { name: '查看 備註測試卡', exact: true })).toHaveAccessibleDescription(/交通，備註：需先登錄，限實體刷卡 月底截止/)
})

test('edits and clears a note despite locked financial rules without changing purchases or allowance', async ({ page }) => {
  await restore(page)
  await edit(page)
  await expect(page.getByLabel('備註（選填）', { exact: true })).toHaveValue(note)
  await expect(page.getByLabel('回饋上限（台幣）')).toBeDisabled()
  await expect(page.getByLabel('加碼百分比（%）')).toBeDisabled()
  await page.getByLabel('備註（選填）', { exact: true }).fill('已登錄')
  await save(page)
  await home(page)
  await expect(japanRow(page).locator('.activity-note')).toHaveText('已登錄')
  await expect(japanRow(page).locator('.amount')).toHaveText('NT$ 8,233')
  const exported = await exportData(page)
  expect(exported.transactions).toEqual(backup().transactions)
  expect(exported.activities.find((value: { id: string }) => value.id === 'japan')).toEqual({ ...backup().activities[0], note: '已登錄' })
  for (const blank of [' \n\t ', '']) {
    await edit(page)
    await page.getByLabel('備註（選填）', { exact: true }).fill(blank)
    await save(page)
    await home(page)
    await expect(japanRow(page).locator('.activity-note')).toHaveCount(0)
    await expect(japanRow(page).locator('.amount')).toHaveText('NT$ 8,233')
  }
})

test('retains input and committed notes when a write fails and saves on retry', async ({ page }) => {
  await restore(page)
  await edit(page)
  await page.getByLabel('備註（選填）', { exact: true }).fill('已登錄')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'activities') {
        IDBObjectStore.prototype.put = original
        throw new DOMException('測試儲存失敗', 'QuotaExceededError')
      }
      return original.apply(this, args)
    }
  })
  await page.getByRole('button', { name: '儲存活動', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('儲存失敗')
  await expect(page.getByLabel('備註（選填）', { exact: true })).toHaveValue('已登錄')
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bonus-track', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const record = await new Promise<{ note: string }>((resolve, reject) => {
      const request = db.transaction('activities').objectStore('activities').get('japan')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return record
  })
  expect(stored.note).toBe(note)
  await save(page)
  await home(page)
  await expect(japanRow(page).locator('.activity-note')).toHaveText('已登錄')
  await expect(japanRow(page).locator('.amount')).toHaveText('NT$ 8,233')
})

test('renders literal notes, wraps long text and keeps keyboard and accessible descriptions usable', async ({ page }, testInfo) => {
  const data = backup()
  const longNote = `${note}\n<b>提醒</b>\n${'LongReminder'.repeat(25)}`
  data.activities[0]!.note = longNote
  await restore(page, data)
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await home(page)
    await expect(japanRow(page).locator('.activity-note')).toHaveText(longNote)
    await expect(japanRow(page).locator('.activity-note b')).toHaveCount(0)
    const link = page.getByRole('link', { name: '查看 備註測試卡', exact: true })
    await expect(link).toHaveAccessibleDescription(/日本指定商店，備註：需先登錄 限實體刷卡/)
    for (const scale of [100, 200]) {
      await page.evaluate(value => { document.documentElement.style.fontSize = `${16 * value / 100}px` }, scale)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const text = japanRow(page).locator('.activity-note')
      expect(await text.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true })
    await edit(page)
    const field = page.getByLabel('備註（選填）', { exact: true })
    await expect(field).toHaveAccessibleDescription('會顯示在首頁此活動下方')
    await page.getByLabel('活動名稱').focus()
    await page.keyboard.press('Tab')
    await expect(field).toBeFocused()
    expect(await field.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid')
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
    await page.screenshot({ path: testInfo.outputPath(`form-${width}.png`), fullPage: true })
  }
})

test('round trips active and archived notes through backup and repeated replacement', async ({ page }) => {
  await restore(page)
  const exported = await exportData(page)
  expect(exported.schemaVersion).toBe(1)
  expect(exported.activities).toEqual(expectedActivities())
  expect(exported.transactions).toEqual(backup().transactions)
  await restore(page, { ...backup(), cards: [], activities: [], transactions: [] })
  await restore(page, exported)
  await restore(page, exported)
  const restored = await exportData(page)
  expect(restored.activities).toEqual(exported.activities)
  expect(restored.transactions).toEqual(exported.transactions)
  await home(page)
  await expect(japanRow(page).locator('.activity-note')).toHaveText(note)
  await expect(japanRow(page).locator('.amount')).toHaveText('NT$ 8,233')
  await expect(page.locator('.activity-note')).toHaveCount(1)
})

test('canceled and failed backup replacements preserve prior notes and complete data', async ({ page }) => {
  await restore(page)
  const replacement = backup()
  replacement.activities[0]!.note = '新的提醒'
  await selectBackup(page, replacement)
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  expect((await exportData(page)).activities).toEqual(expectedActivities())
  await selectBackup(page, replacement)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'activities') {
        IDBObjectStore.prototype.put = original
        throw new DOMException('測試還原失敗', 'QuotaExceededError')
      }
      return original.apply(this, args)
    }
  })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByRole('alert')).toContainText('原資料未變更')
  const exported = await exportData(page)
  expect(exported.cards).toEqual(backup().cards)
  expect(exported.activities).toEqual(expectedActivities())
  expect(exported.transactions).toEqual(backup().transactions)
  await home(page)
  await expect(japanRow(page).locator('.activity-note')).toHaveText(note)
})

test('rejects all present invalid note types without altering saved records', async ({ page }) => {
  await restore(page)
  for (const invalid of [null, 12, true, [], {}]) {
    const malformed = backup()
    ;(malformed.activities[0] as unknown as { note: unknown }).note = invalid
    await selectBackup(page, malformed)
    await expect(page.getByRole('alert')).toContainText('活動備註')
    await expect(page.getByRole('button', { name: '確認取代全部資料' })).toHaveCount(0)
  }
  const exported = await exportData(page)
  expect(exported.cards).toEqual(backup().cards)
  expect(exported.activities).toEqual(expectedActivities())
  expect(exported.transactions).toEqual(backup().transactions)
})
