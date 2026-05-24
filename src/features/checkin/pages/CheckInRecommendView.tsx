import type { V1RecommendationBooth } from '@/shared/api/v1Participant'
import { v1RecommendationReasonLabel } from '@/shared/api/v1Participant'

type Props = {
  booths: V1RecommendationBooth[]
  loading: boolean
  submitting: boolean
  onSelect: (boothId: string) => void
  onSkip: () => void
}

export function CheckInRecommendView({ booths, loading, submitting, onSelect, onSkip }: Props) {
  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">読み込み中</span>
        </div>
        <p className="mt-2">おすすめブースを取得しています…</p>
      </div>
    )
  }

  return (
    <div className="checkin-recommend-view">
      <h2 className="result-title">おすすめブース</h2>
      <p className="result-message mb-4">次に訪れるブースを選んでください（スキップ可）</p>
      <div className="d-grid gap-3 mb-4">
        {booths.map((b) => (
          <button
            key={b.id}
            type="button"
            className="btn btn-light text-start checkin-recommend-card"
            disabled={submitting}
            onClick={() => onSelect(b.id)}
          >
            <span className="badge bg-dark me-2">{v1RecommendationReasonLabel(b.reason)}</span>
            <strong>{b.name}</strong>
            {b.labels.length > 0 ? (
              <span className="d-block small text-muted mt-1">{b.labels.join(' ')}</span>
            ) : null}
          </button>
        ))}
      </div>
      <button type="button" className="checkin-home-button" disabled={submitting} onClick={onSkip}>
        あとで決める
      </button>
    </div>
  )
}
