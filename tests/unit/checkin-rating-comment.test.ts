import { describe, expect, it } from 'vitest'
import { clampComment, COMMENT_MAX_LENGTH, nextCommentValue } from '@/features/checkin/pages/CheckInRatingModal'

/**
 * NG-16（2026-09-29 手動E2E）: ブースの評価コメント欄で、IME変換中は textarea の
 * `maxLength` が効かず 501 文字が state に入ってしまい、サーバー（zod `max(500)`）に
 * 拒否されて評価ごと失われる不具合の回帰テスト。
 *
 * このリポジトリには React コンポーネントのレンダリングテスト基盤が無いため、
 * `use-later-rating.test.ts` と同じ方針で、コンポーネントから分離した純粋関数
 * （`clampComment` / `nextCommentValue`）を直接検証する。
 */
describe('COMMENT_MAX_LENGTH（NG-16）', () => {
  it('サーバー側 checkins.ts の comment: z.string().max(500) と同じ 500 である', () => {
    expect(COMMENT_MAX_LENGTH).toBe(500)
  })
})

describe('clampComment（NG-16）', () => {
  it('上限以下ならそのまま返す', () => {
    expect(clampComment('あいう', 500)).toBe('あいう')
    expect(clampComment('', 500)).toBe('')
  })

  it('501文字を入れても500文字に切り詰める', () => {
    const over = '一二三四五六七八九十'.repeat(50) + '超' // 501文字
    expect(over).toHaveLength(501)
    const result = clampComment(over, COMMENT_MAX_LENGTH)
    expect(result).toHaveLength(500)
    expect(result).toBe('一二三四五六七八九十'.repeat(50))
  })

  it('ちょうど500文字ならそのまま返す', () => {
    const exact = '一二三四五六七八九十'.repeat(50)
    expect(exact).toHaveLength(500)
    expect(clampComment(exact, COMMENT_MAX_LENGTH)).toBe(exact)
  })

  it('600文字でも500文字に切り詰める（完了直前の最終防御と同じ経路）', () => {
    const over = 'あ'.repeat(600)
    expect(clampComment(over, COMMENT_MAX_LENGTH)).toHaveLength(500)
  })

  it('境界がサロゲートペア（絵文字）の前半に当たる場合、ペアごと落として499文字にする', () => {
    // 'あ'499文字 + 😀（サロゲートペア2コード単位）＝ UTF-16で501
    const withEmoji = 'あ'.repeat(499) + '😀'
    expect(withEmoji).toHaveLength(501)
    const result = clampComment(withEmoji, COMMENT_MAX_LENGTH)
    // 500文字目（インデックス499）が😀のハイサロゲートなので499文字まで切る
    expect(result).toHaveLength(499)
    expect(result).toBe('あ'.repeat(499))
    // ローサロゲート単体が末尾に残っていない（壊れた文字にならない）
    const lastCode = result.charCodeAt(result.length - 1)
    expect(lastCode < 0xd800 || lastCode > 0xdfff).toBe(true)
  })

  it('サロゲートペア（絵文字）がちょうど500文字目で終わる場合はペアを割らずそのまま500文字に収める', () => {
    // 'あ'498文字 + 😀（インデックス498-499）+ 'x'（インデックス500）＝ UTF-16で501
    // 500文字目（インデックス499）は😀の「ローサロゲート」に当たる。
    // ハイサロゲート判定（0xd800〜0xdbff）だけを見て cut を1つ減らすべきで、
    // ローサロゲート（0xdc00〜0xdfff）まで含めて減らすと、まだペアが割れていないのに
    // 余分に切ってしまい、今度はペアの前半（ハイサロゲート）が単独で末尾に残って壊れる。
    const withEmojiAtBoundary = 'あ'.repeat(498) + '😀' + 'x'
    expect(withEmojiAtBoundary).toHaveLength(501)
    const result = clampComment(withEmojiAtBoundary, COMMENT_MAX_LENGTH)
    expect(result).toHaveLength(500)
    expect(result).toBe('あ'.repeat(498) + '😀')
    // コードポイント単位で数えて499（'あ'498個+😀1個）なら、孤立したサロゲートが
    // 紛れ込んでいない（孤立サロゲートは1コードポイントとしてU+FFFD相当に化ける）
    expect(Array.from(result)).toHaveLength(499)
  })

  it('境界がサロゲートペアにまたがらない場合はちょうど500文字で切る', () => {
    // 'あ'500文字 + 😀 ＝ UTF-16で502、500文字目（インデックス499）は'あ'
    const withEmoji = 'あ'.repeat(500) + '😀'
    const result = clampComment(withEmoji, COMMENT_MAX_LENGTH)
    expect(result).toHaveLength(500)
    expect(result).toBe('あ'.repeat(500))
  })
})

describe('nextCommentValue（NG-16: IME変換中の扱い）', () => {
  it('変換中でなければ500文字に切り詰める', () => {
    const over = 'あ'.repeat(501)
    expect(nextCommentValue(over, false)).toHaveLength(500)
  })

  it('変換中は変換を壊さないよう500文字を超えても切り詰めない', () => {
    const over = 'あ'.repeat(501)
    expect(nextCommentValue(over, true)).toBe(over)
    expect(nextCommentValue(over, true)).toHaveLength(501)
  })

  it('変換確定（compositionend相当のclampComment適用）で500文字に収まる', () => {
    // onChange(isComposing=true) → 501文字がそのまま入る → compositionEnd で切り詰め
    const duringComposition = nextCommentValue('一二三四五六七八九十'.repeat(50) + '超', true)
    expect(duringComposition).toHaveLength(501)
    const afterCompositionEnd = clampComment(duringComposition, COMMENT_MAX_LENGTH)
    expect(afterCompositionEnd).toHaveLength(500)
  })
})
