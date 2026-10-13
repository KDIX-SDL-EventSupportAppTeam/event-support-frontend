import { describe, expect, it } from 'vitest'
import {
  coinNumberLabel,
  formatJstHm,
  formatJstHms,
  groupCoinUses,
  SAME_USE_WINDOW_MS,
} from '@/features/gachapon/lib/coinHistory'

const at = (sec: number) => new Date(Date.UTC(2026, 9, 16, 5, 0, sec)).toISOString()

describe('groupCoinUses', () => {
  it('0 件は空配列', () => {
    expect(groupCoinUses([])).toEqual([])
  })

  it('10 秒以内の連続はまとまる（何枚目〜何枚目と枚数が出る）', () => {
    const groups = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: at(2) },
      { coin_index: 2, used_at: at(9) },
    ])
    expect(groups).toEqual([{ count: 3, firstNumber: 1, lastNumber: 3, usedAt: at(0) }])
  })

  it('10 秒ちょうどはまとめ、10 秒を超えると分ける', () => {
    expect(SAME_USE_WINDOW_MS).toBe(10_000)
    const exactly = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: at(10) },
    ])
    expect(exactly).toHaveLength(1)

    const over = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: at(11) },
    ])
    expect(over).toHaveLength(2)
    expect(over.map((g) => g.count)).toEqual([1, 1])
  })

  it('間隔は「最初の行から」ではなく「前の行から」で測る（連鎖でまとまる）', () => {
    const groups = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: at(8) },
      { coin_index: 2, used_at: at(16) },
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].count).toBe(3)
  })

  it('離れた使用は別の回になり、枚数と何枚目がそれぞれ出る', () => {
    const groups = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: at(1) },
      { coin_index: 2, used_at: at(600) },
    ])
    expect(groups).toEqual([
      { count: 2, firstNumber: 1, lastNumber: 2, usedAt: at(0) },
      { count: 1, firstNumber: 3, lastNumber: 3, usedAt: at(600) },
    ])
  })

  it('入力順に依存せず coin_index 昇順で扱い、入力を書き換えない', () => {
    const input = [
      { coin_index: 1, used_at: at(1) },
      { coin_index: 0, used_at: at(0) },
    ]
    const copy = JSON.parse(JSON.stringify(input))
    const groups = groupCoinUses(input)
    expect(groups).toEqual([{ count: 2, firstNumber: 1, lastNumber: 2, usedAt: at(0) }])
    expect(input).toEqual(copy)
  })

  it('時刻が読めない行は誤ってまとめない', () => {
    const groups = groupCoinUses([
      { coin_index: 0, used_at: at(0) },
      { coin_index: 1, used_at: 'invalid' },
    ])
    expect(groups).toHaveLength(2)
  })
})

describe('coinNumberLabel', () => {
  it('1枚なら「n枚目」、複数なら「a〜b枚目」', () => {
    expect(coinNumberLabel({ count: 1, firstNumber: 3, lastNumber: 3, usedAt: at(0) })).toBe('3枚目')
    expect(coinNumberLabel({ count: 2, firstNumber: 1, lastNumber: 2, usedAt: at(0) })).toBe('1〜2枚目')
  })
})

describe('時刻表示（JST）', () => {
  it('formatJstHm は UTC を JST の HH:mm にする', () => {
    expect(formatJstHm('2026-10-16T05:12:03.000Z')).toBe('14:12')
    expect(formatJstHm('2026-10-15T15:05:00.000Z')).toBe('00:05')
  })

  it('formatJstHms は秒まで出す', () => {
    expect(formatJstHms(new Date('2026-10-16T05:12:03.000Z'))).toBe('14:12:03')
  })

  it('読めない値はそのまま返す', () => {
    expect(formatJstHm('invalid')).toBe('invalid')
  })
})
