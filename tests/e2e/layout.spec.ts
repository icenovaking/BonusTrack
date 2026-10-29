import { test, expect } from '@playwright/test'

test('RWD keeps card data and form actions usable at all target sizes and enlarged text', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  const data = {
    schemaVersion: 1, exportedAt: '2026-10-29T04:00:00Z',
    cards: [
      { id: 'one', name: '玉山熊本熊卡', cycleMode: 'billing-day', closingDay: 15, archived: false },
      { id: 'two', name: '旅遊專用卡片名稱很長也能完整閱讀與操作不會截斷重要資訊', cycleMode: 'calendar-month', closingDay: null, archived: false },
      { id: 'three', name: '日常消費卡', cycleMode: 'calendar-month', closingDay: null, archived: false },
    ],
    activities: [
      { id: 'a', cardId: 'one', name: '日本指定商店', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false },
      { id: 'b', cardId: 'two', name: '指定通路加碼活動名稱很長也要完整顯示', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: false },
      { id: 'c', cardId: 'three', name: '網購加碼', rewardCapMinor: 30000, bonusRateBasisPoints: 300, archived: false },
    ],
    transactions: [{ id: 't', cardId: 'three', activityId: 'c', spentOn: '2026-10-29', amountMinor: 1000000, note: '', overridePeriodEnd: null }],
  }
  await page.goto('/#/settings')
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'layout.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('link', { name: '查看 玉山熊本熊卡', exact: true })).toHaveAccessibleDescription(/剩餘可刷台幣\s+8,333/)
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('.credit-card')).toHaveCount(3)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const columnCount = await page.locator('.card-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)
    expect(columnCount).toBe(width <= 600 ? 1 : width <= 1000 ? 2 : 3)
    await page.screenshot({ path: `.impeccable/review/home-${width}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/#/cards/one')
  expect(await page.getByLabel('查看期別').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)
  await page.goto('/')
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const hiddenSkip = await page.getByRole('link', { name: '跳至主要內容' }).boundingBox()
  expect(hiddenSkip!.y + hiddenSkip!.height).toBeLessThanOrEqual(0)
  await expect(page.getByRole('link', { name: '新增卡片', exact: true })).toBeVisible()
  await page.goto('/#/cards/one/purchases/new')
  const formUrl = page.url()
  await page.getByRole('link', { name: '跳至主要內容' }).focus()
  await page.keyboard.press('Enter')
  expect(page.url()).toBe(formUrl)
  await expect(page.locator('#main')).toBeFocused()
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: '儲存消費', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '儲存消費', exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: '.impeccable/review/text-200.png', fullPage: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '16px' })
  const font = await page.getByRole('textbox', { name: '消費金額（台幣）', exact: true }).evaluate(element => parseFloat(getComputedStyle(element).fontSize))
  expect(font).toBeGreaterThanOrEqual(16)
  const button = await page.getByRole('button', { name: '儲存消費', exact: true }).boundingBox()
  expect(button!.height).toBeGreaterThanOrEqual(44)
  await page.getByRole('textbox', { name: '消費金額（台幣）', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('消費日期')).toBeFocused()
})
