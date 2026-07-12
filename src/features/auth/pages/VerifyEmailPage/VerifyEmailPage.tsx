import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as authApi from '@/features/auth/api/auth'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { ApiError } from '@/shared/api/unwrap'
import { formatClientError } from '@/shared/lib/formatClientError'
import { useAuthStore } from '@/shared/auth/authStore'

type VerifyStatus =
  | { kind: 'verifying' }
  | { kind: 'success' }
  | { kind: 'error'; code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'OTHER'; message: string }

/**
 * /verify-email?token=xxx
 * メール内リンクの遷移先。確認完了（画面②）と期限切れ・無効エラー＋再送（画面③）を
 * 状態機械として1コンポーネントで扱う（issue #47 §5-3）。
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const authToken = useAuthStore((s) => s.token)
  const [status, setStatus] = useState<VerifyStatus>({ kind: 'verifying' })
  const started = useRef(false)
  const { canResend, state: resendState, message: resendMessage, resend } = useResendVerification()

  useEffect(() => {
    if (started.current) return // StrictMode の2回目 effect を捨てる（成功でトークンが消え2回目が404になるため）
    started.current = true

    if (!token) {
      setStatus({ kind: 'error', code: 'TOKEN_INVALID', message: 'URL が正しくありません' })
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus({ kind: 'success' })
      })
      .catch((e) => {
        if (e instanceof ApiError && (e.code === 'TOKEN_EXPIRED' || e.code === 'TOKEN_INVALID')) {
          setStatus({ kind: 'error', code: e.code, message: e.message })
        } else {
          setStatus({ kind: 'error', code: 'OTHER', message: formatClientError(e, '確認に失敗しました') })
        }
      })
    // 確認成功してもローカルの AuthUser.email_verified は古いまま残り得るが、
    // サーバ側ガードは毎リクエスト DB を参照するため実害はない。次回ログインで同期される。
  }, [token])

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <div className="card-body text-center">
              {status.kind === 'verifying' ? (
                <>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 mb-0">確認しています…</p>
                </>
              ) : null}

              {status.kind === 'success' ? (
                <>
                  <div className="alert alert-success mb-4">メールアドレスの確認が完了しました</div>
                  {authToken ? (
                    <Link to="/home" className="btn btn-primary">
                      ホームへ
                    </Link>
                  ) : (
                    <Link to="/login" className="btn btn-primary">
                      ログインへ
                    </Link>
                  )}
                </>
              ) : null}

              {status.kind === 'error' && status.code === 'TOKEN_EXPIRED' ? (
                <>
                  <div className="alert alert-warning mb-4">確認リンクの有効期限が切れています</div>
                  {canResend ? (
                    <div className="mb-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={resend}
                        disabled={resendState === 'sending'}
                      >
                        {resendState === 'sending' ? '再送中…' : '確認メールを再送する'}
                      </button>
                      {resendState === 'sent' ? (
                        <p className="text-success small mt-2 mb-0">再送しました</p>
                      ) : null}
                      {resendState === 'already_verified' ? (
                        <p className="text-success small mt-2 mb-0">すでに確認済みです</p>
                      ) : null}
                      {resendState === 'error' ? (
                        <p className="text-danger small mt-2 mb-0">{resendMessage}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mb-0">
                      <Link to="/login">ログインして再送</Link>
                    </p>
                  )}
                </>
              ) : null}

              {status.kind === 'error' && status.code === 'TOKEN_INVALID' ? (
                <>
                  <div className="alert alert-danger mb-4">
                    この確認リンクは無効です。すでに確認済みの場合は、そのままログインしてご利用いただけます
                  </div>
                  {canResend ? (
                    <div className="mb-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={resend}
                        disabled={resendState === 'sending'}
                      >
                        {resendState === 'sending' ? '再送中…' : '確認メールを再送する'}
                      </button>
                      {resendState === 'sent' ? (
                        <p className="text-success small mt-2 mb-0">再送しました</p>
                      ) : null}
                      {resendState === 'already_verified' ? (
                        <p className="text-success small mt-2 mb-0">すでに確認済みです</p>
                      ) : null}
                      {resendState === 'error' ? (
                        <p className="text-danger small mt-2 mb-0">{resendMessage}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mb-0">
                      <Link to="/login">ログインして再送</Link>
                    </p>
                  )}
                </>
              ) : null}

              {status.kind === 'error' && status.code === 'OTHER' ? (
                <>
                  <div className="alert alert-danger mb-4">{status.message}</div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.reload()}
                  >
                    再読み込み
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
