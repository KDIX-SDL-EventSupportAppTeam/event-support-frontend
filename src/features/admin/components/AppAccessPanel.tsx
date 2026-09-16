import { useEffect, useState } from 'react'
import { fetchAdminAppAccess, putAdminAppAccess, type AdminAppAccess } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'

/**
 * アプリの開放スイッチ。
 *
 * 配布 URL を踏んだ参加者は事前アンケートに答えたあと「開放待ち」で止まり、
 * ここで開放すると同じ URL からホームへ進めるようになる（開放待ち画面は30秒ごとに再確認）。
 * 開放判定はサーバーの `is_open` のみ。`scheduled`（時刻指定）はこの画面では扱わない。
 */
export function AppAccessPanel({ eventId }: { eventId: string }) {
  const canEdit = isManagerUser(useAuthStore((s) => s.user))
  const [access, setAccess] = useState<AdminAppAccess | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAdminAppAccess(eventId)
      .then(setAccess)
      .catch((e) => setError(formatClientError(e, 'アプリ公開状態の取得に失敗しました')))
  }, [eventId])

  async function switchMode(mode: 'open' | 'closed') {
    const message =
      mode === 'open'
        ? 'アプリを開放します。アンケート回答済みの参加者がホーム画面に入れるようになります。よろしいですか？'
        : 'アプリを閉じます。参加者はホーム画面に入れなくなり、開放待ち画面に戻ります。よろしいですか？'
    if (!window.confirm(message)) return
    await save({ mode })
  }

  async function save(body: Parameters<typeof putAdminAppAccess>[1]) {
    setSaving(true)
    setError(null)
    try {
      setAccess(await putAdminAppAccess(eventId, body))
    } catch (e) {
      setError(formatClientError(e, 'アプリ公開状態の更新に失敗しました'))
    } finally {
      setSaving(false)
    }
  }

  const isOpen = access?.mode === 'open'

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h3 className="h6 fw-bold mb-1">
              <i className="bi bi-door-open me-1" />
              アプリの公開
            </h3>
            {access ? (
              <span className={`badge ${isOpen ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {isOpen ? '開放中' : access.mode === 'scheduled' ? '時刻指定' : '開放前（アンケートのみ）'}
              </span>
            ) : error ? null : (
              <span className="text-muted small">読み込み中…</span>
            )}
          </div>
          {canEdit && access ? (
            isOpen ? (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => void switchMode('closed')}
                disabled={saving}
              >
                アプリを閉じる
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => void switchMode('open')}
                disabled={saving}
              >
                アプリを開放する
              </button>
            )
          ) : null}
        </div>
        <p className="text-muted small mt-2 mb-0">
          開放前は、配布URLから入った参加者は事前アンケートの回答までで止まります。開放すると同じURLからホーム画面へ進めます。
        </p>
        {error ? <div className="alert alert-danger py-2 small mt-2 mb-0">{error}</div> : null}
      </div>
    </div>
  )
}
