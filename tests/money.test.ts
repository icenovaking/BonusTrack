import { describe, expect, it } from 'vitest'
import {
  assertMinor,
  calculateRemaining,
  deriveSpendLimit,
  inputMoney,
  money,
  parseMoney,
  parseRate,
} from '../src/domain/money'

describe('parseMoney', () => {
  it.each([
    ['0', 0],
    ['100', 10000],
    [' 100.1 ', 10010],
    ['100.01', 10001],
    ['0.29', 29],
    ['0001.05', 105],
    ['90071992547409.91', Number.MAX_SAFE_INTEGER],
  ])('converts %s to exact integer cents', (input, expected) => {
    expect(parseMoney(input)).toBe(expected)
  })

  it('allows zero for a cap but rejects zero for a completed purchase', () => {
    expect(parseMoney('0.00')).toBe(0)
    expect(() => parseMoney('0.00', true)).toThrow('金額超出範圍或格式不正確。')
    expect(parseMoney('0.01', true)).toBe(1)
  })

  it.each(['', ' ', '-1', '+1', '1.001', '1.', '.5', '1,000', '1e3', 'NaN', 'Infinity'])
    ('rejects malformed or excessively precise input %j', (input) => {
      expect(() => parseMoney(input)).toThrow('請輸入台幣金額，最多兩位小數。')
    })

  it('rejects a cent immediately beyond the safe integer boundary', () => {
    expect(() => parseMoney('90071992547409.92')).toThrow('金額超出可處理範圍。')
  })
})

describe('assertMinor', () => {
  it.each([NaN, Infinity, -Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    ('rejects invalid minor-unit values %s', (value) => {
      expect(() => assertMinor(value)).toThrow('金額超出範圍或格式不正確。')
    })

  it('accepts safe boundary values and enforces the positive flag', () => {
    expect(assertMinor(0)).toBe(0)
    expect(assertMinor(Number.MAX_SAFE_INTEGER, true)).toBe(Number.MAX_SAFE_INTEGER)
    expect(() => assertMinor(0, true)).toThrow()
  })
})

describe('parseRate', () => {
  it.each([['0.01', 1], ['6', 600], ['6.25', 625], ['100', 10000]])
    ('accepts %s percent and stores integer basis points', (input, expected) => {
      expect(parseRate(input)).toBe(expected)
    })

  it.each(['0', '-1', '100.01', '6.001', 'NaN'])('rejects invalid percentage %s', (input) => {
    expect(() => parseRate(input)).toThrow()
  })
})

describe('deriveSpendLimit', () => {
  it('floors the 500 TWD / 6 percent allowance to 8333 whole TWD', () => {
    expect(deriveSpendLimit({ rewardCapMinor: 50000, bonusRateBasisPoints: 600 })).toBe(833300)
  })

  it.each([
    [30000, 300, 1000000],
    [100, 10000, 100],
    [100, 625, 1600],
    [1, 600, 0],
    [0, 600, 0],
  ])('converts cap %s and rate %s to whole-TWD cents %s', (cap, rate, expected) => {
    expect(deriveSpendLimit({ rewardCapMinor: cap, bonusRateBasisPoints: rate })).toBe(expected)
  })

  it.each([
    [-1, 600],
    [50000.5, 600],
    [50000, 0],
    [50000, -1],
    [50000, 600.5],
    [50000, 10001],
    [Number.MAX_SAFE_INTEGER, 1],
  ])('rejects invalid or unsafe cap %s and rate %s', (cap, rate) => {
    expect(() => deriveSpendLimit({ rewardCapMinor: cap, bonusRateBasisPoints: rate })).toThrow()
  })
})

describe('calculateRemaining', () => {
  it('deducts 100 TWD then 1000 TWD from the 8333 TWD limit', () => {
    expect(calculateRemaining(833300, [{ amountMinor: 10000 }])).toBe(823300)
    expect(calculateRemaining(833300, [{ amountMinor: 10000 }, { amountMinor: 100000 }])).toBe(723300)
  })

  it('preserves the full limit for an empty period and exact cents for fractional purchases', () => {
    expect(calculateRemaining(833300, [])).toBe(833300)
    expect(calculateRemaining(833300, [{ amountMinor: 29 }, { amountMinor: 101 }])).toBe(833170)
  })

  it('returns zero at the exact boundary and preserves overspending records unchanged', () => {
    expect(calculateRemaining(833300, [{ amountMinor: 833300 }])).toBe(0)
    const purchases = [{ amountMinor: 833350 }, { amountMinor: 10000 }]
    expect(calculateRemaining(833300, purchases)).toBe(0)
    expect(purchases).toEqual([{ amountMinor: 833350 }, { amountMinor: 10000 }])
    expect(calculateRemaining(0, [{ amountMinor: 1 }])).toBe(0)
  })

  it('rejects unsafe aggregate totals instead of silently losing cents', () => {
    expect(calculateRemaining(Number.MAX_SAFE_INTEGER, [{ amountMinor: Number.MAX_SAFE_INTEGER }])).toBe(0)
    expect(() => calculateRemaining(833300, [
      { amountMinor: Number.MAX_SAFE_INTEGER }, { amountMinor: 1 },
    ])).toThrow('累計消費超出可處理範圍。')
  })

  it.each([0, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
    ('rejects invalid completed purchase amount %s', (amountMinor) => {
      expect(() => calculateRemaining(833300, [{ amountMinor }])).toThrow()
    })

  it('validates the limit even when the period has no purchases', () => {
    expect(() => calculateRemaining(-1, [])).toThrow()
    expect(() => calculateRemaining(1.5, [])).toThrow()
  })
})

describe('money presentation', () => {
  it.each([[833300, '8,333'], [823329, '8,233.29'], [10, '0.1'], [0, '0']])
    ('formats %s cents as %s TWD without forced decimals', (value, expected) => {
      expect(money(value)).toBe(expected)
    })

  it('produces ungrouped editable input that round-trips cents', () => {
    expect(inputMoney(823329)).toBe('8233.29')
    expect(parseMoney(inputMoney(823329))).toBe(823329)
    expect(inputMoney(0)).toBe('0')
  })
})
