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
    socket.on('checkin:new', onNew)
    return () => {
      socket.off('checkin:new', onNew)
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

  return (
    <AdminShell title="ダッシュボード">
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">参加者数</div>
              <div className="display-6">{data.summary.total_participants}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">チェックイン数</div>
              <div className="display-6">{data.summary.total_checkins}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">平均チェックイン/人</div>
              <div className="display-6">{data.summary.avg_checkins_per_user}</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="h5">ブース別チェックイン</h2>
      <div className="table-responsive mb-4">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>ブース</th>
              <th>チェックイン</th>
              <th>平均評価</th>
            </tr>
          </thead>
          <tbody>
            {data.booths.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.checkin_count}</td>
                <td>{b.avg_rating ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h5">チェックイン推移（10分刻み）</h2>
      <div className="table-responsive mb-4">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>時刻</th>
              <th>件数</th>
            </tr>
          </thead>
          <tbody>
            {data.checkin_timeline.map((t) => (
              <tr key={t.time_slot}>
                <td>{t.time_slot}</td>
                <td>{t.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h5">リアルタイムチェックイン</h2>
      {recent.length === 0 ? (
        <p className="text-muted">まだ通知はありません</p>
      ) : (
        <ul className="list-group">
          {recent.map((item, idx) => (
            <li key={`${item.booth_id}-${item.checked_in_at}-${idx}`} className="list-group-item">
              {item.user_display_name} → {item.booth_name} ({item.checked_in_at})
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
