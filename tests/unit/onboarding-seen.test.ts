import { beforeEach, describe, expect, it } from 'vitest'
import { hasSeenOnboarding, markOnboardingSeen } from '@/shared/lib/onboardingSeen'

// jsdom を使わない構成のため、localStorage の最小実装を用意する（bingo-celebration.test.ts に倣う）
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

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
})

describe('hasSeenOnboarding / markOnboardingSeen', () => {
  it('初期状態は未読', () => {
    expect(hasSeenOnboarding()).toBe(false)
  })

  it('既読にすると true になる', () => {
    markOnboardingSeen()
    expect(hasSeenOnboarding()).toBe(true)
  })
})
