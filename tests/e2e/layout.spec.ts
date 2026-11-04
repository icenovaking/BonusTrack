import { test, expect, type Page } from '@playwright/test'

async function seedNavigation(page: Page) {
  await page.goto('/#/settings')
  const data = {
    schemaVersion: 1, exportedAt: '2026-11-04T04:00:00Z',
    cards: [{ id: 'nav', name: '旅遊專用卡片名稱很長也能完整閱讀與操作不會截斷重要資訊', cycleMode: 'calendar-month', closingDay: null, archived: false }],
    activities: [{ id: 'bonus', cardId: 'nav', name: '指定通路', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false }],
    transactions: [{ id: 'purchase', cardId: 'nav', activityId: 'bonus', spentOn: '2026-11-04', amountMinor: 10000, note: '原始備註', overridePeriodEnd: null }],
  }
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'navigation.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '關閉通知' }).click()
  return data
}

test('shared title-row returns to the correct destination across routes, long names and text sizes', async ({ page }) => {
  test.setTimeout(120000)
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+08:00') })
  const data = await seedNavigation(page)
  const routes = [
    ['/cards/nav', '/'], ['/cards/new', '/'], ['/cards/nav/edit', '/cards/nav'],
    ['/cards/nav/activities/new', '/cards/nav'], ['/cards/nav/activities/bonus/edit', '/cards/nav'],
    ['/cards/nav/purchases/new', '/cards/nav'], ['/cards/nav/purchases/purchase/edit', '/cards/nav'],
    ['/settings', '/'], ['/cards/missing', '/'], ['/cards/missing/edit', '/'],
  ]
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const fontSize of [16, 32]) {
      for (const [route, destination] of routes) {
        await page.goto(`/#${route}`)
        await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, fontSize)
        const heading = page.locator('.title-row h1')
        const back = page.locator('.title-row .back-link')
        await expect(back).toHaveAttribute('href', `#${destination}`)
        await expect(back).toHaveAccessibleName(/我的卡片|返回卡片/)
        await expect(back.locator('svg')).toHaveCount(1)
        const titleBox = (await heading.boundingBox())!
        const backBox = (await back.boundingBox())!
        expect(Math.abs(titleBox.y + titleBox.height / 2 - backBox.y - backBox.height / 2), route).toBeLessThanOrEqual(1)
        expect(backBox.x, route).toBeGreaterThanOrEqual(titleBox.x + titleBox.width)
        expect(await back.evaluate(el => getComputedStyle(el).whiteSpace)).toBe('nowrap')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}, ${width}, ${fontSize}`).toBe(true)
        await expect(page.locator('footer')).toHaveCount(0)
        if (route === '/cards/nav') {
          await expect(heading).toHaveText(data.cards[0]!.name)
          const actions = page.locator('.card-detail-actions')
          await expect(actions.getByRole('link')).toHaveText(['卡片設定', '新增活動'])
          await expect(page.getByRole('link', { name: '卡片設定', exact: true })).toHaveCount(1)
          const settings = actions.getByRole('link', { name: '卡片設定', exact: true })
          const add = (await page.getByRole('link', { name: '新增活動', exact: true }).boundingBox())!
          const settingsBox = (await settings.boundingBox())!
          const allowance = (await page.getByRole('heading', { name: '加碼額度', exact: true }).boundingBox())!
          expect(Math.abs(backBox.x + backBox.width - add.x - add.width)).toBeLessThanOrEqual(1)
          if (Math.abs(settingsBox.y - add.y) <= 1) {
            expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(add.x)
          } else {
            expect(settingsBox.y + settingsBox.height).toBeLessThanOrEqual(add.y)
          }
          if (settingsBox.x < allowance.x + allowance.width) {
            expect(settingsBox.y).toBeGreaterThanOrEqual(allowance.y + allowance.height)
          }
          for (const control of [settings, actions.getByRole('link', { name: '新增活動', exact: true })]) {
            await expect(control).toHaveCSS('white-space', 'nowrap')
            expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44)
          }
          if ([390, 1280].includes(width)) {
            await page.mouse.move(0, 0)
            if (fontSize === 32) await actions.evaluate(element => element.scrollIntoView({ block: 'center' }))
            await page.screenshot({ path: `.impeccable/review/align-card-actions-${width}-${fontSize}.png`, fullPage: fontSize === 16 })
          }
        }
        if (width === 390 && ['/cards/nav', '/cards/nav/purchases/new', '/settings'].includes(route!)) {
          await page.screenshot({ path: `.impeccable/review/navigation-${route!.replaceAll('/', '-')}-${fontSize}.png`, fullPage: true })
        }
        await page.keyboard.press('Tab')
        await back.focus()
        await expect(back).toBeFocused()
        expect(await back.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`#${destination}$`))
      }
    }
  }
})

