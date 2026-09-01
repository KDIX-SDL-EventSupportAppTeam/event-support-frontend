import { describe, it, expect } from 'vitest'
import { formatOpenSchedule } from '@/features/entry/lib/formatOpenSchedule'
import type { AppAccess } from '@/shared/api/appAccess'

/**
 * 開放待ち画面の予定時刻・残り時間の表示整形。
 * 描画テスト基盤が無いため、コンポーネントから分離した純粋関数を直接検証する。
 *
 * 日付ラベルは端末のタイムゾーン依存（`getMonth` 等）なので、ここでは
 * 括弧内の残り時間表現だけを検証してタイムゾーンに依存しないようにする。
 */

function makeAccess(overrides: Partial<AppAccess> = {}): AppAccess {
  return {
    event_id: 'evt-1',
    is_open: false,
    mode: 'scheduled',
    app_opens_at: '2026-10-16T00:30:00.000Z',
    pre_survey_closes_at: null,
    is_pre_survey_open: true,
    server_time: '2026-10-15T05:00:00.000Z',
    ...overrides,
  }
}

describe('formatOpenSchedule', () => {
  it('残り 0 は「あと 0 分」ではなく「まもなく開放されます」', () => {
    // サーバーがまだ is_open=false を返している間、開放予定を過ぎると残りは 0 になる
    // （フロントで先取りしないため。issue #80）
    const label = formatOpenSchedule(makeAccess(), 0)

    expect(label).toContain('まもなく開放されます')
    expect(label).not.toContain('あと 0 分')
  })

  it('1分未満の端数は切り上げて「あと 1 分」', () => {
    expect(formatOpenSchedule(makeAccess(), 30_000)).toContain('あと 1 分')
  })

  it('1時間以上は時間と分に分ける', () => {
    expect(formatOpenSchedule(makeAccess(), 90 * 60_000)).toContain('あと 1 時間 30 分')
  })

  it('残り時間が無ければ開放予定時刻だけを出す', () => {
    const label = formatOpenSchedule(makeAccess(), null)

    expect(label).toContain('開放予定')
    expect(label).not.toContain('あと')
    expect(label).not.toContain('まもなく')
  })

  it('scheduled でなければ開放予定時刻を出さない', () => {
    expect(formatOpenSchedule(makeAccess({ mode: 'closed' }), null)).toBe(
      'アプリは現在ご利用いただけません。',
    )
  })

  it('app_opens_at が無ければ開放予定時刻を出さない', () => {
    expect(formatOpenSchedule(makeAccess({ app_opens_at: null }), null)).toBe(
      'アプリは現在ご利用いただけません。',
    )
  })
})
