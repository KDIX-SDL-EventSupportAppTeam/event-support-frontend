import { useState } from 'react'
import { clearAllAdminEventData, type EventDataClearResult } from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

type EventDataClearPanelProps = {
  eventId: string
}

export function EventDataClearPanel({ eventId }: EventDataClearPanelProps) {
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<EventDataClearResult | null>(null)

  const canSubmit = confirmText === 'DELETE_ALL_EVENT_DATA'

  async function onClearAll() {
    if (
      !window.confirm(
        'このイベントの全データ（手動テスト・サンプル含む）を削除します。運営アカウントのみ残ります。この操作は取り消せません。本当に実行しますか？',
      )
    ) {
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const result = await clearAllAdminEventData(eventId)
      setLastResult(result)
      setConfirmText('')
      setMessage(
        `全削除完了: 参加者 ${result.participants} / ブース ${result.booths} / カテゴリ ${result.categories} / チェックイン ${result.checkins}`,
      )
    } catch (e) {
      setError(formatClientError(e, 'イベントデータの全削除に失敗しました'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card border-danger border-2 shadow-sm">
      <div className="card-body">
        <h2 className="h6 fw-bold mb-2">
          <i className="bi bi-trash3 me-1 text-danger" />
          イベント全データ削除
        </h2>
        <p className="small text-muted mb-3">
          手動テストで作成したブース・参加者・チェックイン等を含む、イベント配下の<strong>すべてのデータ</strong>
          を削除します。イベント自体と運営（admin）アカウントは残ります。
        </p>
        <div className="mb-2">
          <label className="form-label small fw-semibold mb-1">
            確認のため <code>DELETE_ALL_EVENT_DATA</code> と入力
          </label>
          <input
            className="form-control form-control-sm font-monospace"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE_ALL_EVENT_DATA"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={loading || !canSubmit}
          onClick={onClearAll}
        >
          {loading ? '削除中…' : 'イベント全データを削除'}
        </button>
        {error ? <div className="alert alert-danger py-2 small mb-2 mt-2">{error}</div> : null}
        {message ? <div className="alert alert-success py-2 small mb-0 mt-2">{message}</div> : null}
        {lastResult ? (
          <pre className="small bg-light rounded p-2 mt-2 mb-0" style={{ fontSize: '0.72rem' }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
