import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/features/auth/api/passwordReset'
import { ApiError } from '@/shared/api/unwrap'
import { formatClientError } from '@/shared/lib/formatClientError'

const MIN_LENGTH = 8

/**
 * /reset-password/:token ── 新しいパスワードの設定（issue #107）。
 *
 * - 確認用入力あり（打ち間違いに気づけるように）
 * - 8文字以上（server の z.string().min(8).max(200) に合わせる）
 * - 成功したらログイン画面へ送り、その旨を出す
 * - 無効・期限切れトークン（410）は真っ白にせず、再申請の導線を出す
 * - 公開ゲートの外側（未認証で開ける）
 *
 * 戻り先: `?event=<eventId>` があれば入口（/e/:eventId）へ直接送る。
 * 無ければ従来どおり `/login`（= lastEventId を控えていれば入口へ、無ければ /e）。
 * server のリセットリンク（`buildResetPasswordUrl` = `/reset-password/:token`）には
 * 現状 `?event=` が含まれない（event-support-server docs/specs/password-reset）。
 * 別端末でリンクを開くと `/login` フォールバックになるため、リンク本文には
 * 「同じ端末で開いてください」の注意を server 側で添える前提。将来 server が
 * `?event=` を付けたときにこの画面がそのまま拾えるよう受け口だけ用意しておく。
 */
export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event')?.trim() ?? ''
  const backToLoginPath = eventId ? `/e/${encodeURIComponent(eventId)}` : '/login'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [expired, setExpired] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!token) return <Navigate to="/forgot-password" replace />

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = password.length >= MIN_LENGTH && password === confirm && !submitting

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || !token) return
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TOKEN_EXPIRED') {
        setExpired(err.message || 'この再設定リンクは無効です。もう一度お手続きください。')
      } else {
        setError(formatClientError(err, 'パスワードの変更に失敗しました'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <h1 className="h4 mb-3">パスワード再設定</h1>

            {done ? (
              <>
                <div className="alert alert-success" role="status">
                  パスワードを変更しました。新しいパスワードでログインしてください。
                </div>
                <div className="d-grid">
                  <Link to={backToLoginPath} className="btn btn-primary">
                    ログインする
                  </Link>
                </div>
              </>
            ) : expired ? (
              <>
                <div className="alert alert-warning" role="status">
                  {expired}
                </div>
                <p className="mb-0 text-center">
                  <Link to={eventId ? `/forgot-password?event=${encodeURIComponent(eventId)}` : "/forgot-password"}>もう一度申請する</Link>
                </p>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="rp-password" className="form-label">
                    新しいパスワード（{MIN_LENGTH} 文字以上）
                  </label>
                  <input
                    id="rp-password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    minLength={MIN_LENGTH}
                    autoComplete="new-password"
                  />
                  {tooShort ? (
                    <div className="form-text text-danger">{MIN_LENGTH} 文字以上で入力してください</div>
                  ) : null}
                </div>
                <div className="mb-3">
                  <label htmlFor="rp-confirm" className="form-label">
                    新しいパスワード（確認）
                  </label>
                  <input
                    id="rp-confirm"
                    type="password"
                    className="form-control"
                    value={confirm}
                    onChange={(ev) => setConfirm(ev.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {mismatch ? (
                    <div className="form-text text-danger">確認用のパスワードが一致しません</div>
                  ) : null}
                </div>
                {error ? <p className="text-danger">{error}</p> : null}
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                    {submitting ? '変更中…' : 'パスワードを変更する'}
                  </button>
                </div>
                <p className="mt-3 mb-0 text-center">
                  <Link to={backToLoginPath}>ログインに戻る</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
