import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { fetchPublicEvent, type PublicEvent } from '@/shared/api/publicEvent'
import { useAuthStore } from '@/shared/auth/authStore'

/**
 * アプリ本体（ログイン後の画面）向けの、アプリ公開ゲートによる全体ガード。
 *
 * 参加者ルートをまとめて配下に入れるレイアウトルートとして使う
 * （`docs/specs/app-access-gate-scope`。1画面ずつ書き足す形にしない）。
 *
 * 事前アンケート完了画面（`features/presurvey`）は専用の `shared/hooks/useAppAccess`
 * （30秒ポーリング）を使う（06-api.md がそちらを明示的に指定している）。
 * こちらは `GET /events/:event_id/public` が返す `app_access` ブロックを流用し、
 * ルーティングの入口で1回だけ判定する（ポーリングはしない — 開いた後に閉じ直す運用は
 * 想定されていない。P-8 の手動上書きは organizer 操作なので、閉じ直しは稀な運用対応）。
 */
export function RequireAppOpen() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setChecked(true)
      return
    }
    let active = true
    setChecked(false)
    fetchPublicEvent(eventId)
      .then((e) => {
        if (active) setEvent(e)
      })
      .catch(() => {
        /* 取得失敗時はゲート判定をスキップし、通常のアプリ動作を優先する */
      })
      .finally(() => {
        if (active) setChecked(true)
      })
    return () => {
      active = false
    }
  }, [eventId])

  if (!checked) return null
  // app_access が取れなかった場合は締め出さない（取得失敗時と同じ方針）。
  // ここで undefined を踏んでアプリ全体が白画面になるのを防ぐ。
  if (eventId && event?.app_access?.is_open === false) {
    // 入口へ戻す。開放待ちの案内（WaitingStep）は EntryPage が描く。
    // legacy の /pre-survey/:id/thanks を経由しない（あちらは旧 URL の受け皿で、
    // 掃除されるとこのゲートの退避先が静かに壊れる）。
    return <Navigate to={`/e/${eventId}`} replace />
  }
  return <Outlet />
}
