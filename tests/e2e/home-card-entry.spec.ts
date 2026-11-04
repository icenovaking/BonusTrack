import { expect, test, type Page } from '@playwright/test'
import type { Activity, Card } from '../../src/domain/models'

const archivedCard: Card = { id: 'archived', name: '已封存旅遊卡', cycleMode: 'calendar-month', closingDay: null, archived: true }
const activeCard: Card = { ...archivedCard, id: 'active', name: '日常消費卡', archived: false }

async function openHome(page: Page, cards: Card[] = [], activities: Activity[] = []) {
  if (cards.length) {
    await page.goto('/#/settings')
    await page.getByLabel('選擇 JSON 備份').setInputFiles({
      name: 'home-cards.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: '2026-11-03T00:00:00Z', cards, activities, transactions: [] })),
    })
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: '確認取代全部資料' }).click()
    await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  }
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
}

async function expectConciseCopy(page: Page) {
  await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
  for (const text of [
    '出發前看一眼，讓每筆消費都在加碼範圍內。',
    '把你的第一張卡加進來',
    '設定回饋上限與加碼百分比，剩下的額度交給這裡記。',
  ]) await expect(page.getByText(text, { exact: true })).toHaveCount(0)
  await expect(page.getByText('定期備份', { exact: true })).toBeVisible()
  await expect(page.locator('.local-note svg')).toHaveCount(1)
  await expect(page.locator('footer')).toHaveCount(0)
  await expect(page.getByText('離線可用', { exact: true })).toHaveCount(0)
}

test.describe('whole-card navigation', () => {
  test.use({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true })

  for (const archived of [false, true]) {
    for (const withActivity of [false, true]) {
      test(`concise card keeps click keyboard and touch navigation archived=${archived} activity=${withActivity}`, async ({ page }) => {
        const card = archived ? archivedCard : activeCard
        const activities: Activity[] = withActivity ? [{
          id: 'home-offer', cardId: card.id, name: '旅遊加碼', rewardCapMinor: 50000,
          bonusRateBasisPoints: 600, archived: false, note: '海外適用',
        }] : []
        await openHome(page, [card], activities)
        const selectList = async () => {
          if (archived) await page.getByRole('button', { name: '查看已封存卡片' }).click()
        }
        await selectList()
        const link = page.getByRole('link', { name: `查看 ${card.name}`, exact: true })
        await expect(link).toHaveAttribute('href', `#/cards/${card.id}`)
        await expect(link.locator('.card-link')).toHaveCount(0)
        await expect(link).not.toContainText('查看紀錄 / 新增消費')
        await expect(link.locator('.card-heading > svg path')).toHaveAttribute('d', 'm9 5 7 7-7 7')
        await expect(link.locator(':scope > svg')).toHaveCount(0)
        const descriptionId = await link.getAttribute('aria-describedby')
        expect(descriptionId).toBeTruthy()
        await expect(page.locator(`[id="${descriptionId}"]`)).not.toBeEmpty()
        if (withActivity) {
          await expect(link.locator('.activity-name')).toContainText('旅遊加碼')
          await expect(link.locator('.activity-note')).toHaveText('海外適用')
          await expect(link.locator('.amount')).toHaveText('NT$ 8,333')
          await expect(page.locator(`[id="${descriptionId}"]`)).toContainText('海外適用')
        } else {
          await expect(link.locator('.card-no-activity')).toHaveText(archived ? '查看保留的活動與消費紀錄' : '還沒有加碼活動，點此開始設定')
        }
        await link.locator('.period-caption').click()
        await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
        await page.goto('/')
        await selectList()
        await link.focus()
        await expect(link).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
        await page.goto('/')
        await selectList()
        await link.locator(withActivity ? '.amount' : '.card-no-activity').tap()
        await expect(page).toHaveURL(new RegExp(`#/cards/${card.id}$`))
      })
    }
  }
})

for (const width of [320, 390, 1280]) {
  test(`home card layout without footer prompts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await openHome(page, [activeCard], [{
      id: 'layout-offer', cardId: activeCard.id, name: '旅遊加碼', rewardCapMinor: 50000,
      bonusRateBasisPoints: 600, archived: false, note: '海外適用',
    }])
    await expect(page.locator('.card-link')).toHaveCount(0)
    await expect(page.locator('.card-heading > svg')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `.impeccable/review/polish-card-settings-and-home/home-${width}.png`, fullPage: true })
  })
}

for (const scenario of [
  { name: 'empty active list', cards: [], archived: false, location: '.empty-state', other: '.page-heading' },
  { name: 'populated active list', cards: [activeCard], archived: false, location: '.page-heading', other: '.empty-state' },
  { name: 'empty archived list', cards: [], archived: true, location: '.page-heading', other: '.empty-state' },
  { name: 'populated archived list', cards: [archivedCard], archived: true, location: '.page-heading', other: '.empty-state' },
]) {
  test(`${scenario.name}: concise copy and a single keyboard creation entry`, async ({ page }) => {
    await openHome(page, scenario.cards)
    if (scenario.archived) await page.getByRole('button', { name: '查看已封存卡片' }).click()
    await expectConciseCopy(page)
    const entry = page.getByRole('link', { name: '新增卡片', exact: true })
    await expect(entry).toHaveCount(1)
    await expect(entry).toBeVisible()
    await expect(page.locator(scenario.location).getByRole('link', { name: '新增卡片', exact: true })).toHaveCount(1)
    await expect(page.locator(scenario.other).getByRole('link', { name: '新增卡片', exact: true })).toHaveCount(0)
    await expect(page.locator('.credit-card')).toHaveCount(scenario.cards.length)
    if (scenario.cards.length) await expect(page.getByRole('link', { name: `查看 ${scenario.cards[0]!.name}`, exact: true })).toBeVisible()
    if (!scenario.cards.length && scenario.archived) {
      await expect(page.getByRole('heading', { name: '還沒有封存卡片' })).toBeVisible()
      await expect(page.getByText('封存後的卡片與消費紀錄會留在這裡。', { exact: true })).toBeVisible()
    } else if (!scenario.cards.length) {
      await expect(page.locator('.empty-icon svg')).toBeVisible()
      await expect(page.locator('.empty-state h2, .empty-state p')).toHaveCount(0)
    }
    await entry.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(entry).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/cards\/new$/)
    await expect(page.getByRole('heading', { name: '新增卡片', exact: true })).toBeVisible()
    await expect(page.getByLabel('卡片名稱')).toBeVisible()
  })
}

test('all cards archived: switching lists moves the sole creation entry without reloading', async ({ page }) => {
  await openHome(page, [archivedCard])
  let navigations = 0
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++ })
  const entry = page.getByRole('link', { name: '新增卡片', exact: true })
  for (const archived of [false, true, false]) {
    if (archived) await page.getByRole('button', { name: '查看已封存卡片' }).click()
    else if (await page.getByRole('button', { name: '查看使用中卡片' }).count()) await page.getByRole('button', { name: '查看使用中卡片' }).click()
    await expect(entry).toHaveCount(1)
    await expect(page.locator(archived ? '.page-heading' : '.empty-state').getByRole('link', { name: '新增卡片', exact: true })).toBeVisible()
    await expect(page.locator('.list-toolbar .count')).toHaveText(archived ? '1' : '0')
    await expect(page.locator('.credit-card')).toHaveCount(archived ? 1 : 0)
  }
  expect(navigations).toBe(0)
})
