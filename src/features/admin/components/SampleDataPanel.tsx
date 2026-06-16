import { useState } from 'react'
import {
  clearAdminSampleData,
  generateAdminSampleData,
  type SampleDataGenerateResult,
} from '@/shared/api/v1Admin'
import { formatClientError } from '@/shared/lib/formatClientError'

type SampleDataPanelProps = {
  eventId: string
}

export function SampleDataPanel({ eventId }: SampleDataPanelProps) {
  const [loading, setLoading] = useState<'generate' | 'clear' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SampleDataGenerateResult | null>(null)

  async function onGenerate(force = false) {
    if (!force && !window.confirm('[SAMPLE] テストデータを生成します。よろしいですか？')) return
    if (force && !window.confirm('既存の [SAMPLE] データを削除してから再生成します。続行しますか？')) return
    setLoading('generate')
    setError(null)
    setMessage(null)
    try {
      const result = await generateAdminSampleData(eventId, { force })
      setLastResult(result)
      setMessage(
        `生成完了: カテゴリ ${result.categories} / ブース ${result.booths} / 参加者 ${result.participants} / チェックイン ${result.checkins}`,
      )
    } catch (e) {
      setError(formatClientError(e, 'サンプルデータの生成に失敗しました'))
    } finally {
      setLoading(null)
    }
  }

  async function onClear() {
    if (
      !window.confirm(
        '[SAMPLE] プレフィックス付きデータのみ削除します。本番データ（[SAMPLE] なし）は残ります。実行しますか？',
      )
    ) {
      return
    }
    setLoading('clear')
    setError(null)
    setMessage(null)
    try {
      const result = await clearAdminSampleData(eventId)
      setLastResult(null)
      setMessage(
        `削除完了: 参加者 ${result.users} / ブース ${result.booths} / カテゴリ ${result.categories} / 設問 ${result.survey_questions}`,
      )
    } catch (e) {
      setError(formatClientError(e, 'サンプルデータの削除に失敗しました'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card border-warning border-2 shadow-sm">
      <div className="card-body">
        <h2 className="h6 fw-bold mb-2">
          <i className="bi bi-flask me-1 text-warning" />
          テスト用サンプルデータ
        </h2>
        <p className="small text-muted mb-3">
          分析画面の動作確認用データです。名称はすべて <code>[SAMPLE]</code> プレフィックス付き。
          参加者パスワードは <code>sample1234</code>（例: <code>sample-001@sample.local</code>）。
          削除は [SAMPLE] データのみ対象で、通常データには影響しません。
        </p>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <button
            type="button"
            className="btn btn-warning btn-sm"
            disabled={loading !== null}
            onClick={() => onGenerate(false)}
          >
            {loading === 'generate' ? '生成中…' : 'サンプルデータを生成'}
          </button>
          <button
            type="button"
            className="btn btn-outline-warning btn-sm"
            disabled={loading !== null}
            onClick={() => onGenerate(true)}
          >
            再生成（上書き）
          </button>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            disabled={loading !== null}
            onClick={onClear}
          >
            {loading === 'clear' ? '削除中…' : '[SAMPLE] データを削除'}
          </button>
        </div>
        {error ? <div className="alert alert-danger py-2 small mb-2">{error}</div> : null}
        {message ? <div className="alert alert-success py-2 small mb-0">{message}</div> : null}
        {lastResult ? (
          <pre className="small bg-light rounded p-2 mt-2 mb-0" style={{ fontSize: '0.72rem' }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
