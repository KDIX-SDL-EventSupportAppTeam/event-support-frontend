import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminAuditLogs, type AdminAuditLog, type AdminAuditLogPage } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'
import {
  auditActionLabel,
  matchesCategory,
  AUDIT_CATEGORY_FILTERS,
  type AuditActionCategory,
} from '@/features/admin/lib/auditActionLabels'

const ROLE_LABELS: Record<string, string> = {
  manager: '管理者',
  admin: '管理者',
  viewer: '閲覧者',
  organizer: '主催者',
}

const LIMIT = 50

export function AuditLogPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AdminAuditLogPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<AuditActionCategory>('all')

  useEffect(() => {
    if (!eventId) return
    let active = true
    setData(null)
    setError(null)
    fetchAdminAuditLogs(eventId, { page, limit: LIMIT })
      .then((res) => {
        if (active) setData(res)
      })
      .catch((e) => {
        if (active) setError(formatClientError(e, '操作履歴の取得に失敗しました'))
      })
    return () => {
      active = false
    }
  }, [eventId, page])

  // フィルタはクライアントサイドで現在ページ内を絞る（API に filter パラメータがないため）
  const filtered = useMemo(
    () => (data?.audit_logs ?? []).filter((log) => matchesCategory(log.action, category)),
    [data, category],
  )

  const totalPages = data?.pagination.total_pages ?? 1

  return (
    <AdminShell title="操作履歴">
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="btn-group btn-group-sm mb-3" role="group" aria-label="操作種別フィルタ">
        {AUDIT_CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`btn ${category === f.key ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategory(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!data && !error ? <p className="text-muted">読み込み中…</p> : null}

      {data && data.audit_logs.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-clock-history fs-1 d-block mb-2" />
            操作履歴はまだありません
          </div>
        </div>
      ) : null}

      {data && data.audit_logs.length > 0 ? (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="small text-muted">
                    <th>日時</th>
                    <th>操作者</th>
                    <th>操作</th>
                    <th>対象</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <AuditRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted small mt-2">この種別の操作はこのページにありません。</p>
          ) : null}

          <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <i className="bi bi-chevron-left" /> 前へ
            </button>
            <span className="small text-muted">
              {page} / {totalPages} ページ
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              次へ <i className="bi bi-chevron-right" />
            </button>
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}

function AuditRow({ log }: { log: AdminAuditLog }) {
  const actor = log.actor_display_name || log.actor_id.slice(0, 8)
  const roleLabel = ROLE_LABELS[log.actor_role] ?? log.actor_role
  return (
    <tr>
      <td className="text-muted small">{new Date(log.created_at).toLocaleString('ja-JP')}</td>
      <td>
        {actor}
        <span className="badge bg-light text-dark ms-2">{roleLabel}</span>
      </td>
      <td>{auditActionLabel(log.action)}</td>
      <td className="small text-muted">{summarizeTarget(log)}</td>
    </tr>
  )
}

/** target_type + detail から対象の要約（ブース名 / email 等）を作る。 */
function summarizeTarget(log: AdminAuditLog): string {
  const d = log.detail
  if (d && typeof d === 'object') {
    const obj = d as Record<string, unknown>
    const candidate = obj.name ?? obj.email ?? obj.question_text ?? obj.title
    if (typeof candidate === 'string') return `${log.target_type}: ${candidate}`
  }
  return log.target_type
}
