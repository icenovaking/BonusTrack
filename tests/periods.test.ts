import { describe, expect, it, vi } from 'vitest'
import type { Card } from '../src/domain/models'
import {
  assertDate,
  localToday,
  periodEnding,
  periodLabel,
  purchasePeriod,
  resolvePeriod,
} from '../src/domain/periods'

const billingCard: Card = {
  id: 'card-1', name: '旅遊卡', cycleMode: 'billing-day', closingDay: 15, archived: false,
}
const calendarCard: Card = { ...billingCard, cycleMode: 'calendar-month', closingDay: null }
const monthEndCard: Card = { ...billingCard, closingDay: 31 }

describe('resolvePeriod', () => {
  it.each([
    ['2026-11-14', '2026-10-16', '2026-11-15'],
    ['2026-11-15', '2026-10-16', '2026-11-15'],
    ['2026-11-16', '2026-11-16', '2026-12-15'],
  ])('includes the closing day and rolls over the following day for %s', (date, start, end) => {
    expect(resolvePeriod(billingCard, date)).toEqual({ start, end })
  })

  it.each([
    ['2026-11-01', '2026-11-01', '2026-11-30'],
    ['2026-11-30', '2026-11-01', '2026-11-30'],
    ['2026-12-01', '2026-12-01', '2026-12-31'],
  ])('uses inclusive calendar month boundaries for %s', (date, start, end) => {
    expect(resolvePeriod(calendarCard, date)).toEqual({ start, end })
  })

  it.each([
    ['2027-02-28', '2027-02-01', '2027-02-28'],
    ['2027-03-01', '2027-03-01', '2027-03-31'],
    ['2028-02-29', '2028-02-01', '2028-02-29'],
    ['2028-03-01', '2028-03-01', '2028-03-31'],
    ['2026-04-30', '2026-04-01', '2026-04-30'],
  ])('clamps day 31 to the actual month end for %s', (date, start, end) => {
    expect(resolvePeriod(monthEndCard, date)).toEqual({ start, end })
  })

  it('resolves periods across a year boundary in both directions', () => {
    expect(resolvePeriod(billingCard, '2026-12-16')).toEqual({ start: '2026-12-16', end: '2027-01-15' })
    expect(resolvePeriod(billingCard, '2027-01-15', -1)).toEqual({ start: '2026-11-16', end: '2026-12-15' })
    expect(resolvePeriod(billingCard, '2026-12-15', 1)).toEqual({ start: '2026-12-16', end: '2027-01-15' })
  })

  it('supports day 1 billing without shifting a closing-day purchase', () => {
    const card = { ...billingCard, closingDay: 1 }
    expect(resolvePeriod(card, '2026-11-01')).toEqual({ start: '2026-10-02', end: '2026-11-01' })
    expect(resolvePeriod(card, '2026-11-02')).toEqual({ start: '2026-11-02', end: '2026-12-01' })
  })

  it.each([0, 32, 15.5, null])('rejects invalid billing closing day %s', (closingDay) => {
    expect(() => resolvePeriod({ ...billingCard, closingDay }, '2026-11-15')).toThrow('請設定 1 至 31 的結帳日。')
  })
})

describe('periodEnding', () => {
  it('reconstructs a period from a valid closing date', () => {
    expect(periodEnding(billingCard, '2026-11-15')).toEqual({ start: '2026-10-16', end: '2026-11-15' })
    expect(periodEnding(monthEndCard, '2028-02-29')).toEqual({ start: '2028-02-01', end: '2028-02-29' })
  })

  it('rejects a valid date that is not a card closing date', () => {
    expect(() => periodEnding(billingCard, '2026-11-14')).toThrow('所屬期別不是有效結帳日。')
    expect(() => periodEnding(calendarCard, '2026-11-15')).toThrow('所屬期別不是有效結帳日。')
  })

  it('rejects a nonexistent closing date', () => {
    expect(() => periodEnding(monthEndCard, '2027-02-29')).toThrow('日期不存在或超出範圍。')
  })
})

describe('assertDate', () => {
  it.each(['1900-01-01', '2026-11-15', '2028-02-29', '9998-12-31'])
    ('accepts and preserves the date-only value %s', (input) => {
      expect(assertDate(input)).toBe(input)
    })

  it.each(['2026-2-01', '2026-02-1', ' 2026-11-15', '2026-11-15T00:00:00Z', 'not-a-date'])
    ('rejects malformed date-only input %s', (input) => {
      expect(() => assertDate(input)).toThrow('日期格式須為 YYYY-MM-DD。')
    })

  it.each(['1899-12-31', '9999-01-01', '2026-00-15', '2026-13-15', '2026-11-00', '2026-11-31', '2027-02-29', '1900-02-29'])
    ('rejects impossible or out-of-range date %s', (input) => {
      expect(() => assertDate(input)).toThrow('日期不存在或超出範圍。')
    })
})

describe('purchasePeriod', () => {
  it.each([
    ['2026-10-15', '2026-09-16', '2026-10-15'],
    ['2026-11-15', '2026-10-16', '2026-11-15'],
    ['2026-12-15', '2026-11-16', '2026-12-15'],
  ])('allows override to adjacent or current period ending %s', (overridePeriodEnd, start, end) => {
    const purchase = { spentOn: '2026-11-15', overridePeriodEnd }
    expect(purchasePeriod(billingCard, purchase)).toEqual({ start, end })
    expect(purchase).toEqual({ spentOn: '2026-11-15', overridePeriodEnd })
  })

  it('restores automatic date-derived assignment when the override is null', () => {
    const purchase = { spentOn: '2026-11-15', overridePeriodEnd: null }
    expect(purchasePeriod(billingCard, purchase)).toEqual({ start: '2026-10-16', end: '2026-11-15' })
    expect(purchase).toEqual({ spentOn: '2026-11-15', overridePeriodEnd: null })
  })

  it.each(['2026-09-15', '2027-01-15', '2026-11-14', 'invalid'])
    ('rejects nonadjacent or invalid override %s', (overridePeriodEnd) => {
      expect(() => purchasePeriod(billingCard, { spentOn: '2026-11-15', overridePeriodEnd }))
        .toThrow('只能調整至消費日期對應的前一期或下一期。')
    })
})

describe('date presentation', () => {
  it('uses local calendar getters instead of UTC serialization for today', () => {
    const date = new Date('2026-11-14T10:05:00.000Z')
    vi.spyOn(date, 'getFullYear').mockReturnValue(2026)
    vi.spyOn(date, 'getMonth').mockReturnValue(10)
    vi.spyOn(date, 'getDate').mockReturnValue(15)
    expect(localToday(date)).toBe('2026-11-15')
    expect(date.toISOString()).toBe('2026-11-14T10:05:00.000Z')
  })

  it('formats both period endpoints without converting the date-only values', () => {
    expect(periodLabel({ start: '2026-10-16', end: '2026-11-15' }))
      .toBe('2026/10/16 – 2026/11/15')
  })
})
