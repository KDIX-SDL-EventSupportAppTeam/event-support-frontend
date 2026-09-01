import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { fetchAppAccess, type AppAccess } from '@/shared/api/appAccess'
import { useAuthStore } from '@/shared/auth/authStore'

/**
 * アプリ本体（ログイン後の画面）向けの、アプリ公開ゲートによる全体ガード。
 *
 * 参加者ルートをまとめて配下に入れるレイアウトルートとして使う
 * （`docs/specs/app-access-gate-scope`。1画面ずつ書き足す形にしない）。
 *
 * 開放判定は `GET /events/:event_id/app-access` の `is_open`（サーバー評価値）だけを見る。
 * 入口 `EntryPage` の `useAppAccess` と **同じエンドポイント** を叩くのが要点で、
 * 別々の口（かつてはこちらだけ `GET /events/:event_id/public`）を叩いていると、
 * サーバー側の判定が一致していてもキャッシュ差・レプリカ遅延で食い違い、
 * 入口とアプリ本体の間で往復リダイレクトが起きうる（issue #80）。
 * フロント側で `app_opens_at` から判定を再計算することもしない（`AGENTS.md` 原則3）。
 *
 * ここではポーリングしない。ルーティングの入口で1回だけ判定する
 * （開いた後に閉じ直す運用は想定されていない。P-8 の手動上書きは organizer 操作なので、
 * 閉じ直しは稀な運用対応）。開放待ちの案内は入口の `WaitingStep` が描く。
 */
export function RequireAppOpen() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const [access, setAccess] = useState<AppAccess | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setChecked(true)
      return
    }
    let active = true
    setChecked(false)
    fetchAppAccess(eventId)
      .then((a) => {
        if (active) setAccess(a)
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
  // 取得できなかった場合（access が null）は締め出さない。
  // ここで undefined を踏んでアプリ全体が白画面になるのを防ぐ。
  if (eventId && access?.is_open === false) {
    // 入口へ戻す。開放待ちの案内（WaitingStep）は EntryPage が描く。
    // legacy の /pre-survey/:id/thanks を経由しない（あちらは旧 URL の受け皿で、
    // 掃除されるとこのゲートの退避先が静かに壊れる）。
    return <Navigate to={`/e/${eventId}`} replace />
  }
  return <Outlet />
}
