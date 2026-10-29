import type { Card, Purchase } from './models'

export interface Period { start: string; end: string }
const pad = (n: number) => String(n).padStart(2, '0')
function dateString(y: number, m: number, d: number): string { return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}` }
function daysInMonth(y: number, m: number): number { return new Date(Date.UTC(y, m, 0)).getUTCDate() }
export function assertDate(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new Error('日期格式須為 YYYY-MM-DD。')
  const [y, m, d] = input.split('-').map(Number) as [number, number, number]
  if (y < 1900 || y > 9998 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) throw new Error('日期不存在或超出範圍。')
  return input
}
function shiftMonth(y: number, m: number, delta: number): [number, number] {
  const date = new Date(Date.UTC(y, m - 1 + delta, 1))
  return [date.getUTCFullYear(), date.getUTCMonth() + 1]
}
function closeAt(card: Card, y: number, m: number): string {
  const day = card.cycleMode === 'calendar-month' ? 31 : card.closingDay
  if (!day || !Number.isInteger(day) || day < 1 || day > 31) throw new Error('請設定 1 至 31 的結帳日。')
  return dateString(y, m, Math.min(day, daysInMonth(y, m)))
}
function nextDate(input: string): string {
  const [y, m, d] = input.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d + 1))
  return dateString(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}
export function periodEnding(card: Card, end: string): Period {
  assertDate(end)
  const [y, m] = end.split('-').map(Number) as [number, number]
  if (closeAt(card, y, m) !== end) throw new Error('所屬期別不是有效結帳日。')
  const [py, pm] = shiftMonth(y, m, -1)
  return { start: nextDate(closeAt(card, py, pm)), end }
}
export function resolvePeriod(card: Card, spentOn: string, offset = 0): Period {
  assertDate(spentOn)
  let [y, m] = spentOn.split('-').map(Number) as [number, number]
  if (spentOn > closeAt(card, y, m)) [y, m] = shiftMonth(y, m, 1)
  ;[y, m] = shiftMonth(y, m, offset)
  return periodEnding(card, closeAt(card, y, m))
}
export function purchasePeriod(card: Card, purchase: Pick<Purchase, 'spentOn' | 'overridePeriodEnd'>): Period {
  const derived = resolvePeriod(card, purchase.spentOn)
  if (!purchase.overridePeriodEnd) return derived
  const allowed = [-1, 0, 1].map(offset => resolvePeriod(card, purchase.spentOn, offset).end)
  if (!allowed.includes(purchase.overridePeriodEnd)) throw new Error('只能調整至消費日期對應的前一期或下一期。')
  return periodEnding(card, purchase.overridePeriodEnd)
}
export function localToday(date = new Date()): string { return dateString(date.getFullYear(), date.getMonth() + 1, date.getDate()) }
export function periodLabel(period: Period): string { return `${period.start.replaceAll('-', '/')} – ${period.end.replaceAll('-', '/')}` }
