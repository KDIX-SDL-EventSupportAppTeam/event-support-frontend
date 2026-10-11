import { useEffect, useState } from 'react'
import { fetchAdminBoothSummaries, type AdminBoothSummary } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

/**
 * 参加者を出展者にするときの確認ダイアログ。出展者は担当ブースが必須なので、ここで選ばせる。
 */
export function PromoteToExhibitorDialog({
  eventId,
  userLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  eventId: string
  userLabel: string
  busy: boolean
  onCancel: () => void
  onConfirm: (boothIds: string[]) => void
}) {
  const [booths, setBooths] = useState<AdminBoothSummary[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminBoothSummaries(eventId, { sort: 'name', order: 'asc' })
      .then(setBooths)
      .catch((e) => setError(formatClientError(e, 'ブース一覧の取得に失敗しました')))
  }, [eventId])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h6">出展者に変更</h2>
            <button type="button" className="btn-close" aria-label="閉じる" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <p className="small">
              <strong>{userLabel}</strong> を出展者に変更します。担当するブースを選んでください。
            </p>
            {error ? <div className="alert alert-danger small">{error}</div> : null}
            <div className="list-group">
              {booths.map((b) => (
                <label key={b.id} className="list-group-item d-flex gap-2 align-items-center">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={selected.includes(b.id)}
                    onChange={() => toggle(b.id)}
                  />
                  <span className="text-muted small" style={{ minWidth: 32 }}>
                    {b.display_code ?? '—'}
                  </span>
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-warning"
              disabled={busy || selected.length === 0}
              onClick={() => onConfirm(selected)}
            >
              {busy ? '変更中…' : `出展者にする（${selected.length} ブース）`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
