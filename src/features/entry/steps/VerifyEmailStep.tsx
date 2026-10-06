import { useEffect, useState } from 'react'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { ConfirmActionModal } from '@/features/entry/components/ConfirmActionModal'
import { EntryLayout } from '@/features/entry/components/EntryLayout'
import { attachRecheckListeners } from '@/features/entry/lib/verifyRecheckListener'
import { useAuthStore } from '@/shared/auth/authStore'

/**
 * S2 ── メール確認待ち。
 *
 * 確認リンクは別タブで開かれることが多い。タブが表示状態に戻った・ウィンドウに
 * フォーカスが戻ったタイミングで自動的に状態を取り直す（D3）。定期ポーリングはしない。
 * 「確認しました」ボタンは、自動で進まない端末向けの保険として残す。
 *
 * アドレスを打ち間違えた参加者が詰まないよう、サインイン／サインアップへ戻る導線を置く（issue #174）。
 * 戻るにはローカルのセッションを捨てる（段階は `GET /me/state` が決めるため、フロントだけで
 * `auth` に戻す手段はそれしかない）。誤タップを避けるため確認を 1 段挟む。
 *
 * 登録したアドレスの表示は見送っている。`MeState` に email が無く、`auth_user` へ増やす判断は
 * この導線とは別の話になるため（server 側で `MeState` に email を足してから対応する）。
 */
export function VerifyEmailStep({ onRecheck }: { onRecheck: () => void }) {
  const { canResend, state, message, resend } = useResendVerification()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [confirmingBack, setConfirmingBack] = useState(false)

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
      <p className="text-muted text-center small mt-4 mb-2">
        メールが届かない場合は、迷惑メールフォルダをご確認ください。
      </p>
      <p className="text-center mb-0">
        <button type="button" className="btn btn-link btn-sm" onClick={() => setConfirmingBack(true)}>
          ログイン画面に戻る
        </button>
        <span className="d-block text-muted small">アドレスを打ち間違えた場合も、こちらから登録し直せます。</span>
      </p>
      {confirmingBack ? (
        <ConfirmActionModal
          titleId="verify-back-title"
          title="ログイン画面に戻りますか？"
          confirmLabel="戻る"
          onConfirm={() => {
            setConfirmingBack(false)
            // セッションを捨てると EntryPage が auth の段階を描く
            clearSession()
          }}
          onCancel={() => setConfirmingBack(false)}
        >
          <p className="mb-0">
            いま登録したアドレスには確認メールが届きません。正しいアドレスでもう一度登録してください。すでにアカウントをお持ちの方は、ログイン画面からサインインできます。
          </p>
        </ConfirmActionModal>
      ) : null}
    </EntryLayout>
  )
}
