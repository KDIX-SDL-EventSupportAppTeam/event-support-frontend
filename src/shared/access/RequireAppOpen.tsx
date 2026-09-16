import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { fetchAppAccess } from '@/shared/api/appAccess'
import { fetchMeState } from '@/features/entry/api/meState'
import { useAuthStore } from '@/shared/auth/authStore'

type GateResult = {
  isOpen: boolean
  /** 事前アンケート回答済みか。出展者は対象外なので常に true */
  surveyAnswered: boolean
}

/**
 * アプリ本体（ログイン後の画面）向けの、アプリ公開ゲートによる全体ガード。
 *
 * 参加者ルートをまとめて配下に入れるレイアウトルートとして使う
 * （`docs/specs/app-access-gate-scope`。1画面ずつ書き足す形にしない）。
 *
 * 次のどちらかなら入口 `/e/:eventId` へ戻す。入口が現在地に応じた画面を描く。
 * - アプリが未開放（`is_open === false`）
 * - 出展者以外で、事前アンケートが未回答（初回ログイン時に必ず回答させる。
 *   `/home` などを直接開いてアンケートを飛ばせないようにする）
 *
 * 開放判定はサーバーの `is_open` だけを見る。出展者以外は入口 `EntryPage` と同じ
 * `GET /me/state` を、出展者は `GET /app-access` を叩く。どちらも server の
 * `effective.is_open` 由来なので入口と判定が食い違わない（issue #80: 往復リダイレクト）。
 * フロント側で `app_opens_at` から判定を再計算することもしない（`AGENTS.md` 原則3）。
 *
 * ここではポーリングしない。ルーティングの入口で1回だけ判定する。
 */
export function RequireAppOpen() {
  const eventId = useAuthStore((s) => s.user?.event_id)
  const role = useAuthStore((s) => s.user?.role)
  const [gate, setGate] = useState<GateResult | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setChecked(true)
      return
    }
    let active = true
    setChecked(false)
    setGate(null)
    const request: Promise<GateResult> =
      role === 'exhibitor'
        ? fetchAppAccess(eventId).then((a) => ({ isOpen: a.is_open, surveyAnswered: true }))
        : fetchMeState(eventId).then((s) => ({
            isOpen: s.app_access.is_open,
            surveyAnswered: s.survey_answered,
          }))
    request
      .then((g) => {
        if (active) setGate(g)
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
  }, [eventId, role])

  if (!checked) return null
  // 取得できなかった場合（gate が null）は締め出さない。
  // ここで undefined を踏んでアプリ全体が白画面になるのを防ぐ。
  if (eventId && gate && (!gate.isOpen || !gate.surveyAnswered)) {
    // 入口へ戻す。アンケート・開放待ちの案内は EntryPage が描く。
    // legacy の /pre-survey/:id/thanks を経由しない（あちらは旧 URL の受け皿で、
    // 掃除されるとこのゲートの退避先が静かに壊れる）。
    return <Navigate to={`/e/${eventId}`} replace />
  }
  return <Outlet />
}
