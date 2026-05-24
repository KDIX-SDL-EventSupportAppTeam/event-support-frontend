import { describe, it, expect } from 'vitest'
import { SampleEventData } from '@/shared/data/sample/SampleEventData'
import { resolveEventDataSourceMode } from '@/shared/data/createEventDataSource'

describe('SampleEventData', () => {
  it('旧 UI 用のブース・16 マスビンゴを返す（サーバー非依存）', () => {
    const s = new SampleEventData()
    const booths = s.getLegacyBooths()
    const grid = s.getBingoGrid('evt-1', 'user-1')
    expect(booths.length).toBeGreaterThan(0)
    expect(booths[0].booth_id).toBeDefined()
    expect(grid.length).toBe(16)
    const rec = grid.filter((c) => c?.is_recommendation).length
    expect(rec).toBe(1)
  })

  it('同じ event / user では同じカード配置（決定論的シャッフル）', () => {
    const s = new SampleEventData()
    const a = s.getBingoGrid('e', 'u').map((c) => c?.booth_id ?? 'null')
    const b = s.getBingoGrid('e', 'u').map((c) => c?.booth_id ?? 'null')
    expect(a).toEqual(b)
  })

  it('異なるユーザーでは配置が変わりうる', () => {
    const s = new SampleEventData()
    const a = s.getBingoGrid('same', 'u1').map((c) => c?.booth_id ?? 'null')
    const b = s.getBingoGrid('same', 'u2').map((c) => c?.booth_id ?? 'null')
    expect(a).not.toEqual(b)
  })
})

describe('resolveEventDataSourceMode', () => {
  it('sample または api のいずれか', () => {
    const m = resolveEventDataSourceMode()
    expect(['sample', 'api']).toContain(m)
  })
})
