import { describe, expect, it } from 'vitest'
import { RATING_SCALE, starFillStates } from '@/shared/config/rating'

/**
 * 運営の評価確認画面（BoothCommentsPage）の星表示（#131）。
 * `RATING_SCALE` 1箇所で段階数が決まることと、星の塗り分けを検証する。
 */
describe('starFillStates（#131）', () => {
  it('RATING_SCALE は4に固定されている', () => {
    expect(RATING_SCALE).toBe(4)
  })

  it('T-1: rating=4 のとき、星が4つ描画され4つとも塗られている', () => {
    const states = starFillStates(4)
    expect(states).toHaveLength(4)
    expect(states).toEqual([true, true, true, true])
  })

  it('T-2: rating=1 のとき、星が4つ描画され1つだけ塗られている', () => {
    const states = starFillStates(1)
    expect(states).toHaveLength(4)
    expect(states).toEqual([true, false, false, false])
  })
})
