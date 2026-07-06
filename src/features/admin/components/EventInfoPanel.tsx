import { useEffect, useState } from 'react'
import { updateAdminEvent, type AdminEvent } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'
import { eventStatus, formatRemaining } from '@/shared/lib/eventStatus'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import { fetchAdminEventCached, useAdminMenuStore } from '@/features/admin/store/adminMenuStore'

type EventInfoPanelProps = {
  eventId: string
}

type EditField = 'name' | 'venue'

export function EventInfoPanel({ eventId }: EventInfoPanelProps) {
  const canEdit = isManagerUser(useAuthStore((s) => s.user))
  const setCachedEvent = useAdminMenuStore((s) => s.setCachedEvent)

  const [event, setEvent] = useState<AdminEvent | null>(null)
  // 初回読み込みの失敗のみパネル全体をエラー表示にする。保存エラーはインライン表示にする（02-D-1）
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 明示的な編集モード（鉛筆 → 入力 → 保存/キャンセル）。blur 即保存はやめる（02-D-2）
  const [editing, setEditing] = useState<EditField | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    // AdminShell（サイドバー）と同じキャッシュを共有し、GET を 1 回に抑える（FE-R2）
    fetchAdminEventCached(eventId)
      .then((e) => setEvent(e))
      .catch((e) => setLoadError(formatClientError(e, 'イベント情報の取得に失敗しました')))
  }, [eventId])

  function startEdit(field: EditField) {
    if (!event) return
    setSaveError(null)
    setEditing(field)
    setDraft(field === 'name' ? event.name : (event.venue ?? ''))
  }

  function cancelEdit() {
    setEditing(null)
    setSaveError(null)
  }

  async function saveField(field: EditField) {
    if (!event) return
    const value = draft.trim()
    // イベント名は必須。null を送るとサーバーの zod で 422 の汎用エラーになるため
    // 送信前に弾く（FE-R1）。venue は空 → null で「会場未設定」に戻すのが正しい挙動
    if (field === 'name' && !value) {
      setSaveError('イベント名は必須です')
      return
    }
    setSaving(true)
    try {
      const updated = await updateAdminEvent(eventId, { [field]: value || null })
      setEvent(updated)
      // サイドバーの表示名が古いままにならないようキャッシュも更新する（FE-R2）
      setCachedEvent(updated)
      setSaveError(null)
      setEditing(null)
    } catch (e) {
      setSaveError(formatClientError(e, '更新に失敗しました'))
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return <div className="alert alert-danger mb-0">{loadError}</div>
  }

  if (!event) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body py-4 text-center text-muted">読み込み中…</div>
      </div>
    )
  }

  const status = eventStatus(event.date_start, event.date_end)
  const remaining = formatRemaining(event.date_start, event.date_end)

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className={`badge ${status.className}`}>{status.label}</span>
          {remaining ? <span className="text-muted small">{remaining}</span> : null}
          {saving ? <span className="text-muted small">保存中…</span> : null}
        </div>

        {saveError ? (
          <div className="alert alert-danger alert-dismissible py-2 small" role="alert">
            {saveError}
            <button
              type="button"
              className="btn-close"
              aria-label="閉じる"
              onClick={() => setSaveError(null)}
            />
          </div>
        ) : null}

        {/* イベント名 */}
        {editing === 'name' ? (
          <div className="input-group mb-2">
            <input
              className="form-control form-control-lg fw-bold"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" onClick={() => void saveField('name')} disabled={saving}>
              保存
            </button>
            <button className="btn btn-outline-secondary" onClick={cancelEdit} disabled={saving}>
              キャンセル
            </button>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2 mb-2">
            <h2 className="h4 fw-bold mb-0">{event.name}</h2>
            {canEdit ? (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-0"
                onClick={() => startEdit('name')}
                aria-label="イベント名を編集"
              >
                <i className="bi bi-pencil" />
              </button>
            ) : null}
          </div>
        )}

        <div className="text-muted small mb-1">
          <i className="bi bi-calendar-event me-1" />
          {new Date(event.date_start).toLocaleString('ja-JP')} 〜{' '}
          {new Date(event.date_end).toLocaleString('ja-JP')}
        </div>

        {/* 会場 */}
        {editing === 'venue' ? (
          <div className="input-group input-group-sm">
            <span className="input-group-text">
              <i className="bi bi-geo-alt" />
            </span>
            <input
              className="form-control"
              placeholder="会場を入力"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" onClick={() => void saveField('venue')} disabled={saving}>
              保存
            </button>
            <button className="btn btn-outline-secondary" onClick={cancelEdit} disabled={saving}>
              キャンセル
            </button>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-geo-alt text-muted" />
            <span className={event.venue ? '' : 'text-muted'}>{event.venue || '会場未設定'}</span>
            {canEdit ? (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-0"
                onClick={() => startEdit('venue')}
                aria-label="会場を編集"
              >
                <i className="bi bi-pencil" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