test('grouped card actions retain keyboard routes and archived card settings', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+08:00') })
  await seedNavigation(page)
  await page.goto('/#/cards/nav')
  const settings = page.getByRole('link', { name: '卡片設定', exact: true })
  const add = page.getByRole('link', { name: '新增活動', exact: true })
  await settings.focus()
  await page.keyboard.press('Tab')
  await expect(add).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/cards\/nav\/activities\/new$/)
  await page.getByRole('link', { name: '返回卡片', exact: true }).click()
  await settings.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/cards\/nav\/edit$/)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '封存卡片', exact: true }).click()
  await expect(page).toHaveURL(/#\/cards\/nav$/)
  await expect(page.getByText('已封存', { exact: true })).toBeVisible()
  await expect(settings).toHaveCount(1)
  await expect(add).toHaveCount(0)
  await page.keyboard.press('Tab')
  await settings.focus()
  await expect(settings).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/cards\/nav\/edit$/)
  await expect(page.getByRole('button', { name: '恢復使用卡片', exact: true })).toBeVisible()
})

test('secondary actions have transparent defaults and retain interaction feedback', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+08:00') })
  await seedNavigation(page)
  for (const route of ['/', '/cards/nav', '/cards/nav/edit', '/settings']) {
    await page.goto(`/#${route}`)
    await page.mouse.move(0, 0)
    if (route === '/cards/nav') await page.getByText('管理活動', { exact: true }).click()
    const controls = page.locator('.text-button, .nav-link, .secondary')
    expect(await controls.count()).toBeGreaterThan(0)
    for (const control of await controls.all()) {
      await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    }
    for (const primary of await page.locator('.primary').all()) {
      await expect(primary).toHaveCSS('background-color', 'rgb(22, 112, 90)')
    }
    for (const danger of await page.locator('.text-button.danger').all()) {
      await expect(danger).toHaveCSS('color', 'rgb(155, 66, 49)')
    }
    if (route === '/cards/nav') {
      await expect(page.locator('.rate')).toHaveCSS('background-color', 'rgb(234, 243, 238)')
    }
  }
  const nav = page.locator('.nav-link')
  await nav.hover()
  await expect(nav).toHaveCSS('background-color', 'rgb(232, 238, 234)')
  await page.mouse.down()
  await expect(nav).toHaveCSS('background-color', 'rgb(220, 228, 222)')
  await page.mouse.up()
  await page.goto('/#/cards/nav/edit')
  const archive = page.getByRole('button', { name: '封存卡片', exact: true })
  await page.keyboard.press('Tab')
  await archive.focus()
  await expect(archive).toHaveCSS('outline-style', 'solid')
  await archive.hover()
  await expect(archive).toHaveCSS('background-color', 'rgb(232, 238, 234)')
  const remove = page.getByRole('button', { name: '刪除卡片', exact: true })
  // Check the shared disabled presentation without starting a storage write.
  await archive.evaluate(element => { (element as HTMLButtonElement).disabled = true })
  await expect(archive).toBeDisabled()
  await expect(archive).toHaveCSS('opacity', '0.6')
  await expect(archive).toHaveCSS('cursor', 'not-allowed')
  await expect(archive).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(remove).toHaveCount(0)
  await page.goto('/#/cards/nav')
  const deletePurchase = page.getByRole('button', { name: '刪除 2026-11-04 消費', exact: true })
  await deletePurchase.hover()
  await expect(deletePurchase).toHaveCSS('background-color', 'rgb(245, 224, 218)')
  await page.mouse.down()
  await expect(deletePurchase).toHaveCSS('background-color', 'rgb(238, 209, 200)')
  await page.mouse.move(0, 0)
  await page.mouse.up()
})

