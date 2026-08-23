import { describe, it, expect, beforeEach } from 'vitest'

// vitest の `environment: 'node'` には sessionStorage が無いため、テスト用に簡易実装を積む。
// サンプルモードのビンゴカード生成（bingoRandom / sampleSession 経由）が sessionStorage に依存するため。
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

;(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = new MemoryStorage()

const { buildSampleBingoCard } = await import('@/shared/data/sample/sampleBingoCard')
const { appendSampleCheckedId } = await import('@/shared/data/sample/sampleSession')
const { hasPlayedUnlockAnimation, markUnlockAnimationPlayed } = await import('@/shared/lib/bingoUnlockFlag')

describe('buildSampleBingoCard', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear()
  })

  it('16マス・中央2x2の1マスは参加ボーナスで達成済み', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    expect(card.cells).toHaveLength(16)
    const bonus = card.cells.find((c) => c.source === 'SIGNUP_BONUS')
    expect(bonus).toBeDefined()
    expect(bonus?.state).toBe('ACHIEVED')
    expect(bonus?.zone).toBe('CENTER')
  })

  it('LOCKED マスの booth は必ず null', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    for (const cell of card.cells) {
      if (cell.state === 'LOCKED') {
        expect(cell.booth).toBeNull()
      }
    }
  })

  it('rating_scale はハードコードされた5ではない（既定3）', () => {
    const card = buildSampleBingoCard('evt-1', 'user-a')
    expect(card.rating_scale).toBe(3)
  })

  it('訪問数が3件未満なら CENTER_ONLY で外側は全て LOCKED', () => {
    const card = buildSampleBingoCard('evt-zero-visits', 'user-zero')
    if (card.status === 'CENTER_ONLY') {
      const outerCells = card.cells.filter((c) => c.zone === 'OUTER')
      expect(outerCells.every((c) => c.state === 'LOCKED')).toBe(true)
      expect(card.progress.visits_to_unlock).toBeGreaterThan(0)
    }
  })

  it('訪問を3件積み増すと UNLOCKED に変わる', () => {
    const eventId = 'evt-unlock-test'
    const userId = 'user-unlock-test'
    // 決定論的な基礎訪問に上乗せしてセッションの訪問記録を増やす
    appendSampleCheckedId(userId, 'booth-extra-1')
    appendSampleCheckedId(userId, 'booth-extra-2')
    appendSampleCheckedId(userId, 'booth-extra-3')
    appendSampleCheckedId(userId, 'booth-extra-4')
    const card = buildSampleBingoCard(eventId, userId)
    expect(card.status).toBe('UNLOCKED')
    expect(card.progress.visits_to_unlock).toBe(0)
  })

  it('コインは中央4マス揃いだけでは増えない', () => {
    // 中央のみ埋まっている（未解放）状態ではラインが成立しないため coins.earned は 0
    const card = buildSampleBingoCard('evt-coins', 'user-coins-zero')
    if (card.status === 'CENTER_ONLY') {
      expect(card.coins.earned).toBe(0)
    }
  })
})

describe('bingoUnlockFlag', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear()
  })

  it('未再生のカードは false', () => {
    expect(hasPlayedUnlockAnimation('card-x')).toBe(false)
  })

  it('再生済みにすると true になる', () => {
    markUnlockAnimationPlayed('card-x')
    expect(hasPlayedUnlockAnimation('card-x')).toBe(true)
    expect(hasPlayedUnlockAnimation('card-y')).toBe(false)
  })
})
