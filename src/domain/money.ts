import type { Activity, Purchase } from './models'

export function assertMinor(value: number, positive = false): number {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) throw new Error('金額超出範圍或格式不正確。')
  return value
}
export function parseMoney(input: string, positive = false): number {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim())) throw new Error('請輸入台幣金額，最多兩位小數。')
  const [whole, fraction = ''] = input.trim().split('.')
  const minor = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'))
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('金額超出可處理範圍。')
  return assertMinor(Number(minor), positive)
}
export function parseRate(input: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim())) throw new Error('加碼百分比請輸入數字，最多兩位小數。')
  const rate = parseMoney(input)
  if (rate === 0 || rate > 10000) throw new Error('加碼百分比須大於 0 且不超過 100%。')
  return rate
}
export function deriveSpendLimit(activity: Pick<Activity, 'rewardCapMinor' | 'bonusRateBasisPoints'>): number {
  assertMinor(activity.rewardCapMinor)
  assertMinor(activity.bonusRateBasisPoints, true)
  if (activity.bonusRateBasisPoints > 10000) throw new Error('加碼百分比超出範圍。')
  const wholeTwd = BigInt(activity.rewardCapMinor) * 100n / BigInt(activity.bonusRateBasisPoints)
  const result = wholeTwd * 100n
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('可刷上限超出可處理範圍。')
  return Number(result)
}
export function calculateRemaining(limitMinor: number, purchases: Pick<Purchase, 'amountMinor'>[]): number {
  assertMinor(limitMinor)
  let total = 0n
  for (const purchase of purchases) total += BigInt(assertMinor(purchase.amountMinor, true))
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('累計消費超出可處理範圍。')
  return Math.max(0, limitMinor - Number(total))
}
export function money(value: number): string {
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(value / 100)
}
export function inputMoney(value: number): string { return String(value / 100) }
