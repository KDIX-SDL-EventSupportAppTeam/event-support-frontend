import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { requestPasswordReset } from '@/features/auth/api/passwordReset'
import { resolveLoginEventId } from '@/features/auth/config/eventIds'
import { fetchPublicEvent, type PublicEvent } from '@/shared/api/publicEvent'
import { formatClientError } from '@/shared/lib/formatClientError'

/**
 * /forgot-password?event=<eventId> ── パスワード再設定の申請（issue #107）。
 *
 * - 参加者は「イベントごとの利用者」。申請には event_id が要る（AdminLoginPage と同じ `?event=`）
 * - `event` が無ければ既定イベントへ解決するが、**どのイベント宛てかを画面に出す**
 * - 送信後は登録の有無にかかわらず同じ文言。二重送信を防ぐ
 * - 公開ゲートの外側（未認証で開ける）
 */
export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const queryEventId = searchParams.get('event') ?? ''
  const eventId = queryEventId || resolveLoginEventId()
  const usingFallback = !queryEventId

  const [publicEvent, setPublicEvent] = useState<PublicEvent | null>(null)
  const [eventLookupFailed, setEventLookupFailed] = useState(false)

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let active = true
    setPublicEvent(null)
    setEventLookupFailed(false)
    fetchPublicEvent(eventId)
      .then((e) => {
        if (active) setPublicEvent(e)
      })
      .catch(() => {
        if (active) setEventLookupFailed(true)
      })
    return () => {
      active = false
    }
  }, [eventId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await requestPasswordReset(eventId, email)
      setDone(true)
    } catch (err) {
      setError(formatClientError(err, '送信に失敗しました。時間をおいて再度お試しください'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <h1 className="h4 mb-3">パスワードを忘れた場合</h1>

            <div className={`alert small mb-3 ${eventLookupFailed ? 'alert-danger' : 'alert-info'}`}>
              <i className={`bi me-1 ${eventLookupFailed ? 'bi-exclamation-triangle-fill' : 'bi-info-circle'}`} />
              {publicEvent ? (
                <>
                  イベント: <strong>{publicEvent.name}</strong> 宛てに送信します
                </>
              ) : eventLookupFailed ? (
                <>
                  <strong>このイベントが見つかりません。</strong>
                  <span className="d-block text-break">{eventId}</span>
                  <span className="d-block mt-1">配布された URL から開き直してください。</span>
                </>
              ) : (
                <>イベント: <strong className="text-break">{eventId}</strong> 宛てに送信します</>
              )}
              {usingFallback && !eventLookupFailed ? (
                <span className="d-block text-muted mt-1">
                  URL にイベントの指定がないため、アプリに設定された既定のイベントを使います。
                </span>
              ) : null}
            </div>

            {done ? (
              <>
                <div className="alert alert-success" role="status">
                  ご入力のメールアドレスが登録されている場合、パスワード再設定用のリンクを記載したメールを送信しました。
                  メールが届かない場合は迷惑メールフォルダもご確認ください。
                </div>
                <p className="mb-0 text-center">
                  <Link to={`/login`}>ログインに戻る</Link>
                </p>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="fp-email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                {error ? <p className="text-danger">{error}</p> : null}
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? '送信中…' : '再設定用のメールを送る'}
                  </button>
                </div>
                <p className="mt-3 mb-0 text-center">
                  <Link to={`/login`}>ログインに戻る</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
