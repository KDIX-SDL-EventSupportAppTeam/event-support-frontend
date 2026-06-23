import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  fetchAdminDashboard,
  type AdminDashboard,
  type CheckinNewEvent,
} from '@/shared/api/v1Admin'
import { connectSocket, disconnectSocket } from '@/shared/api/socket'
import { formatClientError } from '@/shared/lib/formatClientError'

export function DashboardPage() {
  const token = useAuthStore((s) => s.token)
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [recent, setRecent] = useState<CheckinNewEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    fetchAdminDashboard(eventId)
      .then(setData)
      .catch((e) => setError(formatClientError(e, 'ダッシュボードの取得に失敗しました')))
    const timer = setInterval(() => {
      fetchAdminDashboard(eventId).then(setData).catch(() => undefined)
    }, 60_000)
    return () => clearInterval(timer)
  }, [eventId])

  useEffect(() => {
    if (!token || !eventId) return
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
    const socket = connectSocket(token, apiBase)
    const onNew = (payload: CheckinNewEvent) => {
      setRecent((prev) => [payload, ...prev].slice(0, 10))
      setData((prev) =>
        prev
          ? {
              ...prev,
              summary: {
                ...prev.summary,
                total_checkins: prev.summary.total_checkins + 1,
              },
              booths: prev.booths.map((b) =>
                b.id === payload.booth_id
                  ? { ...b, checkin_count: b.checkin_count + 1 }
                  : b,
              ),
            }
          : prev,
      )
    }
    // 評価は集計（平均評価など）に影響するため、受信したら最新値を取り直す
    const onRating = () => {
      fetchAdminDashboard(eventId).then(setData).catch(() => undefined)
    }
    socket.on('checkin:new', onNew)
    socket.on('rating:new', onRating)
    return () => {
      socket.off('checkin:new', onNew)
      socket.off('rating:new', onRating)
      disconnectSocket()
    }
  }, [token, eventId])

  if (error) {
    return (
      <AdminShell title="ダッシュボード">
        <p className="text-danger">{error}</p>
      </AdminShell>
    )
  }

  if (!data) {
    return (
      <AdminShell title="ダッシュボード">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </AdminShell>
    )
  }

  const maxCheckin = Math.max(...data.booths.map((b) => b.checkin_count), 1)
  const maxTimeline = Math.max(...data.checkin_timeline.map((t) => t.count), 1)

  return (
    <AdminShell title="ダッシュボード">
      {/* サマリーカード */}
      <div className="row g-3 mb-4">
        {[
          { label: '参加者数', value: data.summary.total_participants, icon: 'bi-person-check', color: '#0d6efd' },
          { label: 'チェックイン数', value: data.summary.total_checkins, icon: 'bi-qr-code-scan', color: '#198754' },
          { label: '平均チェックイン/人', value: data.summary.avg_checkins_per_user, icon: 'bi-graph-up', color: '#fd7e14' },
        ].map((card) => (
          <div key={card.label} className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: card.color + '18' }}
                >
                  <i className={`bi ${card.icon} fs-5`} style={{ color: card.color }} />
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>{card.label}</div>
                  <div className="fw-bold fs-3 lh-1">{card.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* ブース別チェックイン バーチャート */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-bar-chart me-2 text-primary" />
                ブース別チェックイン数
              </h2>
              {data.booths.length === 0 ? (
                <p className="text-muted small">データなし</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {data.booths.slice(0, 10).map((b, i) => (
                    <div key={b.id}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small text-truncate" style={{ maxWidth: '60%' }}>
                          <span className="text-muted me-1">{i + 1}.</span>
                          {b.name}
                        </span>
                        <span className="small fw-semibold">
                          {b.checkin_count}
                          {b.avg_rating != null && (
                            <span className="text-warning ms-2">
                              <i className="bi bi-star-fill" style={{ fontSize: '0.7rem' }} />
                              {Number(b.avg_rating).toFixed(1)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${(b.checkin_count / maxCheckin) * 100}%`, backgroundColor: '#0d6efd' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* チェックイン推移 */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-clock-history me-2 text-success" />
                チェックイン推移（10分刻み）
              </h2>
              {data.checkin_timeline.length === 0 ? (
                <p className="text-muted small">データなし</p>
              ) : (
                <div className="d-flex flex-column gap-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {data.checkin_timeline.map((t) => (
                    <div key={t.time_slot} className="d-flex align-items-center gap-2">
                      <span className="text-muted" style={{ fontSize: '0.75rem', width: 36, flexShrink: 0 }}>
                        {t.time_slot}
                      </span>
                      <div className="flex-grow-1 progress" style={{ height: 16 }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${(t.count / maxTimeline) * 100}%` }}
                        />
                      </div>
                      <span className="fw-semibold" style={{ fontSize: '0.8rem', width: 24, textAlign: 'right' }}>
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* リアルタイムチェックイン */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h6 fw-bold mb-3">
            <i className="bi bi-lightning-charge me-2 text-warning" />
            リアルタイムチェックイン
            {recent.length > 0 && (
              <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                {recent.length}
              </span>
            )}
          </h2>
          {recent.length === 0 ? (
            <p className="text-muted small mb-0">
              <i className="bi bi-wifi me-1" />
              WebSocket 接続中 — チェックインがあるとここに表示されます
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {recent.map((item, idx) => (
                <div
                  key={`${item.booth_id}-${item.checked_in_at}-${idx}`}
                  className="d-flex align-items-center gap-2 p-2 rounded"
                  style={{ backgroundColor: idx === 0 ? '#fff3cd' : '#f8f9fa' }}
                >
                  <i className="bi bi-person-check text-success" />
                  <span className="fw-semibold small">{item.user_display_name}</span>
                  <i className="bi bi-arrow-right text-muted" style={{ fontSize: '0.7rem' }} />
                  <span className="small">{item.booth_name}</span>
                  <span className="text-muted ms-auto" style={{ fontSize: '0.72rem' }}>
                    {item.checked_in_at}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
