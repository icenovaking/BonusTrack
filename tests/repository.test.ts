import 'fake-indexeddb/auto'
import { deleteDB, openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataError, parseBackup, Repository, validateDataset } from '../src/data/repository'
import type { Activity, Backup, Card, Dataset, Purchase } from '../src/domain/models'
import { calculateRemaining, deriveSpendLimit } from '../src/domain/money'

const today = '2026-11-20'
const card: Card = { id: 'c1', name: '旅遊卡', cycleMode: 'billing-day', closingDay: 15, archived: false }
const activity: Activity = { id: 'a1', cardId: 'c1', name: '日本商店', note: '', rewardCapMinor: 50000, bonusRateBasisPoints: 600, archived: false }
const purchase: Purchase = { id: 'p1', cardId: 'c1', activityId: 'a1', spentOn: '2026-11-15', amountMinor: 10000, note: '午餐', overridePeriodEnd: null }
const makeData = (): Dataset => structuredClone({ cards: [card], activities: [activity], transactions: [purchase] })
const makeBackup = (): Backup => ({ ...makeData(), schemaVersion: 1, exportedAt: '2026-11-20T12:00:00.000Z' })

describe('Activity note compatibility', () => {
  it('normalizes missing and whitespace notes without mutating caller data', () => {
    const legacy = makeData()
    delete (legacy.activities[0] as Partial<Activity>).note
    const normalized = validateDataset(legacy)
    expect(normalized).toEqual(makeData())
    expect(legacy.activities[0]).not.toHaveProperty('note')
    const blank = makeData()
    blank.activities[0]!.note = ' \n\t '
    expect(validateDataset(blank)).toEqual(makeData())
    expect(blank.activities[0]!.note).toBe(' \n\t ')
    const multiline = makeData()
    multiline.activities[0]!.note = '  需先登錄\n限實體刷卡  '
    expect(validateDataset(multiline).activities[0]!.note).toBe('  需先登錄\n限實體刷卡  ')
  })

  it('loads legacy IndexedDB and version 1 backups with empty notes and intact history', async () => {
    await seed()
    const db = await openDB(name, 1)
    const { note: _note, ...legacyActivity } = activity
    await db.put('activities', legacyActivity)
    db.close()
    await repository.close()
    repository = new Repository(name)
    expect(await repository.load()).toEqual(makeData())
    const backup = { ...makeBackup(), activities: [legacyActivity] }
    expect(parseBackup(JSON.stringify(backup))).toEqual(makeBackup())
    await repository.replaceFromBackup(backup as Backup)
    expect(await repository.load()).toEqual(makeData())
  })

  it.each([null, 12, true, [], {}])('rejects a present non-string note %j and preserves committed data', async invalid => {
    await seed()
    const backup = makeBackup()
    ;(backup.activities[0] as unknown as { note: unknown }).note = invalid
    expect(() => parseBackup(JSON.stringify(backup))).toThrow('活動備註')
    expect(() => repository.replaceFromBackup(backup)).toThrow('活動備註')
    await expect(repository.saveActivity(backup.activities[0]!)).rejects.toMatchObject({ code: 'validation' })
    expect(await repository.load()).toEqual(makeData())
  })
})

