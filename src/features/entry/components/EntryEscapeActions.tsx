import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmActionModal } from '@/features/entry/components/ConfirmActionModal'
import { useAuthStore } from '@/shared/auth/authStore'
import { purgeEventScopedKeys } from '@/shared/config/storageKeys'
import { clearLastEventId } from '@/shared/lib/lastEventId'

type Pending = 'other-event' | 'logout' | null

/**
 * 入口の行き止まりから自力で出るための 2 ボタン（issue #173）。
 *
 * 「エラーを表示する画面に、そこから出る導線が無い」という同じ形の袋小路が複数あるため、
 * 待機画面などにこれを置く。どちらも破壊的なので 1 段の確認を挟む。
 */
export function EntryEscapeActions({ eventId }: { eventId?: string }) {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [pending, setPending] = useState<Pending>(null)

  function goOtherEvent() {
    clearLastEventId()
    setPending(null)
    navigate('/e', { replace: true })
  }

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
      <div className="d-grid gap-2 mt-4" data-testid="entry-escape-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={() => setPending('other-event')}>
          別のイベントに参加する
        </button>
        <button type="button" className="btn btn-outline-danger" onClick={() => setPending('logout')}>
          ログアウトして最初からやり直す
        </button>
      </div>

      {pending === 'other-event' ? (
        <ConfirmActionModal
          titleId="escape-other-event-title"
          title="別のイベントに参加しますか？"
          confirmLabel="別のイベントへ"
          onConfirm={goOtherEvent}
          onCancel={() => setPending(null)}
        >
          <p className="mb-0">
            このイベントの控えを消して、案内ページへ移ります。参加するイベントの QR コードまたは配布リンクから開き直してください。
          </p>
        </ConfirmActionModal>
      ) : null}

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
