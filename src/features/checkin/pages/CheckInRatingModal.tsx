import { useState } from 'react'

type Props = {
  boothName: string
  onSubmit: (rating: number, comment: string) => void
  onSkip: () => void
  submitting: boolean
}

export function CheckInRatingModal({ boothName, onSubmit, onSkip, submitting }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="checkin-rating-title">
      <div className="modal-content text-center checkin-rating-modal">
        <h2 id="checkin-rating-title" className="result-title">
          ブースの評価
        </h2>
        <p className="result-message mb-3">
          「{boothName}」はいかがでしたか？
          <br />
          5段階で評価してください（スキップ可）
        </p>
        <div className="checkin-rating-stars mb-4" role="group" aria-label="評価">
          {[1, 2, 3, 4, 5].map((n) => (
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
            disabled={rating < 1 || submitting}
            onClick={() => onSubmit(rating, comment)}
          >
            {submitting ? '送信中…' : '評価を送信'}
          </button>
          {rating < 1 && comment.trim() !== '' ? (
            <p className="small text-muted mb-0">送信には星の選択が必要です</p>
          ) : null}
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={submitting}
            onClick={() => setShowLeaveConfirm(true)}
          >
            スキップ
          </button>
        </div>
      </div>
      {showLeaveConfirm ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="leave-confirm-title">
          <div className="modal-content text-center">
            <h3 id="leave-confirm-title" className="result-title">
              評価を送信せずに戻りますか？
            </h3>
            <p className="result-message mb-3">
              {rating >= 1 || comment.trim() !== ''
                ? '入力した内容はまだ送信されていません。破棄して進みますか？'
                : '評価はイベント改善の参考になります。よろしければご協力ください。'}
            </p>
            <div className="d-grid gap-2">
              <button type="button" className="checkin-home-button" onClick={() => setShowLeaveConfirm(false)}>
                入力に戻る
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={onSkip}>
                このまま戻る
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
