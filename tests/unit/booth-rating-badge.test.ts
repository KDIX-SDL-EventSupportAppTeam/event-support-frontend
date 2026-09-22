import { describe, expect, it } from 'vitest'
import { shouldShowUnratedBadge } from '@/features/booth/lib/boothRatingBadge'

describe('shouldShowUnratedBadge（issue #115 T-5）', () => {
  it('チェックイン済み・未評価には「未評価」バッジを出す', () => {
    expect(shouldShowUnratedBadge(true, false)).toBe(true)
  })

  it('評価済みには出さない', () => {
    expect(shouldShowUnratedBadge(true, true)).toBe(false)
  })

  it('未訪問（rated が undefined）には出さない', () => {
    expect(shouldShowUnratedBadge(false, undefined)).toBe(false)
  })
})
