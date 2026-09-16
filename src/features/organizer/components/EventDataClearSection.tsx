import { useState } from 'react'
import type { EventDataClearResult } from '@/features/organizer/api/organizerApi'
import { formatClientError } from '@/shared/lib/formatClientError'

const CONFIRM_TOKEN = 'DELETE_ALL_EVENT_DATA'

const RESULT_LABELS: [keyof EventDataClearResult, string][] = [
  ['participants', '参加者'],
  ['booths', 'ブース'],
  ['checkins', 'チェックイン'],
  ['ratings', '評価'],
  ['recommendations', 'おすすめ履歴'],
  ['survey_answers', 'アンケート回答'],
  ['survey_questions', 'アンケート設問'],
  ['categories', 'カテゴリ'],
  ['booth_tags', 'ブースタグ'],
  ['booth_categories', 'ブースカテゴリ紐付け'],
]

type Props = {
  onClear: () => Promise<EventDataClearResult>
  onCleared?: (result: EventDataClearResult) => void
}

export function EventDataClearSection({ onClear, onCleared }: Props) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EventDataClearResult | null>(null)

  const canSubmit = confirmText === CONFIRM_TOKEN && !loading

  async function handleClear() {
    if (!window.confirm('このイベントの全データを削除します。この操作は取り消せません。本当に実行しますか？')) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await onClear()
      setResult(r)
      setConfirmText('')
      onCleared?.(r)
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
          イベントデータの全削除（危険な操作）
        </h2>
        <p className="small text-muted mb-3">
          参加者・ブース・チェックイン・評価・アンケートなど、イベント配下の<strong>すべてのデータ</strong>を削除します。
          イベント自体・運営スタッフのアカウント・操作履歴（監査ログ）は残ります。
        </p>
        <div className="mb-2">
          <label className="form-label small fw-semibold mb-1">
            確認のため <code>{CONFIRM_TOKEN}</code> と入力
          </label>
          <input
            className="form-control form-control-sm font-monospace"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TOKEN}
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn btn-danger btn-sm" disabled={!canSubmit} onClick={handleClear}>
          {loading ? '削除中…' : 'イベント全データを削除'}
        </button>
        {error ? <div className="alert alert-danger py-2 small mt-2 mb-0">{error}</div> : null}
        {result ? (
          <div className="mt-2">
            <div className="alert alert-success py-2 small mb-2">全削除が完了しました。削除件数は以下のとおりです。</div>
            <table className="table table-sm small mb-0">
              <tbody>
                {RESULT_LABELS.map(([key, label]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td className="text-end">{result[key]} 件</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
