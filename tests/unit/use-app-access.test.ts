import { describe, it, expect } from 'vitest'
import { deriveAppAccessState } from '@/shared/hooks/useAppAccess'
import type { AppAccess } from '@/shared/api/appAccess'

/**
 * `useAppAccess` の判定ロジック（`deriveAppAccessState`）のテスト。
 *
 * このリポジトリには React コンポーネント／フックのレンダリングテスト基盤
 * （@testing-library/react 等）が無いため、hook 本体から分離した純粋関数を直接検証する。
 * ポーリング（30秒間隔）自体の呼び出しは `tests/unit/app-access.test.ts` の
 * `fetchAppAccess` 呼び出し検証と合わせて担保する。
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
  it('mode=open は常に isOpen=true で残り時間なし', () => {
    const access = makeAccess({ mode: 'open', is_open: true })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(true)
    expect(state.remainingMs).toBeNull()
  })

  it('mode=closed は常に isOpen=false で残り時間なし', () => {
    const access = makeAccess({ mode: 'closed', is_open: false, app_opens_at: new Date().toISOString() })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBeNull()
  })

  it('mode=scheduled で補正済み現在時刻が開放予定時刻より前なら isOpen=false、残り時間を返す', () => {
    const now = Date.now()
    const opensAt = now + 10 * 60 * 1000
    const access = makeAccess({ mode: 'scheduled', is_open: false, app_opens_at: new Date(opensAt).toISOString() })

    const state = deriveAppAccessState(access, now)

    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBe(10 * 60 * 1000)
  })

  it('端末時計のずれを補正した「今」が開放予定時刻を過ぎていれば isOpen=true になる', () => {
    const now = Date.now()
    const opensAt = now - 1000 // 1秒前に開放済み
    const access = makeAccess({ mode: 'scheduled', is_open: false, app_opens_at: new Date(opensAt).toISOString() })

    // 端末の生の Date.now() ではなく、呼び出し側が補正した correctedNowMs で判定する
    const state = deriveAppAccessState(access, now)

    expect(state.isOpen).toBe(true)
    expect(state.remainingMs).toBeNull()
  })

  it('サーバーが is_open=true を返していれば、補正時刻の再計算を待たずそのまま true を返す', () => {
    const access = makeAccess({ mode: 'scheduled', is_open: true, app_opens_at: new Date(Date.now() + 1000).toISOString() })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(true)
  })

  it('app_opens_at が無い scheduled は isOpen=false・残り時間なし', () => {
    const access = makeAccess({ mode: 'scheduled', is_open: false, app_opens_at: null })
    const state = deriveAppAccessState(access, Date.now())
    expect(state.isOpen).toBe(false)
    expect(state.remainingMs).toBeNull()
  })
})
