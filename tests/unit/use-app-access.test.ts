import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { deriveAppAccessState } from '@/shared/hooks/useAppAccess'
import type { AppAccess } from '@/shared/api/appAccess'

/**
 * `useAppAccess` の判定ロジック（`deriveAppAccessState`）のテスト。
 *
 * このリポジトリには React コンポーネント／フックのレンダリングテスト基盤
 * （@testing-library/react 等）が無いため、hook 本体から分離した純粋関数を直接検証する。
 *
 * issue #80: 開放判定の正本はサーバーの `access.is_open` ただ1つ。
 * 端末側で補正済みの「今」から `app_opens_at` を跨いで判定を先取りしない
 * （先取りすると入口 `/e/:eventId` と `/home` のゲートが食い違い往復する）。
 */

function makeAccess(overrides: Partial<AppAccess>): AppAccess {
  return {
    event_id: 'evt-1',
    is_open: false,
    mode: 'scheduled',
    app_opens_at: null,
    pre_survey_closes_at: null,
    is_pre_survey_open: true,
    server_time: new Date().toISOString(),
    ...overrides,
  }
}

describe('deriveAppAccessState', () => {
  it('isOpen はサーバーの is_open をそのまま返す（true）', () => {
    const access = makeAccess({ mode: 'open', is_open: true })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(true)
    expect(state.remainingMs).toBeNull()
  })

  it('isOpen はサーバーの is_open をそのまま返す（false）', () => {
    const access = makeAccess({ mode: 'closed', is_open: false, app_opens_at: new Date().toISOString() })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBeNull()
  })

  it('mode=scheduled・未開放なら残り時間を補正済みの「今」から算出する', () => {
    const now = Date.now()
    const opensAt = now + 10 * 60 * 1000
    const access = makeAccess({
      mode: 'scheduled',
      is_open: false,
      app_opens_at: new Date(opensAt).toISOString(),
    })

    const state = deriveAppAccessState(access, now)

    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBe(10 * 60 * 1000)
  })

  it('補正済みの「今」が開放予定時刻を過ぎていても、サーバーが is_open=false なら開かない（外挿しない）', () => {
    const now = Date.now()
    const opensAt = now - 1000 // 端末視点では1秒前に開放予定を過ぎている
    const access = makeAccess({
      mode: 'scheduled',
      is_open: false,
      app_opens_at: new Date(opensAt).toISOString(),
    })

    const state = deriveAppAccessState(access, now)

    // かつては true に先取りしていた。いまはサーバーの is_open に従う。
    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBe(0)
  })

  it('端末時計が進んでいても遅れていても isOpen は変わらない（サーバー評価値のみ）', () => {
    const opensAt = Date.now() + 5 * 60 * 1000
    const access = makeAccess({
      mode: 'scheduled',
      is_open: false,
      app_opens_at: new Date(opensAt).toISOString(),
    })

    const fast = deriveAppAccessState(access, Date.now() + 60 * 60 * 1000) // 1時間進む
    const slow = deriveAppAccessState(access, Date.now() - 60 * 60 * 1000) // 1時間遅れる

    expect(fast.isOpen).toBe(false)
    expect(slow.isOpen).toBe(false)
    // 残り時間表示だけが「今」に追随する（クランプは 0 以上）
    expect(fast.remainingMs).toBe(0)
    expect(slow.remainingMs).toBeGreaterThan(5 * 60 * 1000)
  })

  it('サーバーが is_open=true を返せば、app_opens_at が未来でもそのまま開く', () => {
    const access = makeAccess({
      mode: 'scheduled',
      is_open: true,
      app_opens_at: new Date(Date.now() + 1000).toISOString(),
    })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(true)
    expect(state.remainingMs).toBeNull()
  })

  it('app_opens_at が無い scheduled は isOpen=false・残り時間なし', () => {
    const access = makeAccess({ mode: 'scheduled', is_open: false, app_opens_at: null })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBeNull()
  })
})

/**
 * 静的検査 ── 開放判定をフロントで再計算する外挿ロジックが復活していないこと（issue #80）。
 * レンダリングテスト基盤が無いため、hook のソースを機械的に見張る。
 */
describe('useAppAccess のソース不変条件', () => {
  const hookSrc = readFileSync(
    fileURLToPath(new URL('../../src/shared/hooks/useAppAccess.ts', import.meta.url)),
    'utf-8',
  )

  it('deriveAppAccessState の isOpen はサーバーの is_open をそのまま返す', () => {
    expect(hookSrc).toMatch(/const isOpen = access\.is_open\b/)
  })

  it('端末側で開放予定時刻を跨いで判定する computeIsOpen を呼ばない／定義しない', () => {
    expect(hookSrc).not.toMatch(/function\s+computeIsOpen/)
    expect(hookSrc).not.toMatch(/computeIsOpen\s*\(/)
  })
})
