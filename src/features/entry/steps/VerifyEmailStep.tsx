import { useEffect } from 'react'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { attachRecheckListeners } from '@/features/entry/lib/verifyRecheckListener'

/**
 * S2 ── メール確認待ち。
 *
 * 確認リンクは別タブで開かれることが多い。タブが表示状態に戻った・ウィンドウに
 * フォーカスが戻ったタイミングで自動的に状態を取り直す（D3）。定期ポーリングはしない。
 * 「確認しました」ボタンは、自動で進まない端末向けの保険として残す。
 */
export function VerifyEmailStep({ onRecheck }: { onRecheck: () => void }) {
  const { canResend, state, message, resend } = useResendVerification()

  useEffect(() => attachRecheckListeners(document, window, onRecheck), [onRecheck])

  return (
    <EntryLayout title="メールを確認してください" subtitle="ご登録のアドレスに確認メールを送りました">
      <p className="text-center mb-4">
        メール内のリンクを開くと確認が完了します。確認後にこの画面へ戻ると自動で先に進みます。進まない場合は下のボタンを押してください。
      </p>
      <div className="d-grid gap-2">
        <button type="button" className="btn btn-primary btn-lg" onClick={onRecheck}>
          確認しました
        </button>
        {canResend ? (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => void resend()}
            disabled={state === 'sending'}
          >
            {state === 'sending' ? '再送中…' : '確認メールを再送する'}
          </button>
        ) : null}
      </div>
      {state === 'sent' ? (
        <p className="text-success text-center small mt-3 mb-0">確認メールを再送しました。</p>
      ) : null}
      {state === 'already_verified' ? (
        <p className="text-success text-center small mt-3 mb-0">
          すでに確認済みです。「確認しました」を押してください。
        </p>
      ) : null}
      {state === 'error' ? (
        <p className="text-danger text-center small mt-3 mb-0">{message}</p>
      ) : null}
      <p className="text-muted text-center small mt-4 mb-0">
        メールが届かない場合は、迷惑メールフォルダをご確認ください。
      </p>
    </EntryLayout>
  )
}
