import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { QA_2026, SCHEDULE_2026, EVENT_DATE_LABEL_2026 } from '@/shared/data/content/eventContent2026'

// フィクスチャの置き場はリポジトリ規約（docs/rules/testing.md）に従い docs/tests/fixtures/。
// tests/fixtures/ に置くとこのテストが見つけられず、突合せずに緑になる
const FIXTURE = fileURLToPath(new URL('../../docs/tests/fixtures/schedule-2026-10-16.json', import.meta.url))

/**
 * 去年（2025-10-10/11）・廃止運用の痕跡。1件でもあれば失敗。
 * - `スタッフに見せ` は今年コイン使用画面をスタッフに見せる運用になったため除外
 * - `パスワードを忘れた場合」` は issue #107（自分で再設定できる文面に戻した）で除外
 * - `アワード` は issue #89（今年アプリ内で実施すると決定）で除外
 * 去年の日程・運用の禁止語（10/10・DAY1 等）は引き続き残す。
 */
const FORBIDDEN = ['10/10', '10/11', 'DAY1', 'DAY2', '2025', 'スタッフにコイン', 'ガチャポンブース']

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
  it('T-4 誤使用の案内が run-day-guide §2（履歴は消さない・運営判断）と矛盾しない', () => {
    const item = QA_2026.find((q) => q.question.includes('間違えて'))
    expect(item?.answer).toContain('取り消せません')
    expect(item?.answer).not.toContain('bonus')
  })
  it('コイン上限4枚・1ライン1枚（G-11）が書かれている', () => {
    expect(allText()).toContain('最大4枚')
  })
  // 今年はコイン使用画面をガチャポン筐体の前でスタッフに見せる運用（使用確認画面の案内と揃える）
  it('T-4b コインの使い方が使用画面の案内（スタッフに見せる）と揃っている', () => {
    const item = QA_2026.find((q) => q.question.includes('コインはどうやって使い'))
    expect(item?.answer).toContain('スタッフにお見せください')
    expect(allText()).not.toContain('立会いはありません')
  })
  it('困ったときの窓口は1番の「近畿大学 須藤ゼミ」ブースに揃っている', () => {
    expect(allText()).toContain('1番の「近畿大学 須藤ゼミ」ブースまで来てください')
    expect(allText()).not.toContain('PRoToFES BINGO')
  })
  // 今年のチェックインは QR と手動コードの2方式で、ブース一覧から選ぶ経路は撤去する。
  // Q&A が存在しない導線を案内すると、カメラが使えない参加者が詰まる
  it('T-4d カメラが使えないときの案内が「コードを入力」を指している', () => {
    const item = QA_2026.find((q) => q.question.includes('チェックインができません'))
    expect(item?.answer).toContain('コードを入力')
    expect(item?.answer).not.toContain('ブース一覧')
  })
})