test('return confirmation preserves canceled drafts and discards confirmed drafts without saving', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+08:00') })
  const data = await seedNavigation(page)
  const forms = [
    { route: '/cards/new', label: '卡片名稱', original: '', destination: '/' },
    { route: '/cards/nav/edit', label: '卡片名稱', original: data.cards[0]!.name, destination: '/cards/nav' },
    { route: '/cards/nav/activities/new', label: '活動名稱', original: '', destination: '/cards/nav' },
    { route: '/cards/nav/activities/bonus/edit', label: '活動名稱', original: '指定通路', destination: '/cards/nav' },
    { route: '/cards/nav/purchases/new', label: '備註', original: '', destination: '/cards/nav' },
    { route: '/cards/nav/purchases/purchase/edit', label: '備註', original: '原始備註', destination: '/cards/nav' },
  ]
  for (const form of forms) {
    await page.goto(`/#${form.route}`)
    const field = page.getByLabel(form.label, { exact: form.label !== '備註' })
    await field.fill('尚未儲存的草稿')
    for (let attempt = 0; attempt < 2; attempt++) {
      const dialogPromise = page.waitForEvent('dialog')
      const click = page.locator('.back-link').click()
      const dialog = await dialogPromise
      expect(dialog.message()).toBe('尚有未儲存的內容，確定離開？')
      await dialog.dismiss()
      await click
      await expect(page).toHaveURL(new RegExp(`#${form.route}$`))
      await expect(field).toHaveValue('尚未儲存的草稿')
    }
    page.once('dialog', dialog => dialog.accept())
    await page.locator('.back-link').click()
    await expect(page).toHaveURL(new RegExp(`#${form.destination}$`))
    await page.goto(`/#${form.route}`)
    await expect(field).toHaveValue(form.original)
  }
  await page.goto('/#/settings')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '匯出 JSON 備份' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  expect(exported.cards).toEqual(data.cards)
  expect(exported.activities).toEqual(data.activities.map(activity => ({ ...activity, note: '' })))
  expect(exported.transactions).toEqual(data.transactions)
})

