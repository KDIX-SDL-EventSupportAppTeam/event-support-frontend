import { useState, type ChangeEvent, type CompositionEvent } from 'react'
import { RATING_SCALE } from '@/shared/config/rating'

type Props = {
  boothName: string
  onComplete: (rating: number, comment: string) => void
  submitting: boolean
  /**
   * 評価の段階数。ハードコードしない。
   * `GET /bingo/card` の `rating_scale` に従う（既定 4）。
   */
  ratingScale?: number
}

const DEFAULT_RATING_SCALE = RATING_SCALE

/**
 * コメント欄の上限文字数。サーバー側 `checkins.ts` の `comment: z.string().max(500)` と一致させる
 * （NG-16: ここを増やすときはサーバー側の上限も一緒に見直す）。
 */
export const COMMENT_MAX_LENGTH = 500

/**
 * value を UTF-16 コード単位で limit 文字に切り詰める。
 * サーバーの zod（`z.string().max(500)`）も textarea の `maxLength` も UTF-16 単位で数えるため、
 * ここも UTF-16 単位のままでよい。ただしちょうど limit 文字目でサロゲートペア
 * （絵文字など）を分断すると壊れた文字（U+FFFD 等）になるため、
 * limit-1 文字目がハイサロゲート（U+D800–U+DBFF）なら 1 文字少なく切る。
 *
 * 背景（NG-16）: 日本語入力のあと、コメントが 501 文字（カウンター 501/500）のまま
 * 「完了」でき、サーバーが 422 で拒否して評価ごと失われたことがある。IME 変換中は
 * `maxLength` が効かず 500 文字を超えた値が `onChange` に来ることは確かめたが、
 * 確定後も 501 文字が残る経路は再現できていない（推定）。確実に効くのは「完了」直前の
 * 切り詰めで、`onChange`／`onCompositionEnd` の切り詰めは表示を 500 文字に揃えるためのもの。
 */
export function clampComment(value: string, limit: number = COMMENT_MAX_LENGTH): string {
  if (value.length <= limit) return value
  let cut = limit
  const code = value.charCodeAt(cut - 1)
  if (code >= 0xd800 && code <= 0xdbff) {
    cut -= 1
  }
  return value.slice(0, cut)
}

/** ネイティブイベントが IME 変換中（`isComposing`）かどうかを安全に判定する。 */
function isComposingEvent(e: ChangeEvent<HTMLTextAreaElement>): boolean {
  const native: unknown = e.nativeEvent
  return (
    typeof native === 'object' &&
    native !== null &&
    'isComposing' in native &&
    (native as { isComposing?: boolean }).isComposing === true
  )
}

/**
 * `onChange` で次に state へ入れる値を決める。変換中（`isComposing`）は変換を
 * 壊さないようそのまま返し、変換中でなければ `clampComment` で切り詰める（NG-16）。
 */
export function nextCommentValue(raw: string, isComposing: boolean): string {
  return isComposing ? raw : clampComment(raw)
}

/**
 * チェックイン成功モーダルの評価ステップ。
 * 仕様: docs/specs/bingo-dynamic-unlock/03-checkin-flow.md
 *
 * 星（中央値なし）＋ コメント欄 ＋「完了」ボタン1つ。
 * 星未選択で完了しても評価を送らず次へ進む（スキップ扱い、エラーにしない）。
 */
export function CheckInRatingModal({ boothName, onComplete, submitting, ratingScale }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const scale =
    ratingScale && Number.isFinite(ratingScale) && ratingScale > 0 ? Math.floor(ratingScale) : DEFAULT_RATING_SCALE

  // 変換中（isComposing）はそのまま受け、変換を壊さない。変換中でなければ
  // その場で 500 文字に切り詰める（NG-16）。
  function handleCommentChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setComment(nextCommentValue(e.target.value, isComposingEvent(e)))
  }

  // IME の変換確定時。変換中に上限を超えて入ってきた分をここで切り詰める。
  function handleCommentCompositionEnd(e: CompositionEvent<HTMLTextAreaElement>) {
    setComment(clampComment(e.currentTarget.value))
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="checkin-rating-title">
      <div className="modal-content text-center checkin-rating-modal">
        <h2 id="checkin-rating-title" className="result-title">
          ブースの評価
        </h2>
        <p className="result-message mb-3">
          「{boothName}」はいかがでしたか？
          <br />
          未選択のまま完了してもかまいません
        </p>
        <div className="checkin-rating-stars mb-4" role="group" aria-label="評価">
          {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`btn btn-link checkin-star ${rating >= n ? 'active' : ''}`}
              onClick={() => setRating(n)}
              disabled={submitting}
              aria-label={`${n}点`}
            >
              <i className={`bi ${rating >= n ? 'bi-star-fill' : 'bi-star'}`} aria-hidden />
            </button>
          ))}
        </div>
        <div className="mb-3 text-start">
          <label htmlFor="checkin-comment" className="form-label small fw-semibold">
            コメント（任意）
          </label>
          <textarea
            id="checkin-comment"
            className="form-control checkin-comment-textarea"
            rows={4}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="感想やご意見があればご記入ください（任意）"
            value={comment}
            onChange={handleCommentChange}
            onCompositionEnd={handleCommentCompositionEnd}
            disabled={submitting}
          />
          <div className="text-end text-muted" style={{ fontSize: '0.75rem' }}>
            {comment.length}/{COMMENT_MAX_LENGTH}
          </div>
        </div>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="checkin-home-button"
            disabled={submitting}
            onClick={() => onComplete(rating, clampComment(comment))}
          >
            {submitting ? '送信中…' : '完了'}
          </button>
        </div>
      </div>
    </div>
  )
}
