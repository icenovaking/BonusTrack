import { expect, test, type Page } from '@playwright/test'
import type { Dataset } from '../../src/domain/models'

const card = { id: 'settings-card', name: '旅遊卡', cycleMode: 'billing-day' as const, closingDay: 15, archived: false }

function dataset(archived = false, history = true): Dataset {
  return {
    cards: [{ ...card, archived }, { ...card, id: 'other-card', name: '日常卡' }],
    activities: [
      { id: 'offer', cardId: card.id, name: '旅遊加碼', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false, note: '' },
      { id: 'old-offer', cardId: card.id, name: '舊活動', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: true, note: '' },
      { id: 'other-offer', cardId: 'other-card', name: '日常加碼', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: false, note: '' },
    ],
    transactions: history ? [{ id: 'purchase', cardId: card.id, activityId: 'offer', amountMinor: 10000, spentOn: '2026-09-20', note: '上期消費', overridePeriodEnd: null }] : [],
  }
}

async function restore(page: Page, data = dataset()) {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00+08:00') })
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({
    name: 'card-settings.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...data, schemaVersion: 1, exportedAt: '2026-11-03T00:00:00Z' })),
  })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  await page.goto(`/#/cards/${card.id}/edit`)
  await expect(page.getByRole('heading', { name: '卡片設定', exact: true })).toBeVisible()
}

async function stored(page: Page): Promise<Dataset> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bonus-track')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      const tx = db.transaction(['cards', 'activities', 'transactions'], 'readonly')
      const read = <K extends keyof Dataset>(name: K) => new Promise<Dataset[K]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const [cards, activities, transactions] = await Promise.all([read('cards'), read('activities'), read('transactions')])
      return { cards, activities, transactions }
    } finally { db.close() }
  })
}

async function expectStored(page: Page, expected: Dataset) {
  const actual = await stored(page)
  for (const key of ['cards', 'activities', 'transactions'] as const) {
    expect([...actual[key]].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...expected[key]].sort((a, b) => a.id.localeCompare(b.id)))
  }
}

test('settings keeps the edit form and separates card management', async ({ page }) => {
  await restore(page)
  await expect(page.getByLabel('卡片名稱')).toHaveValue('旅遊卡')
  const management = page.getByRole('region', { name: '卡片管理', exact: true })
  await expect(management).toBeVisible()
  expect(await management.evaluate(element => element.closest('form') === null)).toBe(true)
  await expect(page.getByLabel('每月結帳日')).toBeDisabled()
  await expect(page.getByLabel('日曆月', { exact: false })).toBeDisabled()
})

test('card details provide one settings entry and retain activity management', async ({ page }) => {
  await restore(page)
  await page.goto(`/#/cards/${card.id}`)
  await expect(page.getByText('管理這張卡片', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /封存卡片|恢復使用卡片|刪除卡片/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '新增消費', exact: true })).toBeVisible()
  const activity = page.locator('.activity-panel').filter({ has: page.getByRole('heading', { name: '旅遊加碼', exact: true }) })
  await activity.getByText('管理活動', { exact: true }).click()
  await expect(activity.getByRole('link', { name: '編輯', exact: true })).toBeVisible()
  await expect(activity.getByRole('button', { name: '封存', exact: true })).toBeVisible()
  const entry = page.getByRole('link', { name: '卡片設定', exact: true })
  await expect(entry).toHaveCount(1)
  await expect(entry).toHaveAttribute('href', `#/cards/${card.id}/edit`)
  await entry.click()
  await expect(page.getByRole('heading', { name: '卡片設定', exact: true })).toBeVisible()
})

