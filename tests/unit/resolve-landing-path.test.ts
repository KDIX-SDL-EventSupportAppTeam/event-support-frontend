import { beforeEach, describe, expect, it } from 'vitest'
import { resolveLandingPath } from '@/features/auth/lib/resolveLandingPath'

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

describe('resolveLandingPath', () => {
  it("'exhibitor' → /exhibitor（オンボーディング既読に関わらず）", () => {
    expect(resolveLandingPath('exhibitor')).toBe('/exhibitor')
  })

  it.each(['participant', 'manager', 'admin', 'viewer'])(
    '%s → 未読なら /onboarding',
    (role) => {
      expect(resolveLandingPath(role)).toBe('/onboarding')
    },
  )

  it('undefined → 未読なら /onboarding', () => {
    expect(resolveLandingPath(undefined)).toBe('/onboarding')
  })

  it('既読なら /home', () => {
    localStorage.setItem('onboardingSeen', 'true')
    expect(resolveLandingPath('participant')).toBe('/home')
  })
})