describe('Activity note persistence', () => {
  it('edits, clears and isolates notes with purchase history while preserving allowance and rules', async () => {
    await seed()
    await repository.saveActivity({ ...activity, id: 'a2', name: '網購', note: '另一活動' })
    await repository.saveActivity({ ...activity, note: '需先登錄\n限實體刷卡' })
    await repository.saveActivity({ ...activity, note: '已登錄' })
    const loaded = await repository.load()
    expect(loaded.cards).toEqual([card])
    expect(loaded.transactions).toEqual([purchase])
    expect(loaded.activities.find(value => value.id === 'a1')).toEqual({ ...activity, note: '已登錄' })
    expect(loaded.activities.find(value => value.id === 'a2')!.note).toBe('另一活動')
    expect(calculateRemaining(deriveSpendLimit(loaded.activities.find(value => value.id === 'a1')!), loaded.transactions)).toBe(823300)
    await expect(repository.saveActivity({ ...activity, note: '改規則', rewardCapMinor: 60000 })).rejects.toThrow('已有消費紀錄')
    expect((await repository.load()).activities.find(value => value.id === 'a1')!.note).toBe('已登錄')
    await repository.saveActivity({ ...activity, note: ' \n\t' })
    expect((await repository.load()).activities.find(value => value.id === 'a1')!.note).toBe('')
  })

  it('reopens multiline notes and preserves them through rename, archive and repeated backup replacement', async () => {
    await seed()
    const note = '需先登錄\n限實體刷卡'
    await repository.saveActivity({ ...activity, note })
    const saved = (await repository.load()).activities[0]!
    await repository.saveActivity({ ...saved, name: '日本指定商店', archived: true })
    await repository.saveActivity({ ...activity, id: 'a2', note: '網購提醒' })
    const expected = await repository.load()
    await repository.close()
    repository = new Repository(name)
    expect(await repository.load()).toEqual(expected)
    const exported = await repository.exportBackup()
    expect(exported.schemaVersion).toBe(1)
    expect(exported.activities.find(value => value.id === 'a1')).toEqual({ ...activity, name: '日本指定商店', note, archived: true })
    await repository.replaceFromBackup({ ...makeBackup(), activities: [{ ...activity, note: '取代內容' }] })
    await repository.replaceFromBackup(parseBackup(JSON.stringify(exported)))
    await repository.replaceFromBackup(parseBackup(JSON.stringify(exported)))
    expect(await repository.load()).toEqual(expected)
    expect(calculateRemaining(deriveSpendLimit(activity), (await repository.load()).transactions)).toBe(823300)
  })

  it('keeps the committed note on failed edit and replacement and permits retry', async () => {
    await seed()
    await repository.saveActivity({ ...activity, note: '原提醒' })
    const before = await repository.load()
    for (const operation of [
      () => repository.saveActivity({ ...activity, note: '已登錄' }),
      () => repository.replaceFromBackup({ ...makeBackup(), activities: [{ ...activity, note: '還原提醒' }] }),
    ]) {
      const write = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
        throw new DOMException('Injected note write failure', 'QuotaExceededError')
      })
      await expect(operation()).rejects.toMatchObject({ code: 'storage' })
      write.mockRestore()
      expect(await repository.load()).toEqual(before)
    }
    await repository.saveActivity({ ...activity, note: '已登錄' })
    expect((await repository.load()).activities).toEqual([{ ...activity, note: '已登錄' }])
    expect((await repository.load()).transactions).toEqual([purchase])
  })
})

let counter = 0
let name: string
let repository: Repository
beforeEach(() => {
  name = `bonus-repository-test-${++counter}`
  repository = new Repository(name)
})
afterEach(async () => {
  vi.restoreAllMocks()
  await repository.close()
  await deleteDB(name)
})
async function seed(withPurchase = true): Promise<void> {
  await repository.saveCard(card)
  await repository.saveActivity(activity)
  if (withPurchase) await repository.saveTransaction(purchase, today)
}

describe('Repository persistence and atomicity', () => {
  it('restores saved purchases after reopening and recomputes the remaining allowance', async () => {
    await seed()
    await repository.close()
    repository = new Repository(name)
    const loaded = await repository.load()
    expect(loaded).toEqual(makeData())
    expect(calculateRemaining(deriveSpendLimit(loaded.activities[0]!), loaded.transactions)).toBe(823300)
    expect(Object.keys(loaded)).toEqual(['cards', 'activities', 'transactions'])
  })

  it('rejects a simultaneous save without inserting a second purchase', async () => {
    await seed(false)
    const pending = repository.saveTransaction(purchase, today)
    await expect(repository.saveTransaction({ ...purchase, id: 'p2' }, today))
      .rejects.toMatchObject({ code: 'busy' })
    await pending
    expect((await repository.load()).transactions).toEqual([purchase])
  })

  it('aborts a failed write after clearing stores and preserves all previously committed records', async () => {
    await seed()
    const write = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('Injected quota failure', 'QuotaExceededError')
    })
    await expect(repository.saveTransaction({ ...purchase, amountMinor: 20000 }, today))
      .rejects.toMatchObject({ code: 'storage' })
    write.mockRestore()
    expect(await repository.load()).toEqual(makeData())
    await repository.saveTransaction({ ...purchase, amountMinor: 20000 }, today)
    expect((await repository.load()).transactions[0]!.amountMinor).toBe(20000)
  })

  it('reports read failures without overwriting data and allows retry', async () => {
    await seed()
    const read = vi.spyOn(IDBObjectStore.prototype, 'getAll').mockImplementationOnce(() => {
      throw new DOMException('Injected read failure', 'UnknownError')
    })
    await expect(repository.load()).rejects.toMatchObject({ code: 'storage' })
    read.mockRestore()
    expect(await repository.load()).toEqual(makeData())
  })
})