for (const archived of [false, true]) {
  test(`explicit save preserves cycle, history and archived=${archived}`, async ({ page }) => {
    const before = dataset(archived)
    await restore(page, before)
    await page.getByLabel('卡片名稱').fill('已更新名稱')
    await page.getByRole('button', { name: '儲存卡片', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
    await page.reload()
    await expectStored(page, { ...before, cards: [{ ...before.cards[0]!, name: '已更新名稱' }, before.cards[1]!] })
  })
}

test('new cards keep creation without management controls', async ({ page }) => {
  await page.goto('/#/cards/new')
  await expect(page.getByRole('heading', { name: '新增卡片', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: '卡片管理' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /封存卡片|恢復使用卡片|刪除卡片/ })).toHaveCount(0)
  await page.getByLabel('卡片名稱').fill('新卡')
  await page.getByRole('button', { name: '儲存卡片', exact: true }).click()
  await expect(page.getByRole('heading', { name: '新卡', exact: true })).toBeVisible()
})

test('missing edit targets cannot create or manage a card', async ({ page }) => {
  await page.goto('/#/cards/missing/edit')
  await expect(page.getByRole('alert')).toHaveText('找不到這張卡片。')
  await expect(page.locator('form')).toHaveCount(0)
  await expect(page.getByRole('region', { name: '卡片管理' })).toHaveCount(0)
  await page.getByRole('link', { name: '返回我的卡片', exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  expect((await stored(page)).cards).toEqual([])
})

async function expectLeaveProtection(page: Page) {
  const prompt = page.waitForEvent('dialog')
  const leave = page.getByRole('link', { name: '返回卡片', exact: true }).click()
  const dialog = await prompt
  expect(dialog.message()).toBe('尚有未儲存的內容，確定離開？')
  await dialog.dismiss()
  await leave
  await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}/edit$`))
}

async function failNextCardWrite(page: Page) {
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    let failOnce = true
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === 'cards' && failOnce) {
        failOnce = false
        throw new DOMException('測試寫入失敗', 'QuotaExceededError')
      }
      return key === undefined ? original.call(this, value) : original.call(this, value, key)
    }
  })
}

async function holdCardWrites(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('bonus-track')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    // A live readonly transaction blocks the application's write transaction.
    const tx = db.transaction('cards', 'readonly')
    let held = true
    const keepAlive = () => {
      const request = tx.objectStore('cards').get('settings-card')
      request.onsuccess = () => { if (held) keepAlive() }
    }
    ;(window as unknown as { releaseCardWrites: () => void }).releaseCardWrites = () => { held = false }
    tx.oncomplete = () => db.close()
    keepAlive()
  })
}

async function releaseCardWrites(page: Page) {
  await page.evaluate(() => (window as unknown as { releaseCardWrites: () => void }).releaseCardWrites())
}

for (const archived of [false, true]) {
  const actionName = archived ? '恢復使用卡片' : '封存卡片'
  for (const draft of ['尚未儲存', '']) {
    test(`${actionName} changes only committed status with draft=${JSON.stringify(draft)}`, async ({ page }) => {
      const before = dataset(archived)
      await restore(page, before)
      await page.getByLabel('卡片名稱').fill(draft)
      const messages: string[] = []
      page.on('dialog', async dialog => { messages.push(dialog.message()); await dialog.accept() })
      await page.getByRole('button', { name: actionName, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
      expect(messages).toHaveLength(1)
      expect(messages[0]).toContain('尚未儲存的修改不會儲存')
      expect(messages[0]).toContain(archived ? '恢復後可新增消費與活動' : '封存後停止新增消費與活動，歷史紀錄會保留')
      await page.reload()
      await expect(page.getByRole('heading', { name: '旅遊卡', exact: true })).toBeVisible()
      await expectStored(page, { ...before, cards: [{ ...before.cards[0]!, archived: !archived }, before.cards[1]!] })
      await expect(page.getByRole('link', { name: '新增消費', exact: true })).toHaveCount(archived ? 1 : 0)
      await expect(page.getByRole('link', { name: '新增活動', exact: true })).toHaveCount(archived ? 1 : 0)
    })
  }

  test(`${actionName} cancellation preserves invalid draft and leave protection`, async ({ page }) => {
    const before = dataset(archived)
    await restore(page, before)
    await page.getByLabel('卡片名稱').fill('')
    const prompt = page.waitForEvent('dialog')
    const click = page.getByRole('button', { name: actionName, exact: true }).click()
    const dialog = await prompt
    expect(dialog.message()).toContain('尚未儲存的修改不會儲存')
    await dialog.dismiss()
    await click
    await expect(page.getByLabel('卡片名稱')).toHaveValue('')
    await expectStored(page, before)
    await expectLeaveProtection(page)
  })

  test(`${actionName} failure retains drafts and committed data for retry`, async ({ page }) => {
    const before = dataset(archived)
    await restore(page, before)
    await page.getByLabel('卡片名稱').fill('尚未儲存')
    await failNextCardWrite(page)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: actionName, exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('儲存失敗')
    await expect(page.getByLabel('卡片名稱')).toHaveValue('尚未儲存')
    await expect(page.getByRole('button', { name: '儲存卡片', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: actionName, exact: true })).toBeEnabled()
    await expectStored(page, before)
    await expectLeaveProtection(page)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: actionName, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
    await page.reload()
    await expectStored(page, { ...before, cards: [{ ...before.cards[0]!, archived: !archived }, before.cards[1]!] })
  })

  test(`${actionName} disables save and management while writing`, async ({ page }) => {
    await restore(page, dataset(archived, false))
    await holdCardWrites(page)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: actionName, exact: true }).click()
    await expect(page.getByRole('button', { name: '儲存中…', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: actionName, exact: true })).toBeDisabled()
    for (const button of await page.getByRole('region', { name: '卡片管理' }).getByRole('button').all()) await expect(button).toBeDisabled()
    await releaseCardWrites(page)
    await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
    expect((await stored(page)).cards.find(value => value.id === card.id)?.archived).toBe(!archived)
  })
}

test('archiving does not save uncommitted cycle settings', async ({ page }) => {
  const before = dataset(false, false)
  await restore(page, before)
  await page.getByLabel('日曆月', { exact: false }).check()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '封存卡片', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
  await expectStored(page, { ...before, cards: [{ ...before.cards[0]!, archived: true }, before.cards[1]!] })
})

for (const archived of [false, true]) {
  test(`earlier history prevents deletion even with empty current period, archived=${archived}`, async ({ page }) => {
    await restore(page, dataset(archived))
    await page.goto(`/#/cards/${card.id}`)
    await expect(page.getByRole('heading', { name: '這一期還沒有消費', exact: true })).toBeVisible()
    await page.goto(`/#/cards/${card.id}/edit`)
    await expect(page.getByText('已有消費紀錄，請改用封存', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '刪除卡片', exact: true })).toHaveCount(0)
  })

  test(`deletion removes only the eligible card and its activities, archived=${archived}`, async ({ page }) => {
    const before = dataset(archived, false)
    // Unrelated history must survive deletion of the eligible card.
    before.transactions.push({ id: 'other-purchase', cardId: 'other-card', activityId: 'other-offer', amountMinor: 20000, spentOn: '2026-10-29', note: '保留', overridePeriodEnd: null })
    await restore(page, before)
    await page.getByLabel('卡片名稱').fill('')
    const messages: string[] = []
    page.on('dialog', async dialog => { messages.push(dialog.message()); await dialog.accept() })
    await page.getByRole('button', { name: '刪除卡片', exact: true }).click()
    await expect(page).toHaveURL(/#\/$/)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('卡片及其所有活動')
    expect(messages[0]).toContain('無法復原')
    expect(messages[0]).toContain('尚未儲存的修改不會儲存')
    await page.reload()
    await expectStored(page, { cards: [before.cards[1]!], activities: [before.activities[2]!], transactions: before.transactions })
    await expect(page.getByRole('link', { name: '查看 日常卡', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '查看 旅遊卡', exact: true })).toHaveCount(0)
  })
}

test('deletion cancellation preserves card, activities and dirty draft', async ({ page }) => {
  const before = dataset(false, false)
  await restore(page, before)
  await page.getByLabel('卡片名稱').fill('尚未儲存')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '刪除卡片', exact: true }).click()
  await expect(page.getByLabel('卡片名稱')).toHaveValue('尚未儲存')
  await expectStored(page, before)
  await expectLeaveProtection(page)
})

