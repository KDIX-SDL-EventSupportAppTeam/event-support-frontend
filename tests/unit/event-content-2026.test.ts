import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { QA_2026, SCHEDULE_2026, EVENT_DATE_LABEL_2026 } from '@/shared/data/content/eventContent2026'

// フィクスチャの置き場はリポジトリ規約（docs/rules/testing.md）に従い docs/tests/fixtures/。
// tests/fixtures/ に置くとこのテストが見つけられず、突合せずに緑になる
const FIXTURE = fileURLToPath(new URL('../../docs/tests/fixtures/schedule-2026-10-16.json', import.meta.url))

/** 去年（2025-10-10/11）・廃止運用（スタッフ立会い）の痕跡。1件でもあれば失敗 */
const FORBIDDEN = ['10/10', '10/11', 'DAY1', 'DAY2', '2025', 'スタッフに見せ', 'スタッフにコイン', 'ガチャポンブース', 'パスワードを忘れた場合」', 'アワード']

function allText(): string {
  return [
    ...SCHEDULE_2026.flatMap((d) => [d.dayTitle, ...d.events.flatMap((e) => [e.time, e.title])]),
    ...QA_2026.flatMap((q) => [q.question, q.answer]),
  ].join('\n')
}

describe('スケジュール（2026-10-16）', () => {
  it('T-1 今年の日付が1日分だけある', () => {
    expect(SCHEDULE_2026).toHaveLength(1)
    expect(SCHEDULE_2026[0].dayTitle).toBe(EVENT_DATE_LABEL_2026)
    expect(EVENT_DATE_LABEL_2026).toContain('10/16')
  })
  it('T-2 去年の日付・廃止運用の語が1件も無い', () => {
    const text = allText()
    for (const word of FORBIDDEN) expect(text, `禁止語: ${word}`).not.toContain(word)
  })
  it('段2: 受領したタイムテーブル（fixture）と完全一致する', () => {
    if (!existsSync(FIXTURE)) {
      // 段1（受領前）は events が空であることだけを検査する。
      // events を埋めたのに fixture が無い＝受領原本と突き合わせていない状態なので、ここで落とす
      expect(
        SCHEDULE_2026[0].events,
        '受領版 fixture (docs/tests/fixtures/schedule-2026-10-16.json) が無いまま events が埋められている',
      ).toEqual([])
      return
    }
    const fixture = JSON.parse(readFileSync(FIXTURE, 'utf-8')) as { dayTitle: string; events: { time: string; title: string }[] }[]
    expect(SCHEDULE_2026).toEqual(fixture)
    expect(fixture[0].events.length).toBeGreaterThan(0)
  })
  it('時刻は HH:MM 形式で昇順', () => {
    const times = SCHEDULE_2026[0].events.map((e) => e.time)
    for (const t of times) expect(t).toMatch(/^\d{2}:\d{2}$/)
    expect([...times].sort()).toEqual(times)
  })
})

describe('Q&A（今年の仕様）', () => {
  it('T-3 「スタッフに見せる」旨の記述が無い', () => {
    expect(allText()).not.toMatch(/スタッフに.*見せ/)
  })
  it('T-4 誤使用の案内が run-day-guide §2（履歴は消さない・運営判断）と矛盾しない', () => {
    const item = QA_2026.find((q) => q.question.includes('間違えて'))
    expect(item?.answer).toContain('取り消せません')
    expect(item?.answer).not.toContain('bonus')
  })
  it('コイン上限4枚・1ライン1枚（G-11）が書かれている', () => {
    expect(allText()).toContain('最大4枚')
  })
  // 「立会い」を禁止語にすると今年の正しい文言（G-10: 立会いなし）を誤検知するため、
  // 去年の運用の痕跡は上の 'スタッフに見せ' / 'スタッフにコイン' / 'ガチャポンブース' で捕まえ、
  // ここでは今年の運用が明記されていることを積極的に確かめる
  it('T-4b 今年の運用（スタッフ立会いなし・アプリ内完結）が明記されている', () => {
    expect(allText()).toContain('スタッフの立会いはありません')
  })
  it('T-4c 「立会い」は否定形でしか使われていない（去年の立会い前提が紛れ込んでいない）', () => {
    expect(allText()).not.toMatch(/立会い(?!はありません)/)
  })
})