test('purchase form stays aligned and saves without floating over fields in creation and editing', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+08:00') })
  await page.goto('/#/settings')
  const data = {
    schemaVersion: 1, exportedAt: '2026-11-04T04:00:00Z',
    cards: [{ id: 'layout', name: '排版測試卡', cycleMode: 'calendar-month', closingDay: null, archived: false }],
    activities: [{ id: 'bonus', cardId: 'layout', name: '一般加碼', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false }],
    transactions: [],
  }
  await page.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'purchase-layout.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '確認取代全部資料' }).click()
  await expect(page.getByText('備份已還原，額度已重新計算', { exact: true })).toBeVisible()
  await page.goto('/#/cards/layout/purchases/new')

  for (const mode of ['create', 'edit']) {
    const amount = page.getByLabel('消費金額（台幣）', { exact: true })
    const date = page.getByLabel('消費日期')
    const activity = page.getByLabel('適用加碼活動')
    const note = page.getByLabel('備註')
    const save = page.getByRole('button', { name: mode === 'create' ? '儲存消費' : '儲存變更', exact: true })
    await amount.fill(mode === 'create' ? '100' : '200')
    await date.fill('2026-11-04')
    await activity.selectOption('activity:bonus')
    await note.fill(`排版-${mode}`)
    await page.getByText('調整所屬期別', { exact: true }).click()
    for (const width of [320, 375, 390, 430, 768, 1280]) {
      await page.setViewportSize({ width, height: 480 })
      await expect(amount).toHaveValue(mode === 'create' ? '100' : '200')
      await expect(date).toHaveValue('2026-11-04')
      await expect(note).toHaveValue(`排版-${mode}`)
      const bounds = await Promise.all([date, activity, note].map(control => control.boundingBox()))
      for (const box of bounds) {
        expect(box).not.toBeNull()
        expect(Math.abs(box!.x - bounds[0]!.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(box!.x + box!.width - bounds[0]!.x - bounds[0]!.width)).toBeLessThanOrEqual(1)
      }
      const title = (await page.locator('.title-row h1').boundingBox())!
      const back = (await page.locator('.back-link').boundingBox())!
      expect(Math.abs(title.y + title.height / 2 - back.y - back.height / 2)).toBeLessThanOrEqual(1)
      expect(back.x).toBeGreaterThanOrEqual(title.x + title.width)
      await expect(page.locator('footer')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect(await page.locator('form').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
      await note.focus()
      await note.scrollIntoViewIfNeeded()
      const noteBox = (await note.boundingBox())!
      const saveBox = (await save.boundingBox())!
      expect(saveBox.y).toBeGreaterThanOrEqual(noteBox.y + noteBox.height)
      const before = await save.evaluate(el => ({ y: el.getBoundingClientRect().y, scroll: window.scrollY }))
      await save.scrollIntoViewIfNeeded()
      const after = await save.evaluate(el => ({ y: el.getBoundingClientRect().y, scroll: window.scrollY }))
      expect(Math.abs((before.y - after.y) - (after.scroll - before.scroll))).toBeLessThanOrEqual(1)
      expect(await page.locator('.form-actions').evaluate(el => getComputedStyle(el).position)).toBe('static')
      expect((await save.boundingBox())!.height).toBeGreaterThanOrEqual(48)
      if (width === 390) await page.screenshot({ path: `.impeccable/review/purchase-form-${mode}-390.png`, fullPage: true })
    }
    await page.setViewportSize({ width: 390, height: 480 })
    await amount.fill('0')
    await save.click()
    await expect(page.getByRole('alert')).toBeVisible()
    await page.getByRole('alert').scrollIntoViewIfNeeded()
    expect((await page.getByRole('alert').boundingBox())!.y).toBeLessThan((await save.boundingBox())!.y)
    await expect(note).toHaveValue(`排版-${mode}`)
    await amount.fill(mode === 'create' ? '100' : '200')
    await date.fill('2026-11-05')
    await save.click()
    expect(await date.evaluate(el => (el as HTMLInputElement).validity.rangeOverflow)).toBe(true)
    await date.fill('2026-11-04')
    await save.click()
    await expect(page.locator('.activity-panel .amount')).toContainText(mode === 'create' ? '8,233' : '8,133')
    await expect(page.locator('.purchase-list li')).toHaveCount(1)
    await expect(page.locator('.purchase-list')).toContainText(`排版-${mode}`)
    await page.reload()
    await expect(page.locator('.activity-panel .amount')).toContainText(mode === 'create' ? '8,233' : '8,133')
    if (mode === 'create') await page.getByRole('link', { name: '編輯 2026-11-04 消費', exact: true }).click()
  }
  for (const route of ['/cards/layout/edit', '/cards/layout/activities/new', '/cards/layout/activities/bonus/edit']) {
    await page.goto(`/#${route}`)
    const isActivity = route.includes('/activities/')
    expect(await page.locator('.form-actions').evaluate(el => getComputedStyle(el).position)).toBe(isActivity ? 'static' : 'sticky')
    if (isActivity) {
      const field = page.getByLabel('活動名稱', { exact: true })
      await field.focus()
      await field.scrollIntoViewIfNeeded()
      const fieldBox = (await field.boundingBox())!
      const saveBox = (await page.getByRole('button', { name: '儲存活動', exact: true }).boundingBox())!
      expect(saveBox.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height)
      await page.screenshot({ path: `.impeccable/review/activity-form-${route.endsWith('/new') ? 'create' : 'edit'}-390.png`, fullPage: true })
    }
  }
  await page.goto('/#/cards/layout')
  expect(await page.locator('.mobile-action').evaluate(el => getComputedStyle(el).position)).toBe('sticky')
})

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
