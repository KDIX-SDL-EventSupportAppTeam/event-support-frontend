import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmActionModal } from '@/features/entry/components/ConfirmActionModal'
import { useAuthStore } from '@/shared/auth/authStore'
import { purgeEventScopedKeys } from '@/shared/config/storageKeys'
import { clearLastEventId } from '@/shared/lib/lastEventId'

type Pending = 'logout' | null

/**
 * 入口の行き止まりから自力で出るためのボタン（issue #173）。
 * 「別のイベントに参加する」は不要になったため置かない。
 *
 * 「エラーを表示する画面に、そこから出る導線が無い」という同じ形の袋小路が複数あるため、
 * 待機画面などにこれを置く。どちらも破壊的なので 1 段の確認を挟む。
 */
export function EntryEscapeActions({ eventId }: { eventId?: string }) {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [pending, setPending] = useState<Pending>(null)

  function logoutAndRestart() {
    clearSession()
    clearLastEventId()
    if (eventId) purgeEventScopedKeys(eventId)
    setPending(null)
    // 同じ配布リンクの入口へ戻る（未認証なのでサインインから始まる）。イベントが分からなければ案内ページへ
    navigate(eventId ? `/e/${eventId}` : '/e', { replace: true })
  }

  return (
    <>
      <div className="text-center mt-4" data-testid="entry-escape-actions">
        <button
          type="button"
          className="btn btn-link btn-sm text-muted text-decoration-underline"
          onClick={() => setPending('logout')}
        >
          ログアウトして最初からやり直す
        </button>
      </div>

      {pending === 'logout' ? (
        <ConfirmActionModal
          titleId="escape-logout-title"
          title="ログアウトして最初からやり直しますか？"
          confirmLabel="ログアウトする"
          onConfirm={logoutAndRestart}
          onCancel={() => setPending(null)}
        >
          <p className="mb-0">
            この端末のログイン情報を消します。チェックイン履歴はサーバーに残っているので、もう一度ログインすれば元に戻ります。
          </p>
        </ConfirmActionModal>
      ) : null}
    </>
  )
}
