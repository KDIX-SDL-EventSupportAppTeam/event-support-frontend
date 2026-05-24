import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLegacyBoothList } from '@/shared/hooks/useLegacyBoothList'
import { useAuthStore } from '@/features/auth/store/authStore'
import '@/features/booth/styles/legacy-booth-list.scss'
import type { LegacyBooth } from '@/shared/types/legacyBooth'

export function BoothListPage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const { booths, checkedInBoothIds, loading } = useLegacyBoothList(eventId, userId)
  const [sortByCheckedIn, setSortByCheckedIn] = useState(false)
  const [selected, setSelected] = useState<LegacyBooth | null>(null)

  const sorted = useMemo(() => {
    if (!sortByCheckedIn) return booths
    return [...booths].sort((a, b) => {
      const ac = checkedInBoothIds.includes(a.booth_id) ? 1 : 0
      const bc = checkedInBoothIds.includes(b.booth_id) ? 1 : 0
      return bc - ac
    })
  }, [booths, checkedInBoothIds, sortByCheckedIn])

  function isCheckedIn(id: string) {
    return checkedInBoothIds.includes(id)
  }

  return (
    <div className="legacy-booth-list container py-4">
      <div className="header">
        <h1 className="main-title">ブース一覧</h1>
      </div>

      <div className="sort-container mb-3">
        <button
          type="button"
          className={`btn sort-button ${sortByCheckedIn ? 'active' : ''}`}
          onClick={() => setSortByCheckedIn((v) => !v)}
        >
          チェックイン済みを優先表示
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="booth-list">
          {sorted.map((booth) => (
            <div
              key={booth.booth_id}
              className={`card booth-card ${isCheckedIn(booth.booth_id) ? 'checked-in' : ''}`}
              onClick={() => setSelected(booth)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(booth)}
              role="button"
              tabIndex={0}
            >
              <div className="card-body">
                <div className="booth-identity-area">
                  <div className="booth-number-badge">
                    {(booth.booth_display_code ?? booth.booth_id).toUpperCase()}
                  </div>
                  <span className="booth-emoji">{booth.booth_emoji}</span>
                </div>
                <div className="booth-content">
                  <div className="booth-header">
                    <h5 className="card-title mb-0">{booth.booth_name}</h5>
                    {isCheckedIn(booth.booth_id) ? (
                      <span className="text-success">
                        <i className="bi bi-check-circle-fill" aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="card-text small mb-0">{booth.booth_description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer mt-4">
        <button type="button" className="home-button" onClick={() => navigate('/home')}>
          ホームに戻る
        </button>
      </div>

      {selected ? (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelected(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selected.booth_name}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                {selected.booth_image_url ? (
                  <img src={selected.booth_image_url} alt="" className="img-fluid rounded mb-3" />
                ) : null}
                <p>{selected.booth_description || '説明がありません。'}</p>
                {!isCheckedIn(selected.booth_id) ? (
                  <button
                    type="button"
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => {
                      setSelected(null)
                      navigate(`/checkin?booth_id=${encodeURIComponent(selected.booth_id)}`)
                    }}
                  >
                    チェックイン
                  </button>
                ) : (
                  <p className="text-success text-center mt-3 mb-0">
                    <i className="bi bi-check-circle-fill" aria-hidden /> チェックイン済み
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
