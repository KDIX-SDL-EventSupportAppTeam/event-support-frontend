import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { resolveAuditAction, resolveActorRoleLabel } from '@/features/admin/config/auditActions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchAdminAuditLogs, type AdminAuditLogPage } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

const PAGE_SIZE = 50

/** ISO 文字列（例: 2026-07-01T12:34:56Z）を日本語の日時表記に整形する */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** detail から表示に役立つ補足（招待メールなど）を 1 行で取り出す */
function formatDetail(detail: unknown): string | null {
  if (detail && typeof detail === 'object') {
    const obj = detail as Record<string, unknown>
    if (typeof obj.email === 'string') return obj.email
    if (typeof obj.name === 'string') return obj.name
  }
  return null
}

export function AuditLogsPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [data, setData] = useState<AdminAuditLogPage | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    fetchAdminAuditLogs(eventId, page, PAGE_SIZE)
      .then((res) => {
        setData(res)
        setError(null)
      })
      .catch((e) => setError(formatClientError(e, '変更履歴の取得に失敗しました')))
      .finally(() => setLoading(false))
  }, [eventId, page])

  const logs = data?.audit_logs ?? []
  const totalPages = data?.pagination.total_pages ?? 1
  const total = data?.pagination.total ?? 0

  return (
    <AdminShell title="変更履歴">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <h2 className="h6 fw-bold mb-0">
              <i className="bi bi-clock-history me-2 text-primary" />
              運営操作の履歴
            </h2>
            <span className="text-muted small ms-auto">全 {total} 件</span>
          </div>

          {error ? <p className="text-danger">{error}</p> : null}

          {loading && !data ? (
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted small mb-0">まだ記録された操作はありません。</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th scope="col" style={{ whiteSpace: 'nowrap' }}>日時</th>
                    <th scope="col">操作者</th>
                    <th scope="col">操作</th>
                    <th scope="col">対象</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const view = resolveAuditAction(log.action)
                    const detail = formatDetail(log.detail)
                    return (
                      <tr key={log.id}>
                        <td className="text-muted small" style={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(log.created_at)}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-secondary" />
                            <div className="lh-sm">
                              <div className="fw-semibold small">
                                {log.actor_display_name ?? '（不明）'}
                                <span className="badge bg-light text-dark border ms-2 fw-normal">
                                  {resolveActorRoleLabel(log.actor_role)}
                                </span>
                              </div>
                              {log.actor_email ? (
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  {log.actor_email}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${view.color}`}>{view.label}</span>
                        </td>
                        <td className="small">
                          <span className="text-muted">{log.target_type}</span>
                          {detail ? <span className="ms-2">{detail}</span> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left me-1" />
                前へ
              </button>
              <span className="small text-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                次へ
                <i className="bi bi-chevron-right ms-1" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  )
}
