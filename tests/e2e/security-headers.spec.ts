import { test, expect, type Page } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { headersForPath, parseHeaderRules } from '../../scripts/security-preview.mjs'

declare global {
  interface Window {
    __securityProbe: { inline?: boolean; external?: boolean; evalRan?: boolean; evalError?: string; evalFinished?: boolean }
    __reportPolicyViolation: (value: { directive: string; blockedURI: string }) => Promise<void>
  }
}

async function observePolicy(page: Page, violations: { directive: string; blockedURI: string }[]) {
  await page.exposeFunction('__reportPolicyViolation', (value: { directive: string; blockedURI: string }) => violations.push(value))
  await page.addInitScript(() => {
    window.__securityProbe = {}
    document.addEventListener('securitypolicyviolation', event => {
      void window.__reportPolicyViolation({ directive: event.effectiveDirective, blockedURI: event.blockedURI })
    })
  })
}

test('serves global security headers and exact update caching on production assets', async ({ request }) => {
  const rules = parseHeaderRules(await readFile('public/_headers', 'utf8'))
  const response = await request.get('/')
  const html = await response.text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]!)
  expect(assets.some(path => path.endsWith('.js'))).toBe(true)
  expect(assets.some(path => path.endsWith('.css'))).toBe(true)
  for (const path of ['/', ...assets, '/sw.js', '/manifest.webmanifest']) {
    const asset = await request.get(path)
    expect(asset.status(), path).toBe(200)
    expect(asset.headers(), path).toMatchObject(headersForPath(rules, path))
    const mime = path.endsWith('.css') ? /text\/css/ : path.endsWith('.js') ? /javascript/ : path.endsWith('webmanifest') ? /json/ : /text\/html/
    expect(asset.headers()['content-type'], path).toMatch(mime)
  }
})

test('versions the worker HTML cache with the deployed header policy', async ({ request }) => {
  const policy = await readFile('public/_headers')
  expect(await readFile('dist/_headers')).toEqual(policy)
  const worker = await request.get('/sw.js')
  expect(worker.status()).toBe(200)
  const revision = createHash('sha256').update(policy).digest('hex')
  expect(await worker.text()).toContain(`bonus-track-${revision}`)
  expect(await worker.text()).toContain('cleanupOutdatedCaches')
})

test.describe('browser security restrictions', () => {
  // Probes need network interception for fixture JS, not a cached navigation.
  // Positive PWA coverage below uses real service workers instead.
  test.use({ serviceWorkers: 'block' })
  let remote: Server, remoteOrigin: string
  const hits: string[] = []

  test.beforeAll(async () => {
    remote = createServer((req, res) => {
      hits.push(req.url ?? '/')
      res.setHeader('Access-Control-Allow-Origin', '*')
      if (req.url === '/frame') {
        res.setHeader('Content-Type', 'text/html')
        res.end('<!doctype html><iframe src="http://localhost:4173/"></iframe>')
      } else {
        res.setHeader('Content-Type', 'application/javascript')
        res.end('window.__securityProbe.external = true')
      }
    })
    await new Promise<void>(resolve => remote.listen(0, '127.0.0.1', resolve))
    const address = remote.address()
    if (!address || typeof address === 'string') throw new Error('Missing probe server address')
    remoteOrigin = `http://127.0.0.1:${address.port}`
  })
  test.afterAll(async () => { await new Promise<void>((resolve, reject) => remote.close(error => error ? reject(error) : resolve())) })
  test.beforeEach(() => { hits.length = 0 })

  test('blocks inline script and eval without executing their payloads', async ({ page }) => {
    const violations: { directive: string; blockedURI: string }[] = []
    await observePolicy(page, violations)
    // Only fixture JavaScript is fulfilled here; document/worker headers come
    // from the real preview host. The browser, not CDP evaluation, executes eval.
    await page.route('**/__security-test__/eval.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "try { (0, eval)('window.__securityProbe.evalRan = true') } catch (error) { window.__securityProbe.evalError = error.name } window.__securityProbe.evalFinished = true",
    }))
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
    await page.evaluate(() => {
      const inline = document.createElement('script')
      inline.textContent = 'window.__securityProbe.inline = true'
      document.head.append(inline)
      const probe = document.createElement('script')
      probe.src = '/__security-test__/eval.js'
      document.head.append(probe)
    })
    await expect.poll(() => page.evaluate(() => window.__securityProbe.evalFinished)).toBe(true)
    expect(await page.evaluate(() => window.__securityProbe)).toEqual({ evalError: 'EvalError', evalFinished: true })
    await expect.poll(() => violations.map(value => value.blockedURI)).toEqual(expect.arrayContaining(['inline', 'eval']))
    expect(violations.every(value => value.directive.startsWith('script-src'))).toBe(true)
  })

  test('blocks cross-origin scripts and fetch before sending requests', async ({ page }) => {
    const violations: { directive: string; blockedURI: string }[] = []
    await observePolicy(page, violations)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
    const fetchResult = await page.evaluate(async origin => {
      const script = document.createElement('script')
      script.src = `${origin}/probe.js`
      document.head.append(script)
      try { await fetch(`${origin}/collect`); return 'sent' } catch { return 'blocked' }
    }, remoteOrigin)
    expect(fetchResult).toBe('blocked')
    await expect.poll(() => violations.map(value => value.directive)).toEqual(expect.arrayContaining(['script-src-elem', 'connect-src']))
    expect(violations.map(value => value.blockedURI)).toEqual(expect.arrayContaining([`${remoteOrigin}/probe.js`, `${remoteOrigin}/collect`]))
    expect(await page.evaluate(() => window.__securityProbe.external)).toBeUndefined()
    expect(hits).toEqual([])
  })

  test('refuses cross-origin framing while direct navigation remains usable', async ({ page }) => {
    const messages: string[] = []
    page.on('console', message => messages.push(message.text()))
    await page.goto(`${remoteOrigin}/frame`)
    await expect.poll(() => messages.some(message => /frame-ancestors|X-Frame-Options/.test(message))).toBe(true)
    await expect(page.locator('iframe')).toHaveCount(1)
    await expect(page.frameLocator('iframe').locator('#app')).toHaveCount(0)
    expect(page.frames().some(frame => frame.url().startsWith('chrome-error://'))).toBe(true)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '活動加碼追蹤', exact: true })).toBeVisible()
  })
})