describe('Repository configuration and purchase validation', () => {
  it('trims card and activity names while preserving independent activity limits', async () => {
    await repository.saveCard({ ...card, name: '  旅遊卡  ' })
    await repository.saveActivity({ ...activity, name: ' 日本商店 ' })
    await repository.saveActivity({ ...activity, id: 'a2', name: '網購', rewardCapMinor: 30000, bonusRateBasisPoints: 300 })
    const loaded = await repository.load()
    expect(loaded.cards[0]!.name).toBe('旅遊卡')
    expect(loaded.activities.map(value => [value.name, deriveSpendLimit(value)]))
      .toEqual([['日本商店', 833300], ['網購', 1000000]])
  })

  it('rejects blank names and invalid caps and percentages without changing committed settings', async () => {
    await seed(false)
    await expect(repository.saveCard({ ...card, name: '  ' })).rejects.toThrow()
    await expect(repository.saveActivity({ ...activity, name: ' ' })).rejects.toThrow()
    await expect(repository.saveActivity({ ...activity, rewardCapMinor: -1 })).rejects.toThrow()
    await expect(repository.saveActivity({ ...activity, bonusRateBasisPoints: 0 })).rejects.toThrow()
    await expect(repository.saveActivity({ ...activity, bonusRateBasisPoints: 10001 })).rejects.toThrow()
    expect(await repository.load()).toEqual({ cards: [card], activities: [activity], transactions: [] })
  })

  it('rejects future or impossible purchase dates and nonpositive amounts without adding records', async () => {
    await seed(false)
    await expect(repository.saveTransaction({ ...purchase, spentOn: '2026-11-21' }, today)).rejects.toThrow()
    await expect(repository.saveTransaction({ ...purchase, spentOn: '2026-02-30' }, today)).rejects.toThrow()
    await expect(repository.saveTransaction({ ...purchase, amountMinor: 0 }, today)).rejects.toThrow()
    expect((await repository.load()).transactions).toEqual([])
  })

  it('rejects an activity belonging to another card and preserves the original purchase', async () => {
    await seed()
    await repository.saveCard({ ...card, id: 'c2', name: '另一張卡' })
    await repository.saveActivity({ ...activity, id: 'a2', cardId: 'c2' })
    await expect(repository.saveTransaction({ ...purchase, activityId: 'a2' }, today)).rejects.toThrow('消費活動不屬於這張卡。')
    expect((await repository.load()).transactions).toEqual([purchase])
  })

  it('locks referenced financial rules and cycle settings but still allows renaming', async () => {
    await seed()
    await expect(repository.saveCard({ ...card, closingDay: 16 })).rejects.toThrow('已有消費紀錄')
    await expect(repository.saveActivity({ ...activity, rewardCapMinor: 60000 })).rejects.toThrow('已有消費紀錄')
    await expect(repository.saveActivity({ ...activity, bonusRateBasisPoints: 700 })).rejects.toThrow('已有消費紀錄')
    await repository.saveCard({ ...card, name: '新卡名' })
    await repository.saveActivity({ ...activity, name: '新活動名' })
    const loaded = await repository.load()
    expect(loaded.cards[0]).toEqual({ ...card, name: '新卡名' })
    expect(loaded.activities[0]).toEqual({ ...activity, name: '新活動名' })
    expect(loaded.transactions).toEqual([purchase])
  })

  it('allows changing unreferenced rules before any purchase history exists', async () => {
    await seed(false)
    await repository.saveCard({ ...card, cycleMode: 'calendar-month', closingDay: null })
    await repository.saveActivity({ ...activity, rewardCapMinor: 30000, bonusRateBasisPoints: 300 })
    const loaded = await repository.load()
    expect(loaded.cards[0]!.cycleMode).toBe('calendar-month')
    expect(deriveSpendLimit(loaded.activities[0]!)).toBe(1000000)
  })

  it('rejects new or incoming archived activity purchases while allowing edits and deletion of existing history', async () => {
    await seed()
    await repository.saveTransaction({ ...purchase, id: 'p2', activityId: null }, today)
    await repository.saveActivity({ ...activity, archived: true })
    await expect(repository.saveTransaction({ ...purchase, id: 'p3' }, today)).rejects.toThrow('封存活動')
    await expect(repository.saveTransaction({ ...purchase, id: 'p2' }, today)).rejects.toThrow('封存活動')
    await repository.saveTransaction({ ...purchase, amountMinor: 20000 }, today)
    expect((await repository.load()).transactions.find(value => value.id === 'p1')!.amountMinor).toBe(20000)
    await repository.deleteTransaction('p1')
    expect((await repository.load()).transactions).toEqual([{ ...purchase, id: 'p2', activityId: null }])
  })

  it('preserves archived card history and rejects new purchases and activities', async () => {
    await seed()
    await repository.saveCard({ ...card, archived: true })
    await expect(repository.saveTransaction({ ...purchase, id: 'p2' }, today)).rejects.toThrow('封存卡片')
    await expect(repository.saveActivity({ ...activity, id: 'a2' })).rejects.toThrow('封存卡片')
    await repository.saveTransaction({ ...purchase, note: '更正備註' }, today)
    expect((await repository.load()).transactions).toEqual([{ ...purchase, note: '更正備註' }])
    await repository.deleteTransaction('p1')
    expect((await repository.load()).transactions).toEqual([])
  })

  it('prevents deleting referenced cards or activities and cascades deletion for unreferenced cards', async () => {
    await seed()
    await expect(repository.deleteCard('c1')).rejects.toThrow('已有消費紀錄')
    await expect(repository.deleteActivity('a1')).rejects.toThrow('已有消費紀錄')
    await repository.saveCard({ ...card, id: 'c2' })
    await repository.saveActivity({ ...activity, id: 'a2', cardId: 'c2' })
    await repository.deleteCard('c2')
    expect(await repository.load()).toEqual(makeData())
  })
})

