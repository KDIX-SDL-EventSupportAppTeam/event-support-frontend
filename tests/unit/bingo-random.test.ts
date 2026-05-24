import { describe, it, expect } from 'vitest'
import type { BingoGridCell, LegacyBooth } from '@/shared/types/legacyBooth'
import {
  buildRandomBingoGrid,
  countCompletedBingoLines,
  hashSeed,
  mulberry32,
  shuffleWithRng,
} from '@/shared/data/sample/bingoRandom'

const miniBooths: LegacyBooth[] = [
  {
    booth_id: 'X',
    booth_name: 'テスト',
    booth_emoji: '🧪',
    booth_description: 'd',
    booth_image_url: null,
  },
]

function mk(id: string): LegacyBooth {
  return {
    booth_id: id,
    booth_name: 'n',
    booth_emoji: 'e',
    booth_description: 'd',
    booth_image_url: null,
  }
}

describe('bingoRandom', () => {
  it('hashSeed は決定論的', () => {
    expect(hashSeed('a|b')).toBe(hashSeed('a|b'))
    expect(hashSeed('a|b')).not.toBe(hashSeed('a|c'))
  })

  it('mulberry32 は同じシードで同じ列', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    expect(a()).toBe(b())
  })

  it('shuffleWithRng は要素を保持し長さ不変', () => {
    const rng = mulberry32(99)
    const out = shuffleWithRng([1, 2, 3, 4, 5], rng)
    expect(out.sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5])
  })

  it('buildRandomBingoGrid は 16 マス・おすすめは1つ', () => {
    const grid = buildRandomBingoGrid(miniBooths, 'seed-1')
    expect(grid).toHaveLength(16)
    expect(grid.filter((c) => c !== null)).toHaveLength(1)
    expect(grid.filter((c) => c?.is_recommendation)).toHaveLength(1)
  })

  it('countCompletedBingoLines: 1行揃いで複数ラインが成立しうる', () => {
    const grid: BingoGridCell[] = Array.from({ length: 16 }, () => null)
    grid[0] = mk('X')
    grid[1] = mk('Y')
    grid[2] = mk('Z')
    grid[3] = mk('W')
    expect(countCompletedBingoLines(grid, new Set())).toBe(0)
    const n = countCompletedBingoLines(grid, new Set(['X', 'Y', 'Z', 'W']))
    expect(n).toBeGreaterThanOrEqual(1)
    expect(n).toBeLessThanOrEqual(10)
  })

  it('countCompletedBingoLines: ブースが無い列はカウントしない', () => {
    const grid = Array(16).fill(null)
    expect(countCompletedBingoLines(grid, new Set())).toBe(0)
  })
})
