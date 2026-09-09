import { describe, expect, it } from 'vitest'
import { formatHourLabel, resolveGachaFetchState } from '@/features/admin/lib/gachaStatsView'

describe('resolveGachaFetchState', () => {
  it('T-4 失敗かつ過去値なし → error（数字を出さない）', () => {
    expect(resolveGachaFetchState({ hasStats: false, error: 'x' })).toBe('error')
  })
  it('T-6 失敗かつ過去値あり → stale（0 とは別の状態）', () => {
    expect(resolveGachaFetchState({ hasStats: true, error: 'x' })).toBe('stale')
  })
  it('成功 → ok、初回取得中 → loading', () => {
    expect(resolveGachaFetchState({ hasStats: true, error: null })).toBe('ok')
    expect(resolveGachaFetchState({ hasStats: false, error: null })).toBe('loading')
  })
})

describe('formatHourLabel', () => {
  it('ISO(UTC) を端末ローカルの HH:00 にする', () => {
    const iso = '2026-10-16T04:00:00.000Z'
    const expected = `${String(new Date(iso).getHours()).padStart(2, '0')}:00`
    expect(formatHourLabel(iso)).toBe(expected)
  })
  it('壊れた文字列はそのまま返す（例外にしない）', () => {
    expect(formatHourLabel('not-a-date')).toBe('not-a-date')
  })
})
