import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { EntryLayout } from '@/features/entry/components/EntryLayout'

/**
 * S2 ── メール確認待ち。
 *
 * 確認リンクは別タブで開かれることが多く、そちらで確認が終わってもこの画面は自動では変わらない。
 * 戻ってきた利用者が進めるよう「確認しました」で状態を取り直す導線を必ず置く。
 */
export function VerifyEmailStep({ onRecheck }: { onRecheck: () => void }) {
  const { canResend, state, message, resend } = useResendVerification()

  return (
    <EntryLayout title="メールを確認してください" subtitle="ご登録のアドレスに確認メールを送りました">
      <p className="text-center mb-4">
        メール内のリンクを開くと確認が完了します。開いたあとにこの画面へ戻り、下のボタンを押してください。
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
