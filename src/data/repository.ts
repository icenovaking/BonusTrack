import { openDB, type IDBPDatabase, type IDBPTransaction } from 'idb'
import { emptyDataset, type Activity, type Backup, type Card, type Dataset, type Purchase } from '../domain/models'
import { assertMinor, calculateRemaining, deriveSpendLimit } from '../domain/money'
import { assertDate, localToday, purchasePeriod } from '../domain/periods'

export class DataError extends Error {
  constructor(public code: 'validation' | 'storage' | 'busy', message: string) { super(message) }
}
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DataError('validation', message)
}
function text(value: unknown, label: string, nonempty = true): asserts value is string {
  requireValue(typeof value === 'string' && (!nonempty || value.trim().length > 0), `${label}不可空白或格式不正確。`)
}
function uniqueIds(items: { id: string }[]): void {
  const ids = new Set<string>()
  for (const item of items) {
    requireValue(item && typeof item === 'object', '資料項目格式不正確。')
    text(item.id, '識別碼')
    requireValue(!ids.has(item.id), '備份內有重複識別碼。')
    ids.add(item.id)
  }
}
export function validateDataset(input: unknown): Dataset {
  requireValue(input && typeof input === 'object', '資料格式不正確。')
  const data = structuredClone(input) as Dataset
  requireValue(Array.isArray(data.cards) && Array.isArray(data.activities) && Array.isArray(data.transactions), '備份缺少卡片、活動或消費列表。')
  uniqueIds(data.cards); uniqueIds(data.activities); uniqueIds(data.transactions)
  for (const card of data.cards) {
    text(card.name, '卡片名稱')
    requireValue(typeof card.archived === 'boolean', '封存狀態不正確。')
    requireValue(card.cycleMode === 'calendar-month' || card.cycleMode === 'billing-day', '週期類型不正確。')
    requireValue(card.cycleMode === 'calendar-month' ? card.closingDay === null : Number.isInteger(card.closingDay) && card.closingDay! >= 1 && card.closingDay! <= 31, '結帳日須為 1 至 31。')
  }
  const cards = new Map(data.cards.map(card => [card.id, card]))
  for (const activity of data.activities) {
    text(activity.name, '活動名稱')
    if (activity.note === undefined) activity.note = ''
    text(activity.note, '活動備註', false)
    if (!activity.note.trim()) activity.note = ''
    requireValue(cards.has(activity.cardId), '活動找不到所屬卡片。')
    requireValue(typeof activity.archived === 'boolean', '活動封存狀態不正確。')
    deriveSpendLimit(activity)
  }
  const activities = new Map(data.activities.map(activity => [activity.id, activity]))
  const groups = new Map<string, Purchase[]>()
  for (const purchase of data.transactions) {
    const card = cards.get(purchase.cardId)
    requireValue(card, '消費找不到所屬卡片。')
    assertDate(purchase.spentOn); assertMinor(purchase.amountMinor, true); text(purchase.note, '備註', false)
    requireValue(purchase.overridePeriodEnd === null || typeof purchase.overridePeriodEnd === 'string', '所屬期別格式不正確。')
    const period = purchasePeriod(card, purchase)
    requireValue(purchase.activityId === null || activities.get(purchase.activityId)?.cardId === card.id, '消費活動不屬於這張卡。')
    const key = JSON.stringify([card.id, purchase.activityId, period.end])
    const group = groups.get(key) ?? []
    group.push(purchase); groups.set(key, group)
  }
  for (const group of groups.values()) calculateRemaining(0, group)
  return structuredClone({ cards: data.cards, activities: data.activities, transactions: data.transactions })
}
export function parseBackup(input: string): Backup {
  let parsed: unknown
  try { parsed = JSON.parse(input) } catch { throw new DataError('validation', '無法讀取 JSON，請選擇 BonusTrack 匯出的備份。') }
  requireValue(parsed && typeof parsed === 'object', '備份格式不正確。')
  const backup = parsed as Backup
  requireValue(backup.schemaVersion === 1, '不支援這份備份版本，原資料未變更。')
  text(backup.exportedAt, '匯出時間')
  requireValue(Number.isFinite(Date.parse(backup.exportedAt)), '匯出時間格式不正確。')
  return { ...validateDataset(backup), schemaVersion: 1, exportedAt: backup.exportedAt }
}

