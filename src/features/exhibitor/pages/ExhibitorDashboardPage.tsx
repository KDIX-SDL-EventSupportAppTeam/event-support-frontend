import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useExhibitorStats } from '@/features/exhibitor/hooks/useExhibitorStats'
import { useExhibitorStore } from '@/features/exhibitor/store/exhibitorStore'
import { useAuthStore } from '@/shared/auth/authStore'

/**
 * 出展者ダッシュボード（/exhibitor）。
 * ガードは RequireAuth のみ（判定が非同期API依存のため RequireExhibitor は作らず、
 * ページ内で「ロード中→権限なし→担当ブース0→通常表示」の順に分岐する）。
 * 仕様: 改修プラン frontend_43_出展者管理画面.md §4-7
 */
export function ExhibitorDashboardPage() {
  const navigate = useNavigate()
  const eventId = useAuthStore((s) => s.user?.event_id)
  const userId = useAuthStore((s) => s.user?.id)
  const clearSession = useAuthStore((s) => s.clearSession)

  const loaded = useExhibitorStore((s) => s.loaded)
  const isExhibitor = useExhibitorStore((s) => s.isExhibitor)
  const booths = useExhibitorStore((s) => s.booths)
  const ensureLoaded = useExhibitorStore((s) => s.ensureLoaded)
  const resetExhibitor = useExhibitorStore((s) => s.reset)

  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !userId) return
    ensureLoaded(eventId, userId)
  }, [eventId, userId, ensureLoaded])

  useEffect(() => {
    if (booths.length > 0 && !selectedBoothId) {
      setSelectedBoothId(booths[0].id)
    }
  }, [booths, selectedBoothId])

  const { data, error } = useExhibitorStats(eventId, selectedBoothId)

  const sortedComments = useMemo(() => {
    if (!data) return []
    return [...data.comments].sort(
      (a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime(),
    )
  }, [data])

  function onLogout() {
    clearSession()
    resetExhibitor()
    navigate('/login')
  }

  // 1. ロード中はスピナー（HomePage:150-155 と同じ形）
  if (!loaded) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">読み込み中...</p>
      </div>
    )
  }

  // 2. 出展者権限なし（403相当の見た目。データは一切出さない）
  if (!isExhibitor) {
    return (
      <div className="text-center p-5">
        <p className="mb-3">出展者権限がありません。参加者ホームに戻る</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
          参加者ホームへ
        </button>
      </div>
    )
  }

  // 3. 担当ブース未設定
  if (booths.length === 0) {
    return (
      <div className="text-center p-5">
        <p className="mb-0">担当ブースが未設定です。運営にお問い合わせください</p>
      </div>
    )
  }

  // 4. 通常表示
  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0 fw-bold">出展者ダッシュボード</h1>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/home')}>
            参加者画面へ
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      ) : null}

      <div className="mb-3">
        {booths.length > 1 ? (
          <select
            className="form-select"
            value={selectedBoothId ?? ''}
            onChange={(e) => setSelectedBoothId(e.target.value)}
          >
            {booths.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="fw-semibold">
            <i className="bi bi-shop me-1" />
            {booths[0].name}
          </div>
        )}
      </div>

      {!data ? (
        <div className="text-center p-4 text-muted">読み込み中…</div>
      ) : (
        <>
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-3">{data.total_checkins}</div>
                  <div className="text-muted small">チェックイン総数</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-3">
                    {data.ratings.avg_rating !== null ? (
                      <>
                        <span className="text-warning">★</span> {data.ratings.avg_rating.toFixed(1)}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-muted small">平均評価</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-3">{data.ratings.count}</div>
                  <div className="text-muted small">評価件数</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="fw-semibold mb-2">時間帯別チェックイン</div>
              {data.hourly_checkins.length === 0 ? (
                <p className="text-muted small mb-0">まだチェックインがありません</p>
              ) : (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hourly_checkins}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time_slot" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar isAnimationActive={false} dataKey="count" fill="#0d6efd" name="チェックイン数" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="fw-semibold mb-2">コメント一覧</div>
              {sortedComments.length === 0 ? (
                <p className="text-muted small mb-0">まだコメントがありません</p>
              ) : (
                <div className="list-group list-group-flush">
                  {sortedComments.map((c) => (
                    <div key={c.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-warning">
                          {'★'.repeat(c.rating)}
                          {'☆'.repeat(Math.max(0, 5 - c.rating))}
                        </span>
                        <span className="text-muted small">{new Date(c.rated_at).toLocaleString('ja-JP')}</span>
                      </div>
                      {c.comment ? <div className="mt-1">{c.comment}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
