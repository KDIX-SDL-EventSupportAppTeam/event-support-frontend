import { beforeEach, describe, expect, it } from 'vitest'
import { hasSeenCoinComplete, markCoinCompleteSeen } from '@/shared/lib/coinCelebration'

// jsdom を使わない構成のため、localStorage の最小実装を用意する
class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
}

const EVENT = 'evt-1'
const USER = 'user-1'

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
})

describe('hasSeenCoinComplete / markCoinCompleteSeen', () => {
  it('初回は未読、記録すると既読になる', () => {
    expect(hasSeenCoinComplete(EVENT, USER)).toBe(false)
    markCoinCompleteSeen(EVENT, USER)
    expect(hasSeenCoinComplete(EVENT, USER)).toBe(true)
  })

  it('ユーザーが違えば別扱い（共有端末で他人の達成を出さない）', () => {
    markCoinCompleteSeen(EVENT, USER)
    expect(hasSeenCoinComplete(EVENT, 'user-2')).toBe(false)
  })

  it('イベントが違えば別扱い', () => {
    markCoinCompleteSeen(EVENT, USER)
    expect(hasSeenCoinComplete('evt-2', USER)).toBe(false)
  })

  it('何度記録しても既読のまま（冪等）', () => {
    markCoinCompleteSeen(EVENT, USER)
    markCoinCompleteSeen(EVENT, USER)
    expect(hasSeenCoinComplete(EVENT, USER)).toBe(true)
  })
})
