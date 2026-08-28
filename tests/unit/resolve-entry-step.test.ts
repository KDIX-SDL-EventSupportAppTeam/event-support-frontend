import { describe, expect, it } from 'vitest'
import { resolveEntryStep } from '@/features/entry/lib/resolveEntryStep'
import type { MeState } from '@/features/entry/api/meState'

/**
 * 配布リンク 1 本の中で、どの段階を描くかの判定。
 * URL が段階を持たないため、この関数が導線そのものになる。
 */

function meState(overrides: Partial<MeState> = {}): MeState {
  return {
    email_verified: true,
    survey_answered: true,
    survey_answered_at: '2026-08-20T09:12:00Z',
    onboarding_completed: true,
    app_access: {
      is_open: true,
      mode: 'open',
      app_opens_at: null,
      pre_survey_closes_at: null,
      is_pre_survey_open: true,
      server_time: '2026-08-28T09:00:00Z',
    },
    ...overrides,
  }
}

const base = { hasToken: true, eventMatches: true, role: 'participant' as const, isOpen: true }

describe('resolveEntryStep', () => {
  it('未認証なら認証画面', () => {
    expect(resolveEntryStep({ ...base, hasToken: false, meState: null })).toBe('auth')
  })

  it('別イベントのセッションは無いものとして扱う', () => {
    expect(resolveEntryStep({ ...base, eventMatches: false, meState: meState() })).toBe('auth')
  })

  it('状態が未取得なら loading', () => {
    expect(resolveEntryStep({ ...base, meState: null })).toBe('loading')
  })

  it('メール未確認ならメール確認', () => {
    expect(resolveEntryStep({ ...base, meState: meState({ email_verified: false }) })).toBe('verify')
  })

  it('確認済みで未回答ならアンケート', () => {
    expect(resolveEntryStep({ ...base, meState: meState({ survey_answered: false }) })).toBe('survey')
  })

  it('回答済みでも未開放なら開放待ち', () => {
    expect(resolveEntryStep({ ...base, isOpen: false, meState: meState() })).toBe('waiting')
  })

  it('開放後・オンボーディング未完了ならオンボーディング', () => {
    expect(
      resolveEntryStep({ ...base, meState: meState({ onboarding_completed: false }) }),
    ).toBe('onboarding')
  })

  it('すべて済んでいればアプリ本体へ', () => {
    expect(resolveEntryStep({ ...base, meState: meState() })).toBe('app')
  })

  it('段階は順に進む ── 未確認かつ未回答ならまず確認', () => {
    const step = resolveEntryStep({
      ...base,
      meState: meState({ email_verified: false, survey_answered: false }),
    })
    expect(step).toBe('verify')
  })

  it('出展者はアンケート導線に乗せずアプリへ通す', () => {
    expect(
      resolveEntryStep({ ...base, role: 'exhibitor', meState: null, isOpen: false }),
    ).toBe('app')
  })

  it('運営もアンケート導線に乗せない', () => {
    expect(resolveEntryStep({ ...base, role: 'manager', meState: null })).toBe('app')
  })

  it('開放判定はポーリング結果で上書きできる（再読込なしで先へ進む）', () => {
    const waiting = meState({
      onboarding_completed: false,
      app_access: { ...meState().app_access, is_open: false, mode: 'scheduled' },
    })
    expect(resolveEntryStep({ ...base, isOpen: false, meState: waiting })).toBe('waiting')
    expect(resolveEntryStep({ ...base, isOpen: true, meState: waiting })).toBe('onboarding')
  })
})
