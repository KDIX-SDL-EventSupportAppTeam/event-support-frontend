import { useEffect, useState } from 'react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { parseExhibitorBulk, type ParsedBulkRow } from '@/features/admin/lib/parseExhibitorBulk'
import { bulkRegisterExhibitors, type ExhibitorBulkResult } from '@/shared/api/v1Admin'
import { fetchV1Booths, type V1BoothListItem } from '@/shared/api/v1Participant'
import { isManagerUser, useAuthStore } from '@/shared/auth/authStore'
import { formatClientError } from '@/shared/lib/formatClientError'

type Phase = 'input' | 'preview' | 'done'

export function ExhibitorBulkRegisterPage() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const isManager = isManagerUser(useAuthStore((s) => s.user))

  const [phase, setPhase] = useState<Phase>('input')
  const [text, setText] = useState('')
  const [booths, setBooths] = useState<V1BoothListItem[]>([])
  const [boothsError, setBoothsError] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedBulkRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<ExhibitorBulkResult | null>(null)

  useEffect(() => {
    if (!eventId) return
    fetchV1Booths(eventId)
      .then(setBooths)
      .catch((e) => setBoothsError(formatClientError(e, 'ブース一覧の取得に失敗しました')))
  }, [eventId])

  if (!isManager) {
    return (
      <AdminShell title="出展者一括登録">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          運営管理者権限が必要です
        </div>
      </AdminShell>
    )
  }

  function onPreview() {
    setRows(parseExhibitorBulk(text, booths))
    setSubmitError(null)
    setPhase('preview')
  }

  async function onSubmit() {
    if (!eventId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await bulkRegisterExhibitors(
        eventId,
        rows.map((r) => ({ email: r.email, password: r.password, booth_id: r.boothId! })),
      )
      setResult(res)
      setPhase('done')
    } catch (e) {
      setSubmitError(formatClientError(e, '一括登録に失敗しました'))
    } finally {
      setSubmitting(false)
    }
  }

  function onReset() {
    setText('')
    setRows([])
    setResult(null)
    setSubmitError(null)
    setPhase('input')
  }

  const errorCount = rows.filter((r) => r.errors.length > 0).length
  const canSubmit = rows.length > 0 && errorCount === 0 && !submitting

  return (
    <AdminShell title="出展者一括登録">
      {phase === 'input' ? (
        <>
          <p className="text-muted small">
            1行 = 1アカウント。「メールアドレス[タブまたはカンマ]パスワード[タブまたはカンマ]ブース名」の形式で貼り付けてください（スプレッドシートの行コピーがそのまま貼れます）
          </p>
          {boothsError ? (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              {boothsError}
            </div>
          ) : null}
          <textarea
            className="form-control mb-3"
            rows={12}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={text.trim() === '' || !!boothsError}
            onClick={onPreview}
          >
            プレビュー
          </button>
        </>
      ) : null}

      {phase === 'preview' ? (
        <>
          <div className="mb-3">
            全 <strong>{rows.length}</strong> 行 / エラー <strong>{errorCount}</strong> 行
          </div>
          <div className="table-responsive mb-3">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>行</th>
                  <th>メールアドレス</th>
                  <th>パスワード</th>
                  <th>担当ブース</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className={r.errors.length > 0 ? 'table-danger' : undefined}>
                    <td>{r.line}</td>
                    <td>{r.email}</td>
                    <td>{r.password}</td>
                    <td>{r.boothName}</td>
                    <td>
                      {r.errors.length > 0 ? (
                        <span className="text-danger">{r.errors.join('、')}</span>
                      ) : (
                        `OK（→ ${r.boothName}）`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {submitError ? (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              {submitError}
            </div>
          ) : null}
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setPhase('input')}>
              入力に戻る
            </button>
            <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={onSubmit}>
              {submitting ? '登録中…' : 'この内容で登録する'}
            </button>
          </div>
        </>
      ) : null}

      {phase === 'done' && result ? (
        <>
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-4">{result.summary.created}</div>
                  <div className="text-muted small">新規作成</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-4">{result.summary.updated}</div>
                  <div className="text-muted small">既存に付与</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-4">{result.summary.skipped}</div>
                  <div className="text-muted small">登録済みスキップ</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="fw-bold fs-4">{result.summary.failed}</div>
                  <div className="text-muted small">失敗</div>
                </div>
              </div>
            </div>
          </div>

          {result.results.some((r) => r.status === 'error') ? (
            <div className="table-responsive mb-3">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>メール</th>
                    <th>ブース</th>
                    <th>失敗理由</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results
                    .filter((r) => r.status === 'error')
                    .map((r) => (
                      <tr key={r.index} className="table-danger">
                        <td>{r.email}</td>
                        <td>{rows[r.index]?.boothName ?? r.booth_id}</td>
                        <td className="text-danger">{r.error?.message}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <button type="button" className="btn btn-primary" onClick={onReset}>
            続けて登録する
          </button>
        </>
      ) : null}
    </AdminShell>
  )
}
