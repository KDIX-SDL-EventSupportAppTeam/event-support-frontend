import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminAwardResults, type AdminAwardResults } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

/** この画面を開いている間だけ、この間隔でサーバーへ取りに行く */
const POLL_INTERVAL_MS = 30_000

const RANK_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: '🥇 1位', className: 'bg-warning text-dark' },
  2: { label: '🥈 2位', className: 'bg-secondary' },
  3: { label: '🥉 3位', className: 'bg-danger-subtle text-dark' },
}

const pct = (rate: number | null) => (rate == null ? '—' : `${(rate * 100).toFixed(1)}%`)

/**
 * アワード結果（運営）。全賞の上位3位と投票者数などを表示する。
 *
 * - 集計・順位・率はすべてサーバー（GET /admin/events/:id/awards/results）が計算する。ここは表示だけ
 * - 自動更新は**この画面を開いている間だけ** 30 秒ごと。タブが裏にある間は止め、戻ったら即時取得する
 */
export function AdminAwardResultsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [data, setData] = useState<AdminAwardResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      setData(await fetchAdminAwardResults(eventId))
      setError(null)
    } catch (e) {
      // 前回の結果は残したまま、エラーだけ出す
      setError(formatClientError(e, 'アワード結果の取得に失敗しました'))
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    // 画面を離れたら止める（他の画面ではリクエストを飛ばさない）
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const s = data?.summary

  return (
    <AdminShell title="アワード結果">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="small text-muted">
          <i className="bi bi-arrow-repeat me-1" />
          30秒ごとに自動更新
          {data ? <> ・ 最終更新 {new Date(data.generated_at).toLocaleTimeString('ja-JP')}</> : null}
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => void load()} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-arrow-clockwise me-1" />}
          今すぐ更新
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      )}

      {!data ? (
        !error && (
          <div className="text-center text-muted py-5">
            <span className="spinner-border spinner-border-sm me-2" />
            読み込み中…
          </div>
        )
      ) : (
        <>
          <div className="row g-3 mb-4">
            <SummaryTile
              label="投票の状態"
              value={
                <span className={`badge fs-6 ${data.voting_open ? 'bg-success' : 'bg-secondary'}`}>
                  {data.voting_open ? '受付中' : '停止中'}
                </span>
              }
            />
            <SummaryTile label="投票者数" value={`${s!.voters} 人`} sub={`参加者 ${s!.total_participants} 人中`} />
            <SummaryTile label="投票率" value={pct(s!.voter_rate)} />
            <SummaryTile label="総票数" value={`${s!.total_votes} 票`} sub={`${s!.award_count} 賞`} />
          </div>

          {data.awards.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center text-muted py-5">賞がまだありません</div>
            </div>
          ) : (
            <div className="row g-3">
              {data.awards.map((a) => (
                <div key={a.id} className="col-12 col-lg-6 col-xxl-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white d-flex align-items-center justify-content-between">
                      <span className="fw-semibold">
                        <i className="bi bi-trophy me-2 text-warning" />
                        {a.name}
                      </span>
                      <span className="small text-muted">
                        {a.total_votes} 票 ・ {a.booths_with_votes} ブース
                      </span>
                    </div>
                    {a.top.length === 0 ? (
                      <div className="card-body text-center text-muted py-4">まだ投票がありません</div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {a.top.map((b) => {
                          const badge = RANK_BADGE[b.rank] ?? { label: `${b.rank}位`, className: 'bg-light text-dark' }
                          return (
                            <li key={b.booth_id} className="list-group-item">
                              <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${badge.className}`} style={{ minWidth: 64 }}>
                                  {badge.label}
                                </span>
                                <span className="flex-grow-1 text-truncate fw-semibold">{b.booth_name}</span>
                                <span className="text-nowrap">
                                  <strong>{b.votes}</strong> 票
                                  <span className="small text-muted ms-1">（{pct(b.share)}）</span>
                                </span>
                              </div>
                              <div className="progress mt-2" style={{ height: 6 }}>
                                <div className="progress-bar bg-warning" style={{ width: `${b.share * 100}%` }} />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="small text-muted mt-3 mb-0">
            同票は同順位です（同率があると4件以上表示されます）。集計対象は参加者・出展者・閲覧者の票で、管理者（manager）の試し投票は含みません。
          </p>
        </>
      )}
    </AdminShell>
  )
}

function SummaryTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="small text-muted">{label}</div>
          <div className="fs-4 fw-bold mt-1">{value}</div>
          {sub ? <div className="small text-muted">{sub}</div> : null}
        </div>
      </div>
    </div>
  )
}
