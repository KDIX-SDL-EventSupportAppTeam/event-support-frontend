import { useState } from 'react'

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

const DEFAULT_RATING_SCALE = 4

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
            maxLength={500}
            placeholder="感想やご意見があればご記入ください（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
          />
          <div className="text-end text-muted" style={{ fontSize: '0.75rem' }}>
            {comment.length}/500
          </div>
        </div>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="checkin-home-button"
            disabled={submitting}
            onClick={() => onComplete(rating, comment)}
          >
            {submitting ? '送信中…' : '完了'}
          </button>
        </div>
      </div>
    </div>
  )
}
