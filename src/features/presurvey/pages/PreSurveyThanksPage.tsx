import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/shared/auth/authStore'
import { useAppAccess } from '@/shared/hooks/useAppAccess'
import type { AppAccess } from '@/shared/api/appAccess'
import { PreSurveyLayout } from '@/features/presurvey/components/PreSurveyLayout'

/**
 * /pre-survey/:eventId/thanks
 * 回答完了画面。アプリ本体への遷移ボタンは、アプリ公開ゲートの実効開放状態
 * （`is_open`）に従って有効・無効を切り替える（06-api.md）。
 *
 * WebSocket は使わず 30 秒ポーリング + サーバー時刻補正のローカルカウントダウンで、
 * 再読み込みなしに開放状態へ追随する（`useAppAccess`。P-4 / P-9）。
 */
export function PreSurveyThanksPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const { access, isOpen, remainingMs } = useAppAccess(eventId)

  // アプリ本体にログイン済みならホーム、未ログインならイベント参加登録へ
  const appPath = token ? '/home' : `/join/${eventId}`

  return (
    <PreSurveyLayout title="ご回答ありがとうございました">
      <p className="text-center mb-4">
        当日はいただいた内容を参考に、より楽しんでいただけるよう準備いたします。
      </p>
      <div className="d-grid">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!isOpen}
          onClick={() => navigate(appPath)}
        >
          アプリに移動する
        </button>
        {!isOpen && access ? (
          <p className="text-muted text-center small mt-2 mb-0">
            {formatOpenSchedule(access, remainingMs)}
          </p>
        ) : null}
      </div>
    </PreSurveyLayout>
  )
}

/** 開放予定時刻・残り時間の表示文字列を組み立てる（表示専用の整形。開放判定そのものは行わない） */
function formatOpenSchedule(access: AppAccess, remainingMs: number | null): string {
  if (access.mode !== 'scheduled' || !access.app_opens_at) {
    return 'アプリは現在ご利用いただけません。'
  }
  const opensAt = new Date(access.app_opens_at)
  const dateLabel = `${opensAt.getMonth() + 1}/${opensAt.getDate()} ${String(opensAt.getHours()).padStart(2, '0')}:${String(
    opensAt.getMinutes(),
  ).padStart(2, '0')}`

  if (remainingMs === null) return `開放予定 ${dateLabel}`

  const totalMinutes = Math.ceil(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const remainingLabel = hours > 0 ? `あと ${hours} 時間 ${minutes} 分` : `あと ${minutes} 分`
  return `開放予定 ${dateLabel}（${remainingLabel}）`
}