test('preserves bookkeeping, backups and offline reopening without policy violations', async ({ page, context }) => {
  const violations: { directive: string; blockedURI: string }[] = []
  const errors: string[] = []
  await observePolicy(page, violations)
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  const backup = {
    schemaVersion: 1, exportedAt: '2026-10-29T04:00:00.000Z',
    cards: [{ id: 'security-card', name: '安全標頭測試卡', cycleMode: 'billing-day', closingDay: 15, archived: false }],
    activities: [{ id: 'security-activity', cardId: 'security-card', name: '加碼活動', note: '保留備註', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false }],
    transactions: [],
  }
  async function restore(target: Page, content: string) {
    await target.goto('/#/settings')
    await target.getByLabel('選擇 JSON 備份').setInputFiles({ name: 'security-backup.json', mimeType: 'application/json', buffer: Buffer.from(content) })
    await expect(target.locator('.import-preview')).toBeVisible()
    target.once('dialog', dialog => dialog.accept())
    await target.getByRole('button', { name: '確認取代全部資料', exact: true }).click()
    await expect(target.getByRole('status')).toContainText('備份已還原')
  }
  async function purchase(target: Page, amount: string) {
    await target.goto('/#/cards/security-card')
    await target.getByRole('link', { name: '新增消費', exact: true }).click()
    await target.getByLabel('消費金額（台幣）', { exact: true }).fill(amount)
    await target.getByRole('button', { name: '儲存消費', exact: true }).click()
  }
  await restore(page, JSON.stringify(backup))
  await expect(page.getByText('離線可用', { exact: true })).toBeVisible()
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL)).toBe('http://localhost:4173/sw.js')
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!
    return (await fetch(link.href)).json()
  })
  expect(manifest.name).toBe('BonusTrack 加碼額度追蹤')
  await purchase(page, '100')
  await expect(page.locator('.amount')).toContainText('8,233')
  await context.setOffline(true)
  await page.close()
  const offline = await context.newPage()
  await observePolicy(offline, violations)
  offline.on('pageerror', error => errors.push(error.message))
  await offline.clock.install({ time: new Date('2026-10-29T12:00:00+08:00') })
  await offline.goto('/#/cards/security-card')
  await expect(offline.locator('.amount')).toContainText('8,233')
  expect(await offline.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe('http://localhost:4173/sw.js')
  // Confirm the offline cached HTML retained the same policy, not merely the UI.
  await offline.evaluate(() => {
    const probe = document.createElement('script')
    probe.textContent = 'window.__securityProbe.inline = true'
    document.head.append(probe)
  })
  await expect.poll(() => violations.filter(value => value.blockedURI === 'inline').length).toBe(1)
  expect(await offline.evaluate(() => window.__securityProbe.inline)).toBeUndefined()
  const expectedOfflineProbe = violations.pop()!
  expect(expectedOfflineProbe.directive).toBe('script-src-elem')
  await purchase(offline, '50')
  await expect(offline.locator('.amount')).toContainText('8,183')
  await offline.goto('/#/settings')
  const pendingDownload = offline.waitForEvent('download')
  await offline.getByRole('button', { name: '匯出 JSON 備份', exact: true }).click()
  const download = await pendingDownload
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(exported.cards).toEqual(backup.cards)
  expect(exported.activities).toEqual(backup.activities)
  expect(exported.transactions.map((value: { amountMinor: number }) => value.amountMinor).sort((a: number, b: number) => a - b)).toEqual([5000, 10000])
  await restore(offline, JSON.stringify(exported))
  await offline.goto('/#/cards/security-card')
  await expect(offline.locator('.amount')).toContainText('8,183')
  await expect(offline.locator('.purchase-list li')).toHaveCount(2)
  expect(errors).toEqual([])
  expect(violations).toEqual([])
  await context.setOffline(false)
})
