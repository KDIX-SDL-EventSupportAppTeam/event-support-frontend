import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/shared/auth/authStore'
import { deleteAdminParticipant, fetchAdminParticipants, type AdminParticipant } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

export function ParticipantsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [items, setItems] = useState<AdminParticipant[]>([])
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!eventId) return
    setItems(await fetchAdminParticipants(eventId))
  }

  useEffect(() => {
    reload().catch((e) => setError(formatClientError(e, '参加者取得に失敗しました')))
  }, [eventId])

  async function onDelete(userId: string) {
    if (!eventId || !confirm('参加者を削除しますか？')) return
    try {
      await deleteAdminParticipant(eventId, userId)
      await reload()
    } catch (err) {
      setError(formatClientError(err, '削除に失敗しました'))
    }
  }

  const maxCheckin = Math.max(...items.map((p) => p.checkin_count), 1)

  return (
    <AdminShell title="参加者一覧">
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex gap-4">
          <span className="small text-muted">
            <i className="bi bi-people me-1" />
            合計 <strong>{items.length}</strong> 人
          </span>
          <span className="small text-muted">
            <i className="bi bi-qr-code-scan me-1" />
            総チェックイン <strong>{items.reduce((s, p) => s + p.checkin_count, 0)}</strong> 件
          </span>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        {items.length === 0 ? (
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-people fs-1 d-block mb-2" />
            参加者がまだいません
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {items.map((p) => (
              <div key={p.id} className="list-group-item d-flex align-items-center gap-3 p-3">
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{ width: 36, height: 36, fontSize: '0.85rem' }}
                >
                  {(p.display_name ?? p.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-semibold">{p.display_name ?? '—'}</div>
                  <div className="text-muted small">{p.email}</div>
                  <div className="mt-1" style={{ maxWidth: 160 }}>
                    <div className="progress" style={{ height: 4 }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${(p.checkin_count / maxCheckin) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center flex-shrink-0" style={{ minWidth: 48 }}>
                  <div className="fw-bold">{p.checkin_count}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>チェックイン</div>
                </div>
                <div className="text-muted flex-shrink-0 d-none d-md-block" style={{ fontSize: '0.75rem' }}>
                  {p.created_at?.slice(0, 10)}
                </div>
                <button type="button" className="btn btn-sm btn-outline-danger flex-shrink-0" onClick={() => onDelete(p.id)}>
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
