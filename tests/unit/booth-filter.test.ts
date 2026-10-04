import { describe, expect, it } from 'vitest'
import { countUnvisited, emptyReason, filterBooths } from '@/features/booth/lib/boothFilter'

const booths = [{ booth_id: 'a' }, { booth_id: 'b' }, { booth_id: 'c' }]

describe('filterBooths（issue #175）', () => {
  it('すべて: 元の順序のまま全件返す（チェックイン済みを上に寄せない）', () => {
    expect(filterBooths(booths, ['c'], 'all').map((b) => b.booth_id)).toEqual(['a', 'b', 'c'])
  })

  it('未チェックイン / チェックイン済みで絞る', () => {
    expect(filterBooths(booths, ['b'], 'unvisited').map((b) => b.booth_id)).toEqual(['a', 'c'])
    expect(filterBooths(booths, ['b'], 'visited').map((b) => b.booth_id)).toEqual(['b'])
  })

  it('入力配列を破壊しない', () => {
    const copy = [...booths]
    filterBooths(booths, ['a'], 'visited')
    expect(booths).toEqual(copy)
  })
})

describe('countUnvisited', () => {
  it('一覧に載っているブースだけを数える（一覧外の ID が混ざっても壊れない）', () => {
    expect(countUnvisited(booths, ['a', 'zzz-removed', 'yyy-inactive'])).toBe(2)
  })

  it('全部訪問済みなら 0、未訪問なら全件', () => {
    expect(countUnvisited(booths, ['a', 'b', 'c'])).toBe(0)
    expect(countUnvisited(booths, [])).toBe(3)
  })
})

describe('emptyReason', () => {
  it('ブース未登録・通信失敗（0 件）は絞り込みの 0 件と区別する', () => {
    expect(emptyReason(0, 0, 'all')).toBe('no_booths')
    expect(emptyReason(0, 0, 'unvisited')).toBe('no_booths')
  })

  it('未チェックインが 0 件なら全訪問済み、チェックイン済みが 0 件なら未訪問', () => {
    expect(emptyReason(3, 0, 'unvisited')).toBe('all_visited')
    expect(emptyReason(3, 0, 'visited')).toBe('none_visited')
  })

  it('1 件でもあれば null', () => {
    expect(emptyReason(3, 1, 'visited')).toBeNull()
  })
})
