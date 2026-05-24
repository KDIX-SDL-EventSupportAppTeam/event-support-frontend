import { useState } from 'react'

type Props = {
  boothName: string
  onSubmit: (rating: number) => void
  onSkip: () => void
  submitting: boolean
}

export function CheckInRatingModal({ boothName, onSubmit, onSkip, submitting }: Props) {
  const [rating, setRating] = useState(0)

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
        <div className="d-grid gap-2">
          <button
            type="button"
            className="checkin-home-button"
            disabled={rating < 1 || submitting}
            onClick={() => onSubmit(rating)}
          >
            {submitting ? '送信中…' : '評価を送信'}
          </button>
          <button type="button" className="btn btn-outline-secondary" disabled={submitting} onClick={onSkip}>
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}