const invalidMutations: [string, (data: Dataset) => void][] = [
  ['duplicate IDs', data => { data.cards.push({ ...data.cards[0]! }) }],
  ['blank ID', data => { data.transactions[0]!.id = ' ' }],
  ['blank name', data => { data.cards[0]!.name = ' ' }],
  ['invalid closing day', data => { data.cards[0]!.closingDay = 32 }],
  ['missing activity card', data => { data.activities[0]!.cardId = 'missing' }],
  ['missing purchase card', data => { data.transactions[0]!.cardId = 'missing' }],
  ['missing activity reference', data => { data.transactions[0]!.activityId = 'missing' }],
  ['negative cap', data => { data.activities[0]!.rewardCapMinor = -1 }],
  ['zero rate', data => { data.activities[0]!.bonusRateBasisPoints = 0 }],
  ['excessive rate', data => { data.activities[0]!.bonusRateBasisPoints = 10001 }],
  ['fractional minor units', data => { data.transactions[0]!.amountMinor = 100.5 }],
  ['unsafe amount', data => { data.transactions[0]!.amountMinor = Number.MAX_SAFE_INTEGER + 1 }],
  ['impossible date', data => { data.transactions[0]!.spentOn = '2026-02-30' }],
  ['nonadjacent override', data => { data.transactions[0]!.overridePeriodEnd = '2027-01-15' }],
  ['mismatched activity card', data => {
    data.cards.push({ ...card, id: 'c2' })
    data.activities[0]!.cardId = 'c2'
  }],
]

