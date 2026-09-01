import { describe, it, expect } from 'vitest'
import { deriveAppAccessState } from '@/shared/hooks/useAppAccess'
import type { AppAccess } from '@/shared/api/appAccess'

/**
 * `useAppAccess` の判定ロジック（`deriveAppAccessState`）のテスト。
 *
 * このリポジトリには React コンポーネント／フックのレンダリングテスト基盤
 * （@testing-library/react 等）が無いため、hook 本体から分離した純粋関数を直接検証する。
 *
 * 守りたい不変条件は **「`app_opens_at` を `isOpen` の判定に使わないこと」**（issue #80）。
 * 端末側で開放予定時刻を跨いで判定を先取りすると、入口 `/e/:eventId` と `/home` の
 * ゲートが食い違い往復リダイレクトになる。開放判定の正本はサーバーの `is_open` ただ1つ。
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
    const access = makeAccess({
      mode: 'closed',
      is_open: false,
      app_opens_at: new Date().toISOString(),
    })
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

  it('開放予定時刻がとうに過去でも、端末の「今」が遥か未来でも、サーバーが false なら開かない', () => {
    // 「app_opens_at を isOpen の判定に使わない」ことの本体。
    // 実装が computeIsOpen を別名で復活させても、この期待値なら捕まえられる。
    const access = makeAccess({
      is_open: false,
      mode: 'scheduled',
      app_opens_at: '2020-01-01T00:00:00.000Z',
    })

    const { isOpen } = deriveAppAccessState(
      access,
      Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    )

    expect(isOpen).toBe(false)
  })

  it('端末時計が進んでいても遅れていても isOpen は変わらない（残り時間表示だけが動く）', () => {
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
    expect(fast.remainingMs).toBe(0) // Math.max で 0 にクランプ
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
