import type { BingoGridCell, LegacyBooth } from '@/shared/types/legacyBooth'

/** 文字列から決定論的なシード（0..2^32-1） */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** Mulberry32 — 同じシードなら同じ乱数列 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * 4x4 ビンゴマス: ブースをランダム配置し空マスで埋める。おすすめは1マスのみ。
 * `seed` が同じなら常に同じカード（API 未接続時の一貫性用）。
 */
export function buildRandomBingoGrid(booths: LegacyBooth[], seed: string): BingoGridCell[] {
  if (booths.length === 0) {
    return Array.from({ length: 16 }, () => null)
  }
  const rng = mulberry32(hashSeed(seed))
  const boothCells: BingoGridCell[] = booths.map((b) => ({
    ...b,
    is_recommendation: false,
  }))
  const nulls: BingoGridCell[] = Array.from({ length: Math.max(0, 16 - boothCells.length) }, () => null)
  const combined = shuffleWithRng([...boothCells, ...nulls], rng).slice(0, 16)
  const filledIndices = combined
    .map((c, i) => (c !== null ? i : -1))
    .filter((i) => i >= 0) as number[]
  if (filledIndices.length > 0) {
    const pick = filledIndices[Math.floor(rng() * filledIndices.length)]!
    const cell = combined[pick]
    if (cell) {
      combined[pick] = { ...cell, is_recommendation: true }
    }
  }
  return combined
}

/** 4x4 の行・列・対角ライン定義（サンプルモードのビンゴカード生成で共用） */
export const LINE_INDEXES: readonly number[][] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
]

/**
 * 空マスはフリー。ライン内にブースが1つ以上あり、すべてのブースがチェックイン済みなら成立。
 * （ブースが1つもない列はカウントしない）
 */
export function countCompletedBingoLines(grid: BingoGridCell[], checkedInBoothIds: ReadonlySet<string>): number {
  if (grid.length !== 16) return 0
  let n = 0
  for (const line of LINE_INDEXES) {
    let hasBooth = false
    let ok = true
    for (const i of line) {
      const c = grid[i]
      if (c === null) continue
      hasBooth = true
      if (!checkedInBoothIds.has(c.booth_id)) {
        ok = false
        break
      }
    }
    if (hasBooth && ok) n++
  }
  return n
}