const stores = ['cards', 'activities', 'transactions'] as const
export class Repository {
  private db: Promise<IDBPDatabase> | undefined
  private pending = false
  constructor(private readonly name = 'bonus-track') {}
  private connect(): Promise<IDBPDatabase> {
    if (!this.db) this.db = openDB(this.name, 1, {
      upgrade(db) {
        for (const name of stores) db.createObjectStore(name, { keyPath: 'id' })
        db.createObjectStore('meta')
      },
      blocking: () => { void this.close() },
      terminated: () => { this.db = undefined },
    }).catch(error => { this.db = undefined; throw error })
    return this.db
  }
  async close(): Promise<void> { if (this.db) (await this.db).close(); this.db = undefined }
  async load(): Promise<Dataset> {
    try {
      const db = await this.connect()
      const tx = db.transaction([...stores], 'readonly')
      const [cards, activities, transactions] = await Promise.all(stores.map(name => tx.objectStore(name).getAll()))
      await tx.done
      return validateDataset({ cards, activities, transactions })
    } catch (error) { throw this.failure(error, '無法讀取本機資料。請重試，勿清除瀏覽器資料。') }
  }
  private failure(error: unknown, fallback: string): DataError {
    return error instanceof DataError ? error : new DataError('storage', `${fallback} ${error instanceof Error ? error.message : ''}`)
  }
  private async commit(change: (data: Dataset) => Dataset | void): Promise<Dataset> {
    if (this.pending) throw new DataError('busy', '資料正在儲存，請稍候。')
    this.pending = true
    let tx: IDBPTransaction<unknown, string[], 'readwrite'> | undefined
    try {
      const db = await this.connect()
      tx = db.transaction([...stores, 'meta'], 'readwrite')
      const [cards, activities, transactions] = await Promise.all(stores.map(name => tx!.objectStore(name).getAll()))
      const current = { cards, activities, transactions } as Dataset
      let next: Dataset
      try { next = validateDataset(change(current) ?? current) }
      catch (error) { throw new DataError('validation', error instanceof Error ? error.message : '輸入資料不正確。') }
      for (const store of stores) {
        await tx.objectStore(store).clear()
        for (const record of next[store]) await tx.objectStore(store).put(record)
      }
      await tx.objectStore('meta').put(1, 'schemaVersion')
      await tx.done
      return next
    } catch (error) {
      if (tx) { try { tx.abort() } catch { /* A completed or aborted transaction cannot abort twice. */ } await tx.done.catch(() => {}) }
      throw this.failure(error, '儲存失敗，原資料未變更。請保留輸入並重試。')
    } finally { this.pending = false }
  }
  saveCard(card: Card): Promise<Dataset> {
    return this.commit(data => {
      const existing = data.cards.find(value => value.id === card.id)
      if (existing && data.transactions.some(value => value.cardId === card.id)) {
        requireValue(existing.cycleMode === card.cycleMode && existing.closingDay === card.closingDay, '已有消費紀錄，無法變更週期。請新增卡片保留歷史。')
      }
      data.cards = [...data.cards.filter(value => value.id !== card.id), { ...card, name: card.name.trim() }]
    })
  }
  saveActivity(activity: Omit<Activity, 'note'> & { note?: string }): Promise<Dataset> {
    return this.commit(data => {
      if (activity.note !== undefined) text(activity.note, '活動備註', false)
      const card = data.cards.find(value => value.id === activity.cardId)
      requireValue(card, '找不到卡片。')
      const existing = data.activities.find(value => value.id === activity.id)
      requireValue(!card.archived || existing, '封存卡片不能新增活動。')
      if (existing) requireValue(existing.cardId === activity.cardId, '無法移動活動所屬卡片。')
      if (existing && data.transactions.some(value => value.activityId === activity.id)) {
        requireValue(existing.rewardCapMinor === activity.rewardCapMinor && existing.bonusRateBasisPoints === activity.bonusRateBasisPoints, '已有消費紀錄，請封存此活動並新增活動。')
      }
      data.activities = [...data.activities.filter(value => value.id !== activity.id), { ...activity, name: activity.name.trim(), note: activity.note ?? existing?.note ?? '' }]
    })
  }
  deleteCard(id: string): Promise<Dataset> {
    return this.commit(data => {
      requireValue(!data.transactions.some(value => value.cardId === id), '已有消費紀錄，請改用封存。')
      data.cards = data.cards.filter(value => value.id !== id)
      data.activities = data.activities.filter(value => value.cardId !== id)
    })
  }
  deleteActivity(id: string): Promise<Dataset> {
    return this.commit(data => {
      requireValue(!data.transactions.some(value => value.activityId === id), '已有消費紀錄，請改用封存。')
      data.activities = data.activities.filter(value => value.id !== id)
    })
  }
  saveTransaction(purchase: Purchase, today = localToday()): Promise<Dataset> {
    return this.commit(data => {
      assertDate(today); assertDate(purchase.spentOn)
      requireValue(purchase.spentOn <= today, '只能記錄今天或之前已發生的消費。')
      const card = data.cards.find(value => value.id === purchase.cardId)
      const existing = data.transactions.find(value => value.id === purchase.id)
      const activity = data.activities.find(value => value.id === purchase.activityId)
      requireValue(card, '找不到卡片。')
      if (existing) requireValue(existing.cardId === purchase.cardId, '消費不能移動至其他卡片。')
      requireValue(!card.archived || existing?.cardId === card.id, '封存卡片不能新增或移入消費。')
      requireValue(!activity?.archived || existing?.activityId === activity.id, '封存活動不能新增或移入消費。')
      data.transactions = [...data.transactions.filter(value => value.id !== purchase.id), purchase]
    })
  }
  deleteTransaction(id: string): Promise<Dataset> {
    return this.commit(data => { data.transactions = data.transactions.filter(value => value.id !== id) })
  }
  async exportBackup(): Promise<Backup> { return { ...await this.load(), schemaVersion: 1, exportedAt: new Date().toISOString() } }
  replaceFromBackup(backup: Backup): Promise<Dataset> {
    const validated = parseBackup(JSON.stringify(backup))
    return this.commit(() => validated)
  }
}
export const repository = new Repository()
export const freshData = emptyDataset