describe('validateDataset and backup import', () => {
  it('returns an independent clone and strips derived top-level state', () => {
    const input = { ...makeData(), remainingMinor: 823300 }
    const validated = validateDataset(input)
    input.cards[0]!.name = '外部修改'
    input.transactions[0]!.amountMinor = 1
    expect(validated).toEqual(makeData())
    expect('remainingMinor' in validated).toBe(false)
  })

  it.each(invalidMutations)('rejects %s before changing persisted data', async (_label, mutate) => {
    await seed()
    const invalid = makeBackup()
    mutate(invalid)
    expect(() => validateDataset(invalid)).toThrow()
    expect(() => repository.replaceFromBackup(invalid)).toThrow()
    expect(await repository.load()).toEqual(makeData())
  })

  it('rejects an unsafe aggregate even when each individual amount is safe', () => {
    const data = makeData()
    data.transactions[0]!.amountMinor = Number.MAX_SAFE_INTEGER
    data.transactions.push({ ...purchase, id: 'p2', amountMinor: 1 })
    expect(() => validateDataset(data)).toThrow('累計消費超出可處理範圍。')
  })

  it.each([
    ['malformed JSON', '{'],
    ['unsupported version', JSON.stringify({ ...makeBackup(), schemaVersion: 2 })],
    ['invalid export timestamp', JSON.stringify({ ...makeBackup(), exportedAt: 'invalid' })],
    ['missing lists', JSON.stringify({ schemaVersion: 1, exportedAt: '2026-11-20T12:00:00Z' })],
  ])('rejects %s with a validation error', (_label, input) => {
    expect(() => parseBackup(input)).toThrow(DataError)
    try { parseBackup(input) } catch (error) {
      expect(error).toMatchObject({ code: 'validation' })
    }
  })

  it('exports and parses all archived history, notes and manual period overrides', async () => {
    const backup = makeBackup()
    backup.cards[0]!.archived = true
    backup.activities[0]!.archived = true
    backup.transactions[0]!.overridePeriodEnd = '2026-12-15'
    backup.transactions[0]!.note = '日本消費 / 手動移至下期'
    await repository.replaceFromBackup(backup)
    const exported = await repository.exportBackup()
    expect(exported.schemaVersion).toBe(1)
    expect(Number.isFinite(Date.parse(exported.exportedAt))).toBe(true)
    expect(parseBackup(JSON.stringify(exported))).toEqual(exported)
    expect(exported.cards).toEqual(backup.cards)
    expect(exported.activities).toEqual(backup.activities)
    expect(exported.transactions).toEqual(backup.transactions)
  })

  it('replaces instead of appending and repeated import does not double spending', async () => {
    await seed()
    await repository.saveTransaction({ ...purchase, id: 'old-extra' }, today)
    const backup = makeBackup()
    await repository.replaceFromBackup(backup)
    await repository.replaceFromBackup(backup)
    const loaded = await repository.load()
    expect(loaded).toEqual(makeData())
    expect(calculateRemaining(deriveSpendLimit(loaded.activities[0]!), loaded.transactions)).toBe(823300)
  })

  it('rolls back a replacement write failure and preserves the complete previous dataset', async () => {
    await seed()
    const replacement = makeBackup()
    replacement.cards[0]!.name = '替代卡片'
    replacement.transactions[0]!.amountMinor = 20000
    const write = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('Injected import failure', 'QuotaExceededError')
    })
    await expect(repository.replaceFromBackup(replacement)).rejects.toMatchObject({ code: 'storage' })
    write.mockRestore()
    expect(await repository.load()).toEqual(makeData())
  })

  it('restores valid stored dates without rejecting them against the current local date', async () => {
    const backup = makeBackup()
    backup.transactions[0]!.spentOn = '2099-11-15'
    await repository.replaceFromBackup(backup)
    expect((await repository.load()).transactions[0]!.spentOn).toBe('2099-11-15')
  })
})
