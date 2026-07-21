import { Link } from 'react-router-dom'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'

/**
 * /verify-email/sent
 * 登録直後（RegisterPage / JoinPage）に遷移してくる「確認メールを送信しました」画面。
 * ログイン必須にはしない（直リンクで開かれても表示だけは成立する。issue #47 §5-2）。
 */
export function VerifyEmailSentPage() {
  const { canResend, state, message, resend } = useResendVerification()

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card p-4">
            <div className="card-body text-center">
              <i className="bi bi-envelope-check display-4 text-primary" />
              <h1 className="card-title mt-3 mb-4">確認メールを送信しました</h1>
              <p className="mb-3">
                登録したメールアドレスに確認用の URL を送りました。メール内のリンクを開いて本人確認を完了してください（有効期限
                24 時間）。
              </p>
              <p className="text-muted small mb-4">迷惑メールフォルダもご確認ください。</p>

              {canResend ? (
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={resend}
                    disabled={state === 'sending'}
                  >
                    {state === 'sending' ? '再送中…' : '確認メールを再送する'}
                  </button>
                  {state === 'sent' ? (
                    <p className="text-success small mt-2 mb-0">再送しました</p>
                  ) : null}
                  {state === 'already_verified' ? (
                    <p className="text-success small mt-2 mb-0">すでに確認済みです</p>
                  ) : null}
                  {state === 'error' ? (
                    <p className="text-danger small mt-2 mb-0">{message}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mb-4">
                  <Link to="/login">ログインして再送</Link>
                </p>
              )}

              <p className="mb-0">
                <Link to="/home">あとで確認する（ホームへ）</Link>
              </p>
              <p className="text-muted small mt-2 mb-0">
                ※確認が完了するまでチェックインはご利用いただけません
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