test('failed deletion retains records and draft until a confirmed retry', async ({ page }) => {
  const before = dataset(false, false)
  await restore(page, before)
  await page.getByLabel('卡片名稱').fill('尚未儲存')
  await failNextCardWrite(page)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除卡片', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('儲存失敗')
  await expect(page.getByLabel('卡片名稱')).toHaveValue('尚未儲存')
  await expectStored(page, before)
  await expectLeaveProtection(page)
  await expect(page.getByRole('button', { name: '儲存卡片', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: '刪除卡片', exact: true })).toBeEnabled()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除卡片', exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expectStored(page, { cards: [before.cards[1]!], activities: [before.activities[2]!], transactions: [] })
})

test('pending deletion disables both save and management actions', async ({ page }) => {
  await restore(page, dataset(false, false))
  await holdCardWrites(page)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除卡片', exact: true }).click()
  await expect(page.getByRole('button', { name: '儲存中…', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '刪除卡片', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '封存卡片', exact: true })).toBeDisabled()
  await releaseCardWrites(page)
  await expect(page).toHaveURL(/#\/$/)
  expect((await stored(page)).cards.map(value => value.id)).toEqual(['other-card'])
})

test('ordinary back navigation warns and discards only after acceptance', async ({ page }) => {
  const before = dataset()
  await restore(page, before)
  await page.getByLabel('卡片名稱').fill('離開前的草稿')
  await expectLeaveProtection(page)
  await expect(page.getByLabel('卡片名稱')).toHaveValue('離開前的草稿')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('link', { name: '返回卡片', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
  await expectStored(page, before)
})

for (const width of [320, 390, 1280]) {
  test(`settings layout and keyboard management at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await restore(page, dataset(false, false))
    await page.getByRole('button', { name: '關閉通知', exact: true }).click()
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0) })
    const management = page.getByRole('region', { name: '卡片管理' })
    const formBox = await page.locator('form').boundingBox()
    const managementBox = await management.boundingBox()
    expect(managementBox!.y).toBeGreaterThan(formBox!.y + formBox!.height)
    await expect(page.getByRole('button', { name: '刪除卡片', exact: true })).toHaveCSS('color', 'rgb(155, 66, 49)')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `.impeccable/review/consolidate-card-settings/settings-${width}.png`, fullPage: true })

    const archive = page.getByRole('button', { name: '封存卡片', exact: true })
    await archive.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(archive).toBeFocused()
    await expect(archive).toHaveCSS('outline-width', '3px')
    const prompt = page.waitForEvent('dialog')
    const activate = page.keyboard.press('Enter')
    const dialog = await prompt
    expect(dialog.message()).toContain('確定封存')
    await dialog.dismiss()
    await activate
    await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}/edit$`))
    if (width === 390) {
      await failNextCardWrite(page)
      page.once('dialog', dialog => dialog.accept())
      await archive.click()
      await expect(page.getByRole('alert')).toContainText('儲存失敗')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: '.impeccable/review/consolidate-card-settings/settings-error-390.png', fullPage: true })
      await page.goto(`/#/cards/${card.id}`)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: '.impeccable/review/consolidate-card-settings/detail-390.png', fullPage: true })
    }
  })
}
